import {flowMatchingConceptLesson as lesson,conceptLessonStages} from '../src/concept-lessons.mjs';
import {conceptFlowExperiment,conceptEquation} from '../src/concept-flow-view.mjs';
import {renderAgentConceptLesson} from './render-concept-agent.mjs';
import {renderStateConceptLesson} from './render-concept-state.mjs';
import {renderTransformerConcept} from './render-concept-transformer.mjs';
import {transformerConcept,transformerChapterFor} from '../src/concept-transformer.mjs';
import {renderGenerativeConcept} from './render-concept-generative.mjs';
import {generativeConcept,generativeChapterFor,generativeLabels} from '../src/concept-generative.mjs';
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderConceptLesson({concept,concepts,set,problems,row,a,heading,base}){
 if(concept.slug===transformerConcept.slug||transformerChapterFor(concept.slug))return renderTransformerConcept({concept,concepts,problems,row,a,heading,base});
 if(concept.slug===generativeConcept.slug||(generativeChapterFor(concept.slug)&&concept.slug!=='flow-matching'))return renderGenerativeConcept({concept,concepts,problems,row,a,heading,base});
 if(concept.slug==='state-estimation')return renderStateConceptLesson({concept,problems,row,a,heading,base});
 if(concept.slug==='agent-control')return renderAgentConceptLesson({concept,problems,row,a,heading,base});
 if(concept.slug!==lesson.slug)return null;
 const stages=conceptLessonStages(concept,set,problems),l=lesson.labels,p=items=>items.map(s=>`<p>${e(s)}</p>`).join(''),path=id=>`/problems/${id}/?set=${set.slug}`,ids=stages.flatMap(s=>s.problems.map(p=>p.id)),section=(id,title,body)=>`<section id="${id}" class="cf-section" aria-labelledby="${id}-title"><h2 id="${id}-title">${e(title)}</h2>${body}</section>`;
 return `<main class="site-container page-top concept-lesson" data-concept-lesson="flow-matching"><div class="breadcrumbs">${a('Concepts','/concepts/')} <span>/</span> ${a(e(generativeConcept.title),`/concepts/${generativeConcept.slug}/`)} <span>/</span> ${e(concept.title)}</div><p class="fineprint">${a(e(generativeLabels.back),`/concepts/${generativeConcept.slug}/`)}</p><header class="cf-intro"><div class="eyebrow">FLOW MATCHING</div><h1>${heading}</h1><p class="lede narrow">${e(lesson.lead)}</p><p class="cf-count">${ids.length} published, independently tested coding challenges</p><div class="button-row">${a(e(l.start),path(ids[0]),'button primary')}</div><ol class="cf-workflow" aria-label="${e(lesson.workflow.join(' → '))}">${lesson.workflow.map(s=>`<li>${e(s)}</li>`).join('')}</ol></header><nav class="cf-jumps" aria-label="${e(l.shortcut)}">${[['cf-overview',l.overview],['cf-intuition',l.intuition],['cf-python',l.python],['cf-path',l.path],['cf-myths',l.myths],['cf-reading',l.reading]].map(([id,title])=>`<a href="#${id}">${e(title)}</a>`).join('')}</nav>
 ${section('cf-overview',l.overview,p(lesson.overview))}
 ${section('cf-intuition',l.intuition,p([lesson.intuition[0]])+`<div class="lesson-formula lesson-equations cf-equations">${conceptEquation('x_t = (1-t)*x0+t*x1')}${conceptEquation('u_t = x1-x0')}</div>`+p([lesson.intuition[1]])+conceptFlowExperiment()+`<p class="cf-note">${e(lesson.intuition[2])}</p>`)}
 ${section('cf-python',l.python,`<pre class="code-pre"><code>def interpolate(x0, x1, t):\n    return (1 - t) * x0 + t * x1</code></pre>`+p(lesson.python)+a(e(l.try),path(ids[0]),'cf-inline-link'))}
 ${section('cf-path',l.path,`<p>${e(l.roles)}</p><div class="cf-stages">${stages.map((s,i)=>`<section class="cf-stage" id="cf-stage-${s.key}" aria-labelledby="cf-stage-title-${s.key}"><div class="eyebrow">${i+1} / ${stages.length}</div><h3 id="cf-stage-title-${s.key}">${e(s.title)}</h3><dl><div><dt>${e(l.goal)}</dt><dd>${e(s.goal)}</dd></div><div><dt>${e(l.prerequisites)}</dt><dd>${e(s.prerequisites)}</dd></div></dl><div class="problem-list">${s.problems.map(p=>row(p,{set:set.slug})).join('')}</div></section>`).join('')}</div><p class="fineprint">${e(l.scope)}</p>`+a(e(l.unit),`/practice-sets/${set.slug}/`,'cf-inline-link'))}
 ${section('cf-myths',l.myths,`<div class="cf-myths">${lesson.misconceptions.map(m=>`<article><h3>${e(m.title)}</h3><p>${e(m.explanation)}</p>${a('<span>'+e(l.related)+'</span> <span>'+e(problems.find(p=>p.id===ids[m.index]).title)+'</span>',path(ids[m.index]))}</article>`).join('')}</div>`)}
 ${section('cf-reading',l.reading,`<ul class="cf-reading">${lesson.references.map(r=>`<li><a href="${e(r.url)}" target="_blank" rel="noopener noreferrer">${e(r.title)} ↗</a><p>${e(r.note)}</p></li>`).join('')}</ul>`)}<p>${a('← '+e(l.all),'/concepts/')}</p></main><script type="module" src="${base}assets/concept-lesson-ui.js"></script>`;
}
