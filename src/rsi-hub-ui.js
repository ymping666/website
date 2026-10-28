import {renderRouter} from './rsi-router.mjs';
for(const root of document.querySelectorAll('[data-rsi-router]')){
 const select=root.querySelector('select'),reset=root.querySelector('button'),view=root.querySelector('[data-router-view]'),zh=document.documentElement.lang.startsWith('zh');
 const draw=()=>view.innerHTML=renderRouter(select.value,zh);
 select.disabled=reset.disabled=false;
 select.addEventListener('change',draw);reset.addEventListener('click',()=>{select.value='aggressive';draw();});draw();
}
