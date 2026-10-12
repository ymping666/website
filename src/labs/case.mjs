// Local-only teaching material. These are curated proposals, not live AI output.
export const caseVersion = 'tool-reply-v1';
export const baseline = `def interpret_tool_reply(reply, expected_id):
    if not isinstance(reply, dict):
        return {"status": "invalid"}
    if reply.get("jsonrpc") != "2.0" or reply.get("id") != expected_id:
        return {"status": "invalid"}
    if ("result" in reply) == ("error" in reply):
        return {"status": "invalid"}

    if "result" in reply:
        return {"status": "ok", "value": reply["result"]}

    error = reply["error"]
    if (not isinstance(error, dict)
            or type(error.get("code")) is not int
            or not isinstance(error.get("message"), str)):
        return {"status": "invalid"}
    return {"status": "error", "error": error}
`;
export const proposal = baseline.replace('if "result" in reply:', 'if reply.get("result"):').replace('    error = reply["error"]', '    if "error" not in reply:\n        return {"status": "invalid"}\n    error = reply["error"]');
export const partial = proposal.replace('if reply.get("result"):', 'if reply.get("result") is not None:');
export const reference = baseline;
export const inputFor = value => ({expected_id:'call-7',reply:{jsonrpc:'2.0',id:'call-7',result:value}});
export const initialInput = inputFor(3);
const reply = (fields, expected_id='call-7') => ({expected_id,reply:{jsonrpc:'2.0',id:'call-7',...fields}});
export const fixtures = [
  ['positive', ['Positive result', '普通数值'], inputFor(3), {status:'ok',value:3}],
  ['error', ['Tool error', '合法错误响应'], reply({error:{code:-32000,message:'Unavailable'}}), {status:'error',error:{code:-32000,message:'Unavailable'}}],
  ['zero', ['Zero is a result', '数值零'], inputFor(0), {status:'ok',value:0}],
  ['false', ['Boolean false', '布尔 false'], inputFor(false), {status:'ok',value:false}],
  ['empty-string', ['Empty string', '空字符串'], inputFor(''), {status:'ok',value:''}],
  ['empty-array', ['Empty array', '空数组'], inputFor([]), {status:'ok',value:[]}],
  ['empty-object', ['Empty object', '空对象'], inputFor({}), {status:'ok',value:{}}],
  ['null', ['Explicit null', '显式 null'], inputFor(null), {status:'ok',value:null}],
  ['nested', ['Preserve nested data', '保留嵌套数据'], inputFor({items:[0,false,null],name:'工具'}), {status:'ok',value:{items:[0,false,null],name:'工具'}}],
  ['wrong-id', ['Wrong request ID', '请求 ID 不匹配'], reply({result:3},'call-8'), {status:'invalid'}],
  ['wrong-version', ['Wrong protocol version', '协议版本不匹配'], reply({jsonrpc:'1.0',result:3}), {status:'invalid'}],
  ['both', ['Result and error together', 'result 与 error 同时存在'], reply({result:0,error:{code:1,message:'Oops'}}), {status:'invalid'}],
  ['neither', ['No result or error', 'result 与 error 均缺失'], reply({}), {status:'invalid'}],
  ['bad-error', ['Malformed error', '错误对象不完整'], reply({error:{code:1}}), {status:'invalid'}],
  ['bool-code', ['Boolean is not an error code', '布尔值不能充当错误码'], reply({error:{code:true,message:'Oops'}}), {status:'invalid'}],
  ['array-envelope', ['Response must be an object', '响应不是对象'], {expected_id:'call-7',reply:[]}, {status:'invalid'}],
  ['error-data', ['Preserve error details', '保留错误附加信息'], reply({error:{code:-32001,message:'Retry later',data:{after:0}}}), {status:'error',error:{code:-32001,message:'Retry later',data:{after:0}}}],
  ['missing-id', ['Missing request ID', '响应缺少 ID'], {expected_id:'call-7',reply:{jsonrpc:'2.0',result:3}}, {status:'invalid'}],
].map(([id,name,input,expected])=>({id,name,input,expected}));

// Structural validation of the experiment input, not of the RPC envelope.
// Malformed RPC responses are in-domain and must produce status=invalid.
export function parseExperiment(text) {
  if (new TextEncoder().encode(text).length > 8000) throw new Error('size');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('json'); }
  if (!value || Array.isArray(value) || typeof value !== 'object'
      || Object.keys(value).sort().join(',') !== 'expected_id,reply'
      || typeof value.expected_id !== 'string' || !value.expected_id.length
      || value.expected_id.length > 64) throw new Error('shape');
  function visit(node, depth=0) {
    if(depth > 12) throw new Error('depth');
    if(typeof node === 'number' && (!Number.isFinite(node) || (Number.isInteger(node) && !Number.isSafeInteger(node)))) throw new Error('number');
    if(node && typeof node === 'object') Object.values(node).forEach(child=>visit(child,depth+1));
  }
  visit(value);
  return value;
}
const pyJson = value => `json.loads(${JSON.stringify(JSON.stringify(value))})`;
export function regressionTests(locale='en', sampleOnly=false) {
  return (sampleOnly ? fixtures.slice(0,2) : fixtures).map(item=>({
    name:item.name[locale==='zh'?1:0],
    code:`import json\ncase = ${pyJson(item.input)}\nexpected = ${pyJson(item.expected)}\nactual = interpret_tool_reply(case["reply"], case["expected_id"])\nassert json.dumps(actual, sort_keys=True, allow_nan=False) == json.dumps(expected, sort_keys=True, allow_nan=False)`
  }));
}
export function comparisonTest(input) {
  return {name:'Counterexample', code:`import json\ncase = ${pyJson(input)}\nreference_scope = {"__name__": "__reference__"}\nexec(${JSON.stringify(reference)}, reference_scope, reference_scope)\nexpected = reference_scope["interpret_tool_reply"](json.loads(json.dumps(case["reply"])), case["expected_id"])\ntry:\n    actual = interpret_tool_reply(json.loads(json.dumps(case["reply"])), case["expected_id"])\n    actual_json = json.dumps(actual, sort_keys=True, allow_nan=False)\n    different = actual_json != json.dumps(expected, sort_keys=True, allow_nan=False)\n    observation = {"actual": actual, "expected": expected, "different": different}\nexcept Exception as error:\n    observation = {"error": type(error).__name__ + ": " + str(error), "expected": expected, "different": True}\nprint("TD_REVIEW_RESULT=" + json.dumps(observation, ensure_ascii=True, allow_nan=False))`};
}
