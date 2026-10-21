import {generativeConcept as course,generativeChapters as chapters,generativeGroups as groups,generativeLabels as labels,generativeSources as sources} from '../src/concept-generative.mjs';
import {generativeExperiment as experiment} from '../src/concept-generative-view.mjs';
import {courseCurriculum,renderConceptCourse} from './render-concept-course.mjs';
const config={course,chapters,groups,labels,sources,experiment,map:[[labels.mapDiffusion,'diffusion-forward'],[labels.mapVae,'vae-vqvae'],[labels.mapGan,'gan-objectives'],[labels.mapDit,'dit-conditioning']],warmups:['foundation-layer-normalization','foundation-matmul'],collection:'/practice-sets/generative-models-and-flows/',eyebrow:'GENERATIVE MODELS',marker:'data-generative-course',script:'concept-generative-ui.js'};
export const generativeCurriculum=(concepts,problems)=>courseCurriculum(concepts,problems,config);
export const renderGenerativeConcept=options=>renderConceptCourse(options,config);
