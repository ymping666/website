#!/usr/bin/env python3
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'scripts/build.mjs'
s=p.read_text()
s=s.replace("import {practiceSets} from '../src/practice-sets.mjs';", "import {practiceSets} from '../src/practice-sets.mjs';\nimport {concepts} from '../src/concepts.mjs';")
a=s.index('const tracks=[')
b=s.index('\nconst byTrackName=',a)
s=s[:a]+'''const tracks=[
 {slug:'ai-foundations',name:'AI Foundations',subtitle:'Linear algebra, stable numerical routines, normalization, activations and RL basics',groups:[['01 · Mathematical kernels','Matrix multiply, softmax, LayerNorm, GELU'],['02 · Positions & representations','Sinusoidal position encodings'],['03 · Decision basics','Epsilon-greedy policy, discounted returns']]},
 {slug:'transformer-vision',name:'Transformer & Vision',subtitle:'Scaled attention, causal masks, multi-head layout, cross-attention, and ViT',groups:[['01 · Attention from scratch','Scaled dot-product attention, causal masking'],['02 · Head shapes & context','Head split/merge and cross-attention'],['03 · Vision Transformer','Patchify, class token and position assembly'],['04 · Encoder building blocks','Pre-LayerNorm residual ordering']]},
 {slug:'generative-models',name:'Generative Models',subtitle:'GAN, DDPM, DDIM, classifier guidance, classifier-free guidance, AdaLN and DiT',groups:[['01 · GAN objectives','Discriminator BCE, non-saturating generator loss, WGAN-GP'],['02 · Diffusion training','Beta schedules, cumulative alphas, q-sampling and epsilon loss'],['03 · Reverse steps','Predict x0, DDPM posterior mean, DDIM step'],['04 · Conditional guidance','Classifier gradients vs classifier-free prediction blending'],['05 · DiT conditioning','AdaLN shift/scale and AdaLN-Zero residual gate']]},
 {slug:'llm-systems',name:'LLM Systems',subtitle:'Retrieval, context budgeting and decoding',groups:[['01 · Retrieval evaluation','Recall@K, MRR, evidence packing'],['02 · Generation internals','Stable top-k sampling weights and inference correctness']]},
 {slug:'agent-engineering',name:'Agent Engineering',subtitle:'Execution loops, tools, context, protocols and evaluation',groups:[['01 · Execution & control','ReAct trace validation, DAG scheduling, reflection limits'],['02 · Tools & reliability','JSON-RPC envelopes, parallel tools, retry backoff'],['03 · Context & memory','Conversation windows, context budgets, trace provenance'],['04 · Protocols & evaluation','MCP, multi-agent boundaries, trace evaluation']]},
 {slug:'world-models',name:'World Models',subtitle:'Belief states, dynamics, rollouts, planning and decision quality',groups:[['01 · State & observation','Markov states, measurement noise, belief updates'],['02 · Representation & dynamics','Gaussian belief moments, diagonal KL, RSSM building blocks'],['03 · Rollouts & planning','State rollouts, prediction error curves, MPC and CEM'],['04 · Decision-aware evaluation','Prediction MSE, planning regret, uncertainty-aware decisions']]},
 {slug:'video-world-models',name:'Video World Models',subtitle:'Video representations, VAE/VQ-VAE, Flow Matching and action-conditioned prediction',groups:[['01 · Video features & tokens','Frame reconstruction, temporal changes and token flattening'],['02 · VAE and discrete latents','Gaussian reparameterization, KL, codebook quantization and perplexity'],['03 · Flow Matching & sampling','Conditional interpolation, velocity targets, Euler and Heun ODE solvers'],['04 · Action-conditioned video futures','Latent rollouts, temporal consistency and causal token likelihoods']]}
];''' +s[b:]
s=s.replace("'Video World Models':'video-world-models'", "'Video World Models':'video-world-models','Transformer & Vision':'transformer-vision','Generative Models':'generative-models'")
s=s.replace("const practicePath=s=>`/practice-sets/${s.slug}/`;", "const practicePath=s=>`/practice-sets/${s.slug}/`;\nconst conceptPath=c=>`/concepts/${c.slug}/`;\nconst coreFirst=[...problems].sort((x,y)=>{const priority={'AI Foundations':0,'Transformer & Vision':1,'Generative Models':2,'LLM Systems':3,'Agent Engineering':4,'World Models':5,'Video World Models':6};return priority[x.track]-priority[y.track]||x.number-y.number});\nconst conceptFor=p=>concepts.find(c=>c.ids.includes(p.id));")
s=s.replace('<a href="${pathHref(\'/tracks/\')}">Topics</a>', '<a href="${pathHref(\'/tracks/\')}">Topics</a><a href="${pathHref(\'/concepts/\')}">Concepts</a>')
s=s.replace("const featured=[agent[0],world.find(p=>p.id==='kalman-scalar-update'),problems.find(p=>p.id==='flow-euler-integration')];", "const featured=['foundation-matmul','attention-scaled-dot-product','vit-patchify','diffusion-forward-sampling'].map(id=>problems.find(p=>p.id===id));")
s=s.replace("AI Coding Challenges — Practice Agents and World Models", "AI Coding Challenges — Start with Attention, ViT and Diffusion")
s=s.replace("Original coding challenges with tested reference solutions in Agents, Video World Models, Flow Matching, VAE and AI fundamentals.", "Original, free AI coding challenges from linear algebra and Attention to ViT, GAN, Diffusion, AdaLN, agents and world models.")
s=s.replace("Short, well-specified Python challenges in agents, world models, video generation components, and AI systems.", "Start with AI fundamentals, implement Attention and ViT, then practice GAN, diffusion and conditional guidance before advanced agents and world models.")
s=s.replace("a('Explore topics','/tracks/','button outline')", "a('Explore fundamentals','/concepts/','button outline')")
s=s.replace("const agent=problems.filter(p=>p.track==='Agent Engineering'),world=problems.filter(p=>p.track==='World Models');", "const agent=problems.filter(p=>p.track==='Agent Engineering'),world=problems.filter(p=>p.track==='World Models');")
s=s.replace("${sectionTitle('Start with these problems','A few fully specified examples from different parts of the taxonomy.')}", "${sectionTitle('Start with foundational problems','Hands-on building blocks, ordered before specialized systems.')}")
s=s.replace("${sectionTitle('Focused practice sets','Hand-picked sequences of fully implemented coding challenges.') }", "${sectionTitle('Fine-grained concept practice','Separate challenges for Attention, ViT, DDPM, guidance, GAN and AdaLN.') }<div class=\"topic-grid\">${concepts.filter(c=>['attention-fundamentals','vision-transformer','gan-objectives','diffusion-forward','diffusion-guidance','dit-conditioning'].includes(c.slug)).map(c=>`<a class=\"topic-card\" href=\"${pathHref(conceptPath(c))}\"><strong>${e(c.title)}</strong><p>${e(c.summary)}</p><span>${c.ids.length} verified exercises →</span></a>`).join('')}</div>${sectionTitle('Focused practice sets','Hand-picked sequences of fully implemented coding challenges.') }")
s=s.replace("${problems.map(row).join('')}","${coreFirst.map(row).join('')}")
s=s.replace("Browse original programming exercises in AI Agents, World Models, Video World Models, LLM Systems, and fundamentals.", "Browse step-by-step problems on Attention, Vision Transformers, GAN, DDPM/DDIM, guidance, AdaLN, Agents and World Models.")
needle="for (const p of problems){"
concept_pages='''// Every fine-grained concept has its own meaningful navigation page with only published challenges.
await output('/concepts/',shell('AI Concepts — practical coding challenges','Learn and practice concrete AI components: Attention, ViT, Diffusion, classifier guidance, GAN, AdaLN and more.',
  `<main class="site-container page-top"><div class="eyebrow">FOUNDATIONS FIRST · INDEPENDENT EXERCISES</div><h1>Concept index</h1><p class="lede narrow">Choose a precise concept and solve its component exercises. Each exercise has standalone tests and a free editorial. This is a coding-practice index, not a course catalog.</p>${['Foundations','Transformers','Generative Models','Applied Systems'].map(f=>`${sectionTitle(f,'Published, independently tested components')}<div class="topic-grid">${concepts.filter(c=>c.family===f).map(c=>`<a class="topic-card" href="${pathHref(conceptPath(c))}"><strong>${e(c.title)}</strong><p>${e(c.summary)}</p><span>${c.ids.length} published exercises →</span></a>`).join('')}</div>`).join('')}${verifiedNotice}</main>`,
  {canonicalPath:'/concepts/'}));
for(const c of concepts){
 const members=c.ids.map(id=>problems.find(p=>p.id===id));
 if(members.some(x=>!x))throw Error('Unpublished concept member: '+c.slug);
 const page=`<main class="site-container page-top"><div class="breadcrumbs">${a('Concepts','/concepts/')} <span>/</span> ${e(c.family)}</div><div class="eyebrow">FOCUSED CODING PRACTICE</div><h1>${e(c.title)}</h1><p class="lede narrow">${e(c.summary)}</p><div class="two-cols"><section>${sectionTitle('Practice in this order',members.length+' published, independently tested coding challenges')}<div class="problem-list">${members.map(row).join('')}</div><p>${a('← All concepts','/concepts/')}</p></section><aside class="taxonomy">${sectionTitle('Before you start','Knowledge dependencies and exercise scope')}<ol><li><strong>Prerequisites</strong><span>${e(c.prerequisites)}</span></li><li><strong>Exercise scope</strong><span>Short, CPU-only and deterministic kernels. A completed problem is not a fully trained model.</span></li><li><strong>Conceptual reference</strong><span><a href="${e(c.reference.url)}" rel="noopener noreferrer" target="_blank">${e(c.reference.title)} ↗</a></span></li></ol></aside></div>${verifiedNotice}</main>`;
 await output(conceptPath(c),shell(c.title+' — coding challenges',c.summary,page,{canonicalPath:conceptPath(c)}));
}
'''
pos=s.index(needle)
s=s[:pos]+concept_pages+s[pos:]
s=s.replace("const examples=`<div class=\"example-block\">", "const concept=conceptFor(p);\n const examples=`<div class=\"example-block\">")
s=s.replace("${a(p.track,'/tracks/'+category+'/')} <span>/</span>", "${a(p.track,'/tracks/'+category+'/')} <span>/</span> ${concept?a(e(concept.title),conceptPath(concept))+' <span>/</span>':''}")
s=s.replace("${a('Related topic: '+p.track,'/tracks/'+category+'/')} ${a('Next practice problem →',fullPath(next))}","${a('Related topic: '+p.track,'/tracks/'+category+'/')} ${concept?a('Concept: '+e(concept.title),conceptPath(concept)):''} ${a('Next practice problem →',fullPath(next))}")
s=s.replace("...practiceSets.map(practicePath),...tracks.map(t=>`/tracks/${t.slug}/`)", "...practiceSets.map(practicePath),...tracks.map(t=>`/tracks/${t.slug}/`),'/concepts/',...concepts.map(conceptPath)")
s=s.replace("6+practiceSets.length+tracks.length+2*problems.length", "7+practiceSets.length+tracks.length+concepts.length+2*problems.length")
p.write_text(s)

q=p.parent/'link-check.mjs'
t=q.read_text().replace("import {practiceSets} from '../src/practice-sets.mjs';", "import {practiceSets} from '../src/practice-sets.mjs';\nimport {concepts} from '../src/concepts.mjs';")
t=t.replace('6+practiceSets.length+trackDirs+2*problems.length','7+practiceSets.length+trackDirs+concepts.length+2*problems.length')
q.write_text(t)
package=p.parents[1]/'package.json'
pp=package.read_text().replace('"version": "0.8.0"','"version": "0.9.0"').replace('"dev": "npm run build && node scripts/serve.mjs"','"dev": "npm run build && node scripts/serve.mjs",\n    "check:foundations": "node scripts/test-foundations-mutations.mjs"')
package.write_text(pp)
print('UPDATED navigation, concept index/hubs, foundation-first ordering and sitemap checks')
