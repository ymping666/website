import {transformerConcept} from '../src/concept-transformer.mjs';
import { practiceSets } from '../src/practice-sets.mjs';
import { collectionUnits, collectionProblemIds } from '../src/practice-collections.mjs';

export function collectionCard(collection,{href,e}) {
 return `<a class="collection-card" href="${href(`/practice-sets/${collection.slug}/`)}"><strong>${e(collection.title)}</strong><p>${e(collection.subtitle)}</p><div class="collection-tags">${collection.groups.map(g=>`<span>${e(g.title)}</span>`).join('')}</div><div class="collection-card-bottom"><span>${collectionUnits(collection).length} learning units · ${collectionProblemIds(collection).length} distinct exercises</span><b>Explore topic →</b></div></a>`;
}

export function collectionPage(collection,{href,e,byId}) {
 const link=(label,path,cls='')=>`<a${cls?` class="${cls}"`:''} href="${href(path)}">${label}</a>`;
 const unitCards=group=>group.sets.map(slug=>{
  const unit=practiceSets.find(s=>s.slug===slug);
  const examples=unit.segments.slice(0,2).map(s=>byId[s.id]);
  return `<article class="collection-unit"><div class="collection-unit-heading"><h3>${link(e(unit.title),`/practice-sets/${slug}/`)}</h3><span>${unit.segments.length} published exercises</span></div><p>${e(unit.subtitle)}</p><div class="collection-examples"><span>Examples:</span> ${examples.map(p=>link(e(p.title),`/problems/${p.id}/?set=${slug}`)).join('<span aria-hidden="true"> · </span>')}</div><div class="collection-unit-actions">${link('Open learning unit →',`/practice-sets/${slug}/`)}${link('Start this unit →',`/problems/${unit.segments[0].id}/?set=${slug}`)}</div></article>`;
 }).join('');
 return `<main class="site-container page-top collection-page"><div class="breadcrumbs">${link('Practice sets','/practice-sets/')}<span>/</span>${e(collection.title)}</div><div class="eyebrow">GUIDED PRACTICE</div><h1>${e(collection.title)}</h1><p class="lede narrow">${e(collection.subtitle)}</p>${collection.slug==='attention-and-transformers'?`<p>${link(e(transformerConcept.title),`/concepts/${transformerConcept.slug}/`,'cf-inline-link')}</p>`:''}<p class="collection-total">${collectionUnits(collection).length} learning units · ${collectionProblemIds(collection).length} distinct exercises</p><nav class="collection-jumps" aria-label="Learning directions">${collection.groups.map((g,i)=>`<a href="#${g.slug}"><span>0${i+1}</span>${e(g.title)}</a>`).join('')}</nav>${collection.groups.map((g,i)=>`<section id="${g.slug}" class="collection-section"><header><span class="collection-section-number">0${i+1}</span><h2>${e(g.title)}</h2></header><div class="collection-unit-grid">${unitCards(g)}</div></section>`).join('')}<p class="fineprint">Some units share prerequisite exercises. Exercise totals count each problem once within this topic.</p><p class="end-link">${link('← All practice sets','/practice-sets/')}</p></main>`;
}
