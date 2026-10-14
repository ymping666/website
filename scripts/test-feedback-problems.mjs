import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { problems, byId } from '../src/problems.mjs';
import { feedbackProblems } from '../src/feedback-problems.mjs';
import { feedbackConcepts, feedbackSets } from '../src/feedback-curriculum.mjs';
import { pythonCommand } from './config.mjs';

// Catalog growth must not leave late-appended exercises out of the lookup table.
assert.equal(Object.keys(byId).length, problems.length);
assert.equal(new Set(problems.map(p => p.number)).size, problems.length);
for (const p of problems) assert.equal(byId[p.id], p);
for (const topic of feedbackConcepts) for (const id of topic.ids) assert.ok(byId[id]);
for (const set of feedbackSets) for (const step of set.segments) assert.ok(byId[step.id]);

const suite = String.raw`
import copy, itertools, json, math, random, sys
from decimal import Decimal, localcontext
items=json.load(sys.stdin)
scopes={}
for p in items:
    scope={}
    exec(p['solution'],scope)
    scopes[p['id']]=scope
rng=random.Random(241002089)
checks=0
def close(actual,expected):
    global checks
    assert math.isfinite(actual) and math.isclose(actual,expected,rel_tol=1e-11,abs_tol=1e-10),(actual,expected)
    checks+=1

# Exhaust all short boolean histories, including invalid post-stop histories.
f=scopes['rlef-public-test-controller']['rlef_episode_action']
for budget in range(1,7):
    for n in range(8):
        for history in itertools.product([False,True],repeat=n):
            h=list(history)
            invalid=n>budget or any(history[i] for i in range(max(0,n-1)))
            try:
                actual=f(h,budget)
            except ValueError:
                assert invalid
            else:
                assert not invalid
                expected='private_eval' if n==budget or True in history else 'retry'
                assert actual==expected
            assert h==list(history)
            checks+=1

f=scopes['rlef-shaped-turn-reward']['rlef_turn_reward']
for _ in range(500):
    terminal,valid,passed=[rng.choice([False,True]) for _ in range(3)]
    passed=passed and terminal and valid
    a=[-rng.randrange(0,200)/8 for _ in range(rng.randrange(1,30))]
    b=[-rng.randrange(0,200)/8 for _ in a]
    beta=rng.randrange(9)/8
    # Independent branch table and exact dyadic arithmetic inputs.
    base={(True,True):1,(True,False):-1}.get((terminal,passed),0)
    if not terminal: base=0 if valid else -.2
    expected=base-beta*(sum(a)/len(a)-sum(b)/len(b))
    before=(a[:],b[:])
    close(f(valid,terminal,passed,a,b,beta),expected)
    assert (a,b)==before

f=scopes['rlef-undiscounted-advantages']['rlef_advantages']
for _ in range(500):
    r=[rng.randrange(-50,51)/8 for _ in range(rng.randrange(40))]
    v=[rng.randrange(-50,51)/8 for _ in r]
    before=(r[:],v[:])
    actual=f(r,v)
    expected=[sum(r[i:])-v[i] for i in range(len(r))]
    assert actual==expected and actual is not r and (r,v)==before
    checks+=1

f=scopes['constitutional-revision-dataset']['revision_training_pairs']
for _ in range(300):
    revisions=[rng.choice(['',' 保留空格 ','answer','修订']) for _ in range(rng.randrange(12))]
    sources=['draft']+revisions[:-1]
    rounds=[dict(source=s,principle='p',critique='not the target',revision=r) for s,r in zip(sources,revisions)]
    before=copy.deepcopy(rounds)
    assert f(' original prompt ','draft',['p'],rounds)==[(' original prompt ',r) for r in revisions]
    assert rounds==before
    if rounds:
        for field in ['source','principle']:
            bad=copy.deepcopy(rounds)
            bad[rng.randrange(len(bad))][field]='unknown'
            try: f('Q','draft',['p'],bad)
            except ValueError: pass
            else: raise AssertionError('broken revision chain accepted')
    checks+=1

f=scopes['constitutional-soft-preference']['ai_preference_label']
with localcontext() as ctx:
    ctx.prec=80
    for _ in range(500):
        a,b=[-rng.randrange(10000)/8 for _ in range(2)]
        clamp=rng.choice([True,False])
        # Decimal exponentials independently cover ordinary and underflow-scale inputs.
        x,y=Decimal(a).exp(),Decimal(b).exp()
        expected=x/(x+y)
        if clamp: expected=min(Decimal('.6'),max(Decimal('.4'),expected))
        p,q=f(a,b,clamp)
        close(p,float(expected)); close(q,float(1-expected))
        close(p+q,1)
        close(f(b,a,clamp)[0],q)

f=scopes['constitutional-preference-loss']['soft_preference_loss']
with localcontext() as ctx:
    ctx.prec=80
    for _ in range(500):
        a=[rng.randrange(-100,101)/8 for _ in range(rng.randrange(1,15))]
        b=[rng.randrange(-100,101)/8 for _ in a]
        p=[rng.randrange(101)/100 for _ in a]
        before=(a[:],b[:],p[:])
        # Direct high-precision BCE, deliberately different from the stable solution.
        losses=[]
        for aa,bb,pp in zip(a,b,p):
            d=Decimal(aa)-Decimal(bb)
            probability=1/(1+(-d).exp())
            target=Decimal(str(pp))
            losses.append(-target*probability.ln()-(1-target)*(1-probability).ln())
        close(f(a,b,p),float(sum(losses)/len(losses)))
        assert (a,b,p)==before
    for d in [-2000000,-1000,1000,2000000]:
        for p in [0,.4,.5,.6,1]:
            expected=(1-p)*d if d>0 else -p*d
            close(f([d/2],[-d/2],[p]),expected)

# The published suites must kill plausible mistakes, not just accept our solution.
mutations={
 'rlef-public-test-controller':[
  ('no budget stop','len(public_passes) == max_turns','False'),
  ('no success stop','(public_passes and public_passes[-1])','False'),
  ('no history validation','len(public_passes) > max_turns or any(public_passes[:-1])','False')],
 'rlef-shaped-turn-reward':[
  ('sum instead of mean',' / len(policy_logps)',''),
  ('terminal failure zero','else -1.0','else 0.0'),
  ('reversed regularization','base - beta * log_ratio','base + beta * log_ratio'),
  ('clamped sample ratio','beta * log_ratio','beta * max(0,log_ratio)'),
  ('double invalid penalty','return base - beta','return (base if valid_code else base-.2) - beta')],
 'rlef-undiscounted-advantages':[
  ('immediate reward only','remaining += rewards[t]','remaining = rewards[t]'),
  ('discounting','remaining += rewards[t]','remaining = rewards[t] + .9*remaining'),
  ('baseline added','remaining - values[t]','remaining + values[t]'),
  ('clamped advantage','remaining - values[t]','max(0,remaining-values[t])')],
 'constitutional-revision-dataset':[
  ('last revision only','return pairs','return pairs[-1:]'),
  ('critique as target','pairs.append((prompt, current))',"pairs.append((prompt,item['critique']))"),
  ('strip revision','pairs.append((prompt, current))','pairs.append((prompt,current.strip()))'),
  ('no chain check',"item['source'] != current or item['principle'] not in allowed",'False')],
 'constitutional-soft-preference':[
  ('unstable exponentials','peak = max(logp_a, logp_b)','peak = 0'),
  ('hard labels','return p,1-p','return float(p>.5),float(p<=.5)'),
  ('omit clamp','if clamp:','if False:'),
  ('normalize logs','p = a/(a+b)','p = logp_a/(logp_a+logp_b)')],
 'constitutional-preference-loss':[
  ('sum instead of mean','/len(losses)',''),
  ('hard target','d = a-b','p = float(p>.5)\n        d = a-b'),
  ('wrong sign','-p*d','+p*d'),
  ('unstable softplus','max(d,0.0)-p*d+math.log1p(math.exp(-abs(d)))','math.log1p(math.exp(d))-p*d')]
}
killed=0
for problem in items:
    for label,old,new in mutations[problem['id']]:
        assert old in problem['solution'],label
        mutant=problem['solution'].replace(old,new)
        failures=0
        for test in problem['tests']:
            scope={}
            try:
                exec(mutant,scope)
                exec(test['code'],scope)
            except Exception: failures+=1
        assert failures, (problem['id'],'surviving mutant',label)
        killed+=1
print('PASS',checks,'independent exhaustive/randomized feedback-component checks;',killed,'published-suite mutants rejected')
`;
const response=spawnSync(pythonCommand,['-c',suite],{input:JSON.stringify(feedbackProblems),encoding:'utf8'});
if(response.stdout) process.stdout.write(response.stdout);
if(response.stderr) process.stderr.write(response.stderr);
assert.equal(response.status,0,'Feedback component regressions');
