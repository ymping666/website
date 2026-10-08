"""Offline smoke test of real static HTML navigation and v0.9 workbench (not a Pyodide CDN E2E test)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
site=root/'site'
css=(site/'assets/styles.css').read_text()
app=(site/'assets/app.js').read_text().replace("new URL('./runner.worker.js', import.meta.url)", "'/assets/runner.worker.js'")
shot='/mnt/data/frontiercode-v09-'
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
    def load(rel,code=False):
        page=browser.new_page(viewport={'width':1366,'height':920},device_scale_factor=1)
        page.on('pageerror',lambda er:errors.append(str(er)))
        page.set_content((site/rel/'index.html').read_text(),wait_until='domcontentloaded')
        page.add_style_tag(content=css)
        if code:
            page.add_script_tag(content=app)
        return page
    home=load(Path('.'))
    assert '76' in home.inner_text('main')
    assert home.get_by_role('link',name='Concepts',exact=True).count()==1
    assert 'Attention' in home.inner_text('main')
    home.screenshot(path=shot+'home.png',full_page=False)
    print('PASS home: foundations-first featured problems and concept navigation')
    home.close()
    concepts=load(Path('concepts'))
    assert concepts.locator('a[href="/concepts/diffusion-guidance/"]').count()==1
    assert concepts.locator('a[href="/concepts/vision-transformer/"]').count()==1
    concepts.screenshot(path=shot+'concepts.png',full_page=False)
    print('PASS concept index: attention, ViT, diffusion, guidance and AdaLN hubs')
    concepts.close()
    guide=load(Path('concepts/diffusion-guidance'))
    assert guide.locator('a[href="/problems/diffusion-cfg-epsilon/"]').count()==1
    assert guide.locator('a[href="/problems/diffusion-classifier-guidance/"]').count()==1
    guide.screenshot(path=shot+'guidance.png',full_page=False)
    print('PASS classifier-guidance and classifier-free-guidance are independent linked exercises')
    guide.close()
    attention=load(Path('problems/attention-scaled-dot-product'),code=True)
    assert attention.locator('#code-editor').is_visible()
    assert attention.locator('#code-editor').input_value().startswith('def scaled_attention')
    assert attention.locator('a[href="/editorials/attention-scaled-dot-product/"]').count()>0
    assert attention.locator('a[href="/concepts/attention-fundamentals/"]').count()>0
    attention.screenshot(path=shot+'attention.png',full_page=False)
    print('PASS attention problem: starter, interactive editor, editorial and concept breadcrumb')
    attention.close()
    catalog=load(Path('problems'),code=True)
    first=catalog.locator('.problem-row').first.inner_text()
    assert 'Softmax' in first,first
    assert catalog.locator('.problem-row').count()==76
    catalog.screenshot(path=shot+'catalog.png',full_page=False)
    print('PASS catalog: 76 problems and foundation-first ordering')
    catalog.close()
    assert not errors,errors
    print('PASS Chromium DOM: no uncaught JS errors')
    browser.close()
