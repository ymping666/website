import {scenarios} from './scenarios.mjs';
const bi=(en,zh)=>[en,zh];

export const practiceCategories=[
  {id:'debug',title:bi('Code comprehension & debugging','代码理解与调试'),description:bi('Understand an unfamiliar implementation, locate bugs and verify a repair.','读懂不熟悉的实现，定位问题并验证修复。')},
  {id:'review',title:bi('AI code review','AI 代码审查'),description:bi('Challenge proposed changes with counterexamples and regression tests.','检查 AI 提出的修改，用反例和回归测试验证判断。')},
  {id:'extend',title:bi('Feature iteration','功能迭代'),description:bi('Add new behavior to an existing project while preserving what already works.','接手已有项目，在保留原有行为的基础上扩展功能。')},
];

// All exercises share one directory model, even when their workbenches differ.
export const practiceItems=[
  ...scenarios.map(item=>({...item,path:`labs/${item.id}/`})),
  {
    id:'tool-reply-review',mode:'review',path:'review/',
    title:bi('Review an agent tool adapter','审查 Agent 工具响应适配器'),
    subtitle:bi('Review an AI code simplification, build a counterexample to check tool response handling, then verify your repair with regression tests.','审查 AI 提出的代码简化建议，构造反例检查工具响应是否被正确处理，再用回归测试验证修复。'),
    duration:bi('15–25 min','15–25 分钟'),
    phases:[bi('01 · Review the proposal','01 · 审查修改'),bi('02 · Counterexample & repair','02 · 构造反例与修复'),bi('03 · Regression & transfer','03 · 回归与迁移检查')],
    source:{
      title:'JSON-RPC 2.0 · Response object',url:'https://www.jsonrpc.org/specification#response_object',
      summary:bi('An original exercise based on the JSON-RPC response specification, with a bounded adapter contract for practice.','基于 JSON-RPC 响应规范设计的原创练习，限定单个工具适配器的输入与响应契约。'),
    },
  },
];

export function groupPracticeItems(items=practiceItems) {
  const ids=new Set(),known=new Set(practiceCategories.map(c=>c.id));
  for(const item of items) {
    if(ids.has(item.id)) throw new Error('Duplicate practice exercise: '+item.id);
    if(!known.has(item.mode)) throw new Error('Unknown practice category: '+item.mode);
    ids.add(item.id);
  }
  return practiceCategories.map(category=>({...category,items:items.filter(item=>item.mode===category.id)}));
}
