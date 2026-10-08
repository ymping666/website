import { translate } from './locales/zh-ui.mjs';
export const locale = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
const excluded = 'pre,code,textarea,script,style,.case-error';

// Static content is translated at build time. Observe only runtime UI messages.
export function initLanguage() {
  if (locale !== 'zh') return;
  const visit = root => {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement?.closest(excluded)) return;
      const translated = translate(root.nodeValue);
      if (translated !== root.nodeValue) root.nodeValue = translated;
    } else if (root.nodeType === Node.ELEMENT_NODE && !root.matches(excluded)) {
      for (const name of ['title', 'aria-label', 'placeholder']) {
        if (root.hasAttribute(name)) {
          const value = root.getAttribute(name), translated = translate(value);
          if (translated !== value) root.setAttribute(name, translated);
        }
      }
      for (const child of root.childNodes) visit(child);
    }
  };
  visit(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') for (const node of record.addedNodes) visit(node);
      else visit(record.target);
    }
  }).observe(document.body, { childList:true, subtree:true, characterData:true, attributes:true,
    attributeFilter:['title', 'aria-label', 'placeholder'] });
}

export function confirmLocalized(message) {
  return window.confirm(locale === 'zh' ? translate(message) : message);
}
