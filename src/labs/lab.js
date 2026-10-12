import {caseVersion,proposal,partial,reference,initialInput,parseExperiment,regressionTests,comparisonTest} from './case.mjs';
import {mountEditor} from '../editor.js';
const zh=document.documentElement.lang==='zh-CN';
const t=(en,cn)=>zh?cn:en;
const $=id=>document.getElementById(id);
const key='tensordrill:review-lab:'+caseVersion;
const initialState=()=>({code:proposal,input:JSON.stringify(initialInput,null,2),note:'',verdict:'',evidence:null,passedCode:null,transfer:false,step:0});
const state=initialState();
let storageOK=true;
try {
  const data=JSON.parse(localStorage.getItem(key)||'null');
  if(data && typeof data==='object') {
    for(const [name,limit] of [['code',20000],['input',8000],['note',4000]]) if(typeof data[name]==='string' && data[name].length<=limit) state[name]=data[name];
    if(['accept','reject','unsure'].includes(data.verdict)) state.verdict=data.verdict;
    if(Number.isInteger(data.step) && data.step>=0 && data.step<=3) state.step=data.step;
    if(data.evidence) { try { state.evidence=parseExperiment(JSON.stringify(data.evidence)); } catch {} }
    if(data.passedCode===state.code) state.passedCode=state.code;
    state.transfer=data.transfer===true;
  }
} catch { storageOK=false; }
function save() {
  try { localStorage.setItem(key,JSON.stringify(state)); $('save-status').textContent=t('Saved in this browser','进度保存在当前浏览器'); }
  catch { storageOK=false; }
  if(!storageOK) {
    $('storage-notice').hidden=false;
    $('storage-notice').textContent=t('Browser storage is unavailable. Keep this tab open or copy your code before leaving.','浏览器存储不可用。离开前请复制代码，或保留当前标签页。');
    $('save-status').textContent=t('Storage unavailable','无法保存到浏览器');
  }
}
$('code-editor').value=state.code;
$('counterexample').value=state.input;
$('review-note').value=state.note;
const editor=mountEditor($('code-editor'));
if(state.verdict) document.querySelector(`input[name="verdict"][value="${state.verdict}"]`).checked=true;
if(state.transfer) document.querySelector('input[name="transfer"][value="invalid"]').checked=true;
function showStep(step,scroll=true) {
  state.step=step;
  for(let i=0;i<4;i++) {
    $('stage-'+i).hidden=i!==step;
    const button=document.querySelector(`[data-step="${i}"]`);
    if(i===step) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
  }
  save();
  if(scroll) { document.querySelector('.lab-heading').scrollIntoView({block:'start'}); $('stage-'+step).querySelector('h2').setAttribute('tabindex','-1'); $('stage-'+step).querySelector('h2').focus({preventScroll:true}); }
}
function updateChecklist() {
  document.querySelector('#stage-2 .experiment-actions .fineprint').textContent=state.evidence
    ? t('18 base cases + your saved counterexample','18 个基础用例 + 你保存的反例')
    : t('18 inspectable local cases','18 个可查看的本地用例');
  const done=[state.verdict==='reject',!!state.evidence,state.passedCode===state.code,state.transfer];
  const labels=[t('Request changes to the proposal','对待审提交要求修改'),t('Save a reproducible counterexample','保存可复现的反例'),t('Current repair passes full regression','当前修复通过完整回归'),t('Complete the transfer check','完成迁移检查')];
  $('completion-list').replaceChildren(...labels.map((label,i)=>{const li=document.createElement('li');li.textContent=(done[i]?'✓ ':'○ ')+label;li.className=done[i]?'done':'';return li;}));
  $('complete-banner').hidden=!done.every(Boolean);
  document.querySelectorAll('.step-mark').forEach((el,i)=>el.textContent=(i===0 ? state.verdict!=='' : i===1 ? done[0]&&done[1] : i===2 ? done[2] : done[3])?'✓':'');
}
document.querySelectorAll('[data-step],[data-go]').forEach(button=>button.addEventListener('click',()=>showStep(Number(button.dataset.step??button.dataset.go))));
document.querySelectorAll('[name="verdict"]').forEach(input=>input.addEventListener('change',()=>{state.verdict=input.value;save();updateChecklist();}));
$('review-note').maxLength=4000;
$('review-note').addEventListener('input',()=>{state.note=$('review-note').value;save();});
$('counterexample').addEventListener('input',()=>{state.input=$('counterexample').value;save();});
$('example-reset').addEventListener('click',()=>{state.input=JSON.stringify(initialInput,null,2);$('counterexample').value=state.input;save();});
function codeChanged() {
  state.code=$('code-editor').value;state.passedCode=null;
  $('regression-summary').textContent=t('Code changed · run regression again','代码已修改 · 请重新运行回归');
  $('regression-summary').className='regression-summary';
  $('regression-results').replaceChildren();
  $('draft-label').textContent=t('Draft saved locally','草稿保存在本地');save();updateChecklist();
}
$('code-editor').addEventListener('input',codeChanged);
let priorCode=null;
function loadCode(code,label) {
  priorCode=$('code-editor').value;
  $('code-editor').value=code;editor.refresh();codeChanged();
  $('draft-label').textContent=label;$('undo-load').hidden=false;
}
$('restore-code').addEventListener('click',()=>loadCode(proposal,t('Original proposal loaded','已载入原待审版本')));
$('load-partial').addEventListener('click',()=>loadCode(partial,t('Suggestion B loaded · not yet verified','已载入建议 B · 尚未验证')));
$('load-membership').addEventListener('click',()=>loadCode(reference,t('Suggestion C loaded · not yet verified','已载入建议 C · 尚未验证')));
$('undo-load').addEventListener('click',()=>{
  if(priorCode===null)return;
  $('code-editor').value=priorCode;priorCode=null;editor.refresh();codeChanged();$('undo-load').hidden=true;
});
document.querySelectorAll('[name="transfer"]').forEach(input=>input.addEventListener('change',()=>{state.transfer=false;$('transfer-feedback').textContent='';save();updateChecklist();}));
$('check-transfer').addEventListener('click',()=>{
  const value=document.querySelector('[name="transfer"]:checked')?.value;
  state.transfer=value==='invalid';
  $('transfer-feedback').textContent=value ? state.transfer
    ? t('Correct. Both fields are present. Exclusivity is checked before either result value or error shape.','正确。两个字段都存在；应先检查互斥约束，再判断结果值或错误结构。')
    : t('Check the contract: can result and error both be present, even when one is null?','再看契约：即使值为 null，result 和 error 可以同时存在吗？')
    : t('Choose a status first.','请先选择一个状态。');
  $('transfer-feedback').className='inline-feedback '+(state.transfer?'good-text':'bad-text');save();updateChecklist();
});

