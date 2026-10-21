import {transformerConcept as course,transformerChapters as chapters,transformerGroups as groups,transformerLabels as labels,transformerSources as sources} from '../src/concept-transformer.mjs';
import {transformerExperiment as experiment} from '../src/concept-transformer-view.mjs';
import {courseCurriculum,renderConceptCourse} from './render-concept-course.mjs';
const config={course,chapters,groups,labels,sources,experiment,map:[[labels.before,'transformer-blocks'],[labels.qk,'attention-fundamentals'],[labels.block,'transformer-blocks'],[labels.vision,'vision-transformer']],warmups:['stable-softmax','foundation-matmul'],collection:'/practice-sets/attention-and-transformers/',eyebrow:'TRANSFORMER',marker:'data-transformer-course',script:'concept-transformer-ui.js'};
export const transformerCurriculum=(concepts,problems)=>courseCurriculum(concepts,problems,config);
export const renderTransformerConcept=options=>renderConceptCourse(options,config);
