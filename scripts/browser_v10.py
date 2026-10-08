"""Offline Chromium DOM checks; file assets injected to avoid blocked localhost transport."""
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];site=root/'site'
css=(site/'assets/styles.css').read_text()
app=(site/'assets/app.js').read_text().replace("new URL('./runner.worker.js', import.meta.url)", "'/assets/runner.worker.js'")
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    def load(rel,js=False):
        page=browser.new_page(viewport={'width':1440,'height':930},device_scale_factor=1)
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content((site/rel/'index.html').read_text(),wait_until='domcontentloaded')
        page.add_style_tag(content=css)
        if js:page.add_script_tag(content=app)
        return page
    home=load(Path('.'))
    assert '100' in home.locator('main').inner_text()
    assert home.get_by_role('link',name='Concepts',exact=True).count()==1
    assert home.locator('.topic-card').count()>=7
    home.screenshot(path='/mnt/data/frontiercode-v10-home.png',full_page=False)
    print('PASS home: 100 exercises, 7 tracks and concept navigation')
    home.close()
    concept=load(Path('concepts'))
    for label in ['CNN: Convolution and Channel Mixing','BatchNorm: Training vs Inference','RoPE: Rotary Position Embeddings','Adam and AdamW Optimizers']:
        assert concept.get_by_role('link',name=label).count()==1,label
    concept.screenshot(path='/mnt/data/frontiercode-v10-concepts.png',full_page=False)
    print('PASS concept hubs: CNN / normalization / RoPE / optimizer')
    concept.close()
    optim=load(Path('concepts/adam-and-adamw'))
    assert optim.locator('a[href="/problems/optimizer-adamw-update/"]').count()==1
    assert optim.locator('a[href="/problems/optimizer-adam-bias-correction/"]').count()==1
    print('PASS optimizer fine-grained navigation and editorial links')
    optim.close()
    rope=load(Path('problems/rope-position-encoding'),js=True)
    assert rope.locator('#code-editor').is_visible()
    assert rope.locator('#code-editor').input_value().startswith('def apply_rope')
    rope.locator('#code-editor').fill('def apply_rope(tokens, base):\n    return tokens')
    assert rope.locator('#code-editor').input_value().endswith('return tokens')
    assert rope.locator('a[href="/editorials/rope-position-encoding/"]').count()>0
    rope.screenshot(path='/mnt/data/frontiercode-v10-workbench.png',full_page=False)
    print('PASS RoPE code editor, editing and editorial link')
    rope.close()
    editorial=load(Path('editorials/rope-position-encoding'))
    assert editorial.get_by_text('Reference solution (Python)').count()==1
    assert editorial.get_by_text('Common mistake').count()==1
    print('PASS RoPE editorial has reference solution and pitfalls')
    editorial.close()
    practice=load(Path('practice-sets/normalization-and-gradients'))
    assert 'Backpropagate Through a Linear Layer' in practice.locator('main').inner_text()
    print('PASS new normalization/backprop practice-set page')
    practice.close()
    catalog=load(Path('problems'),js=True)
    assert catalog.locator('.problem-row').count()==100
    print('PASS catalog displays exactly 100 challenges')
    catalog.close()
    assert not errors,errors
    print('PASS no uncaught client-side errors in offline Chromium checks')
    browser.close()