let worker=null,serial=0,active=null,timer=null;
const actionIds=['run-samples','compare','run-regression','load-partial','load-membership','restore-code','undo-load'];
function setBusy(busy) {
  [...actionIds,'restart','confirm-restart'].forEach(id=>$(id).disabled=busy);
  $('code-editor').readOnly=busy;$('counterexample').readOnly=busy;$('stop').hidden=!busy;
  document.querySelector('.runtime-bar').classList.toggle('busy',busy);
}
function finish() {clearTimeout(timer);timer=null;active=null;setBusy(false);}
function textElement(tag,text,className='') {const element=document.createElement(tag);element.textContent=text;element.className=className;return element;}
function failure(message) {
  if(!active)return;
  const kind=active.kind;
  if(kind==='samples') $('sample-results').textContent=message;
  if(kind==='compare') $('comparison').replaceChildren(textElement('p',message,'bad-text'));
  if(kind==='regression') {$('regression-summary').textContent=message;state.passedCode=null;save();updateChecklist();}
  $('runtime-status').textContent=message;worker?.terminate();worker=null;finish();
}
function start(kind,code,tests,extra={}) {
  if(active)return;
  if(new TextEncoder().encode(code).length>20000) { $('runtime-status').textContent=t('Code exceeds the 20 KB practice limit.','代码超出 20 KB 练习限制。');return; }
  active={kind,id:++serial,code,...extra};setBusy(true);
  $('runtime-status').textContent=t('Preparing Python… first download can take a moment.','正在准备 Python… 首次下载可能需要一些时间。');
  timer=setTimeout(()=>failure(t('Python did not load in 90 seconds. Check your connection and retry.','90 秒内未能加载 Python，请检查网络后重试。')),90000);
  if(!worker) {
    worker=new Worker(new URL('../runner.worker.js',import.meta.url));
    worker.onerror=()=>failure(t('Python worker failed. Try again to start a fresh worker.','Python 运行器出错，请重试以启动新的运行器。'));
    worker.onmessage=event=>{
      const data=event.data;
      if(!active || data.requestId!==active.id)return;
      if(data.type==='loading') $('runtime-status').textContent=t('Downloading Python runtime…','正在下载 Python 运行环境…');
      if(data.type==='running') {
        clearTimeout(timer);timer=setTimeout(()=>failure(t('Execution exceeded 15 seconds. The worker was stopped; you can edit and retry.','运行超过 15 秒，已停止运行器；可修改后重试。')),15000);
        $('runtime-status').textContent=t('Running Python locally…','正在本地运行 Python…');
      }
      if(data.type==='progress') $('runtime-status').textContent=t('Running locally','本地运行中')+` · ${data.finished}/${data.total}`;
      if(data.type==='error') failure(t('Runtime error: ','运行环境出错：')+data.error);
      if(data.type==='results') {
        const job=active;
        try {presentResults(job,data.results);} catch {failure(t('Could not read the result. Retry the experiment.','未能读取运行结果，请重新试验。'));return;}
        $('runtime-status').textContent=t('Python ready · all execution stays in this browser','Python 已就绪 · 所有代码均在当前浏览器运行');finish();
      }
    };
  }
  worker.postMessage({type:'run',requestId:active.id,code,tests});
}
function presentResults(job,results) {
  if(job.kind==='samples') {
    const passed=results.filter(row=>row.pass).length;
    $('sample-results').textContent=`${passed}/${results.length} `+t('existing tests passed. These two tests do not cover every valid result.','个现有测试通过。这两个测试并未覆盖所有合法结果。');
    return;
  }
  if(job.kind==='compare') {
    const row=results[0];
    if(!row.pass) { $('comparison').replaceChildren(textElement('p',t('Experiment error: ','试验出错：')+(row.error||''),'bad-text'));return; }
    const payload=row.stdout.split('\n').find(line=>line.startsWith('TD_REVIEW_RESULT='));
    if(!payload) throw new Error('Missing observation');
    const observation=JSON.parse(payload.slice('TD_REVIEW_RESULT='.length));
    const container=$('comparison');
    container.replaceChildren(textElement('div',observation.different ? t('✓ Counterexample found','✓ 找到了有效反例') : t('Outputs agree for this input','这个输入下，输出一致'),'feedback-title '+(observation.different?'good-text':'')));
    const flow=textElement('div','','result-flow');
    const reply=job.input.reply;
    const inputLabel=reply && typeof reply==='object' && Object.hasOwn(reply,'result') ? 'result: '+JSON.stringify(reply.result) : t('Tool reply','工具响应');
    const flowLabels=[inputLabel,t('Proposal: ','待审判定：')+(observation.actual?.status??t('exception','异常')),t('Contract: ','契约判定：')+observation.expected.status];
    for(const [i,text] of flowLabels.entries()) {if(i)flow.append(textElement('b','→'));flow.append(textElement('span',text));}
    container.append(flow);
    const pair=textElement('div','','output-pair');
    for(const [title,value] of [[t('Original proposal','待审实现'),observation.error??observation.actual],[t('Contract reference','契约参考'),observation.expected]]) {
      const box=textElement('div','');box.append(textElement('strong',title),textElement('pre',JSON.stringify(value,null,2)));pair.append(box);
    }
    container.append(pair,textElement('p',observation.different ? t('Saved this input as review evidence. It will also be included when you test your repair.','这个输入已保存为审查证据，验证修复时也会加入回归。') : t('Agreement on one input does not prove the refactor is correct. Try another result value.','一个输入下结果一致，不能证明修改正确。试试其他 result 值。')));
    if(observation.different) {state.evidence=job.input;state.passedCode=null;save();updateChecklist();}
    return;
  }
  const passed=results.filter(row=>row.pass).length;
  const good=passed===results.length;
  state.passedCode=good?job.code:null;
  $('regression-summary').textContent=`${good?'✓ ':''}${passed}/${results.length} `+t('cases passed','项通过');
  $('regression-summary').className='regression-summary '+(good?'good-text':'bad-text');
  $('regression-results').replaceChildren(...results.map((row,i)=>{
    const item=textElement('div','','regression-case');
    const name=textElement('div','','test-name');name.append(textElement('span',row.name),textElement('span',row.pass?t('PASS','通过'):t('FAIL','失败'),row.pass?'good-text':'bad-text'));item.append(name);
    const detail=textElement('details','');detail.append(textElement('summary',t('View test & details','查看用例与详情')));
    if(!row.pass)detail.append(textElement('pre',[row.error_type,row.error,row.location,row.stdout].filter(Boolean).join('\n')));
    detail.append(textElement('pre',job.tests[i].code));item.append(detail);return item;
  }));
  save();updateChecklist();
}
$('run-samples').addEventListener('click',()=>start('samples',proposal,regressionTests(zh?'zh':'en',true)));
$('compare').addEventListener('click',()=>{
  let input;
  try { input=parseExperiment($('counterexample').value); }
  catch(error) {
    const messages={json:t('Enter valid JSON; use double quotes and no trailing commas.','请输入合法 JSON：使用双引号，且末尾不加多余逗号。'),shape:t('Use exactly reply and a non-empty string expected_id (up to 64 characters).','请仅提供 reply 和非空字符串 expected_id（不超过 64 字符）。'),size:t('Input exceeds 8 KB.','输入超过 8 KB。'),depth:t('Input nesting exceeds 12 levels.','输入嵌套超过 12 层。'),number:t('Use finite numbers and integers within the JavaScript safe range.','请使用有限数值，整数须在 JavaScript 安全范围内。')};
    $('comparison').replaceChildren(textElement('p',messages[error.message]||messages.json,'bad-text'));return;
  }
  start('compare',proposal,[comparisonTest(input)],{input});
});
$('run-regression').addEventListener('click',()=>{
  const tests=regressionTests(zh?'zh':'en');
  if(state.evidence)tests.push({...comparisonTest(state.evidence),name:t('Your saved counterexample','你保存的反例'),code:comparisonTest(state.evidence).code+'\nassert observation["different"] is False'});
  state.passedCode=null;updateChecklist();$('regression-summary').textContent=t('Running regression…','正在运行回归…');
  start('regression',$('code-editor').value,tests,{tests});
});
$('stop').addEventListener('click',()=>failure(t('Stopped. You can edit and run again.','已停止，可编辑后重新运行。')));
$('restart').addEventListener('click',()=>{$('restart-confirmation').hidden=false;$('confirm-restart').focus();});
$('cancel-restart').addEventListener('click',()=>{$('restart-confirmation').hidden=true;$('restart').focus();});
$('confirm-restart').addEventListener('click',()=>{Object.assign(state,initialState());save();location.reload();});
$('code-editor').addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();if(!active)$('run-regression').click();}});
if(state.evidence) $('comparison').replaceChildren(textElement('p',t('Your counterexample is saved and will be included in regression. Run Compare to inspect its outputs again.','反例已保存，回归时会加入验证。点击对比运行，可重新查看结果。')));
if(state.passedCode===state.code) $('regression-summary').textContent=t('Previously passed · rerun to see case details','此前已通过 · 可重跑查看用例详情');
showStep(state.step,false);updateChecklist();save();
