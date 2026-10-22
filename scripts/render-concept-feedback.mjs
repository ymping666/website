import {feedbackConcept as course,feedbackChapters as chapters,feedbackGroups as groups,feedbackLabels as labels,feedbackSources as sources} from '../src/concept-feedback.mjs';
import {feedbackExperiment as experiment} from '../src/concept-feedback-view.mjs';
import {courseCurriculum,renderConceptCourse} from './render-concept-course.mjs';
const config={course,chapters,groups,labels,sources,experiment,map:[[labels.mapExecution,'rlef-execution-feedback'],[labels.mapPrinciples,'constitutional-ai-feedback']],warmups:['stable-softmax'],collection:'/practice-sets/',eyebrow:'EXECUTION & AI FEEDBACK',marker:'data-feedback-course',script:'concept-feedback-ui.js'};
export const feedbackCurriculum=(concepts,problems)=>courseCurriculum(concepts,problems,config);
export const renderFeedbackConcept=options=>renderConceptCourse(options,config);
