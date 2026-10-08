"""Offline Chromium rendering & UI interaction smoke.

The HTML/CSS is the real generated site. Worker is mocked to validate the
front-end state machine, not the real external Pyodide runtime.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / 'site'
CSS = (SITE/'assets/styles.css').read_text()
APP = (SITE/'assets/app.js').read_text().replace("new URL('./runner.worker.js', import.meta.url)", "'/assets/runner.worker.js'")
PAGE_SCRIPT = '''
window.__storage = new Map();
Object.defineProperty(window, 'localStorage', { configurable: true, value: {
  getItem: k => window.__storage.get(k) ?? null,
  setItem: (k,v) => window.__storage.set(k,String(v))
}});
window.Worker = class MockPythonWorker {
  constructor(url) { this.url=url; this.terminated=false; }
  postMessage(payload) {
    const id=payload.requestId, total=payload.tests.length;
    const passes=payload.code.includes('return len(history)');
    setTimeout(()=>{
      if(this.terminated)return;
      for(const type of ['loading','ready','running'])this.onmessage({data:{type,requestId:id,total}});
      this.onmessage({data:{type:'results',requestId:id,results:payload.tests.map(test=>({
        name:test.name,pass:passes,error:passes?'':'Expected: True\\nActual: None',
        error_type:'FCAssertionError',location:'<test>:1',stdout:'',source:test.code
      }))}});
    },40);
  }
  terminate(){this.terminated=true;}
};
'''

def load_document(page, relative):
    html=(SITE/relative/'index.html').read_text()
    # Web navigations are blocked by the container administrator; inject actual
    # generated HTML/CSS/JS into about:blank for offline browser DOM tests.
    page.set_content(html, wait_until='domcontentloaded')
    page.add_style_tag(content=CSS)
    page.add_script_tag(content=PAGE_SCRIPT)
    page.add_script_tag(content=APP)

with sync_playwright() as playwright:
    browser=playwright.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1366,'height':820},device_scale_factor=1)
    failures=[]
    page.on('pageerror',lambda err: failures.append(str(err)))
    load_document(page, Path('.'))
    assert page.locator('h1').is_visible()
    page.screenshot(path='/mnt/data/frontiercode-v08-home.png', full_page=True)
    print('PASS offline Chromium homepage DOM + screenshot')
    page.close()
    page=browser.new_page(viewport={'width':1366,'height':820},device_scale_factor=1)
    page.on('pageerror',lambda err: failures.append(str(err)))
    load_document(page, Path('problems/agent-retry-guard'))
    assert page.locator('#run-samples').is_visible()
    assert page.locator('#submit-solution').is_visible()
    assert page.locator('#stop-execution').is_hidden()
    assert page.locator('#code-editor').input_value().startswith('def should_stop')
    page.screenshot(path='/mnt/data/frontiercode-v08-workbench.png',full_page=True)
    print('PASS workbench layout + Run samples / Submit / Stop controls')
    page.locator('#run-samples').click()
    page.wait_for_function('document.querySelector("#status").textContent.includes("0/2 passed")')
    assert page.locator('.case-detail.bad').count() == 2
    assert 'Expected: True' in page.locator('.case-error').first.inner_text()
    assert page.locator('#completion-indicator').is_hidden()
    print('PASS mocked worker failure display for two samples; does not mark solved')
    valid="""def should_stop(history, max_attempts):
    if len(history) >= max_attempts:
        return True
    return len(history) >= 3 and history[-3:] == ['error', 'error', 'error']"""
    page.locator('#code-editor').fill(valid)
    page.locator('#submit-solution').click()
    page.wait_for_function('document.querySelector("#status").textContent.includes("5/5 passed")')
    assert page.locator('.case-detail.good').count() == 5
    assert page.locator('#completion-indicator').is_visible()
    saved=page.evaluate("JSON.parse(localStorage.getItem('frontiercode:v04:completed'))['agent-retry-guard']")
    assert saved is True
    assert page.evaluate("JSON.parse(localStorage.getItem('frontiercode:v04:draft:agent-retry-guard'))") == valid
    print('PASS mocked Submit checks all five cases; progress and draft stored')
    # v0.7 regression: a newly published challenge must render an editor and link to its own editorial.
    page.close()
    page=browser.new_page(viewport={'width':1366,'height':820},device_scale_factor=1)
    page.on('pageerror',lambda err: failures.append(str(err)))
    load_document(page, Path('problems/world-discrete-bayes-filter'))
    assert 'Update a Discrete POMDP Belief State' in page.locator('h1').inner_text()
    assert page.locator('#code-editor').input_value().startswith('def belief_update')
    assert page.locator('a[href*="/editorials/world-discrete-bayes-filter/"]').count() > 0
    page.screenshot(path='/mnt/data/frontiercode-v08-bayes-workbench.png',full_page=True)
    print('PASS v0.7 Bayesian belief challenge rendering and dedicated editorial link')
    page.close()
    page=browser.new_page(viewport={'width':1366,'height':820},device_scale_factor=1)
    page.on('pageerror',lambda err: failures.append(str(err)))
    load_document(page, Path('problems/flow-heun-integration'))
    assert 'Heun' in page.locator('h1').inner_text()
    assert page.locator('#code-editor').input_value().startswith('def heun_flow')
    assert page.locator('a[href*="/editorials/flow-heun-integration/"]').count()>0
    page.screenshot(path='/mnt/data/frontiercode-v08-flow-workbench.png',full_page=True)
    print('PASS v0.8 Flow Matching workbench rendering and editorial link')
    page.close()
    page=browser.new_page(viewport={'width':1366,'height':820},device_scale_factor=1)
    page.on('pageerror',lambda err: failures.append(str(err)))
    load_document(page, Path('tracks/video-world-models'))
    assert 'Video World Models' in page.locator('h1').inner_text()
    assert page.locator('a[href*="flow-euler-integration"]').count()>0
    print('PASS v0.8 Video World Models track and problem links')
    assert not failures, failures
    browser.close()
    print('PASS no JavaScript runtime errors in injected offline UI')
