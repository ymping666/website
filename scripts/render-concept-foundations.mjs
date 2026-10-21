import {foundationsConcept as course,foundationsChapters as chapters,foundationsGroups as groups,foundationsLabels as labels,foundationsSources as sources} from '../src/concept-foundations.mjs';
import {foundationsExperiment as experiment} from '../src/concept-foundations-view.mjs';
import {courseCurriculum,renderConceptCourse} from './render-concept-course.mjs';
const config={course,chapters,groups,labels,sources,experiment,map:[[labels.mapNumbers,'numerical-building-blocks'],[labels.mapSpatial,'cnn-convolutions'],[labels.mapNorm,'batch-normalization'],[labels.mapGrad,'gradient-backpropagation'],[labels.mapUpdate,'sgd-and-gradient-clipping']],warmups:['stable-softmax','foundation-matmul'],collection:'/practice-sets/neural-network-training/',eyebrow:'NEURAL NETWORK FOUNDATIONS',marker:'data-foundations-course',script:'concept-foundations-ui.js'};
export const foundationsCurriculum=(concepts,problems)=>courseCurriculum(concepts,problems,config);
export const renderFoundationsConcept=options=>renderConceptCourse(options,config);
