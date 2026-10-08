import {pythonCommand} from './config.mjs';
import {problems} from '../src/problems.mjs';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const titles=new Set(),ids=new Set();
for(const p of problems){
 if(titles.has(p.title)||ids.has(p.id))throw Error('Duplicate title or ID');titles.add(p.title);ids.add(p.id);
 if(!p.solution||!p.starter||!p.description||p.requirements.length<3||p.tests.length<4||!p.hints.length||!p.explanation?.length||!p.complexity)throw Error('Incomplete '+p.id);
}
const src=`import json,sys\nitems=json.load(sys.stdin)\nn=0\nfor p in items:\n    for test in p['tests']:\n        scope={}\n        try:\n            exec(p['solution'],scope,scope)\n            exec(test['code'],scope,scope)\n        except Exception as exc:\n            print('FAIL',p['id'],test['name'],repr(exc))\n            sys.exit(1)\n        n+=1\nprint('PASS',n,'reference-solution assertions,',len(items),'challenges')`;
const r=spawnSync(pythonCommand,['-c',src],{input:JSON.stringify(problems),encoding:'utf8'});
if(r.stdout)process.stdout.write(r.stdout);if(r.stderr)process.stderr.write(r.stderr);if(r.status!==0)process.exit(1);
let count=0;for(const p of problems){for(const prefix of ['problems','editorials']){let path=`../site/${prefix}/${p.id}/index.html`;const file=await readFile(new URL(path,import.meta.url),'utf8');if(!file.includes(p.title)||file.length<1200)throw Error('Missing '+path);count++}}
for(const path of ['../site/index.html','../site/problems/index.html','../site/tracks/index.html','../site/standards/index.html']){await readFile(new URL(path,import.meta.url),'utf8');count++}
console.log('PASS',count,'generated routes spot-checked; unique IDs and editorial completeness');
