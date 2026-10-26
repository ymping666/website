// Responder URL only; never publish the editor URL or account email.
export const feedbackFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScP_JzwT4TcTRuiEYO21m1vOMvj2yvUpCIRZZEpVFu3ubNWTg/viewform?usp=dialog';

export function validateFeedbackUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port ||
      !((url.hostname === 'docs.google.com' && /^\/forms\/d\/e\/[\w-]+\/viewform$/.test(url.pathname)) ||
        (url.hostname === 'forms.gle' && /^\/[\w-]+$/.test(url.pathname)))) {
    throw new Error('Feedback must link to a public Google Forms responder page');
  }
  return url.href;
}

export function feedbackCard() {
  const url = validateFeedbackUrl(feedbackFormUrl);
  return `<section class="feedback-card" aria-label="Send feedback"><h2>Help improve TensorDrill</h2><p>Report an error, suggest an improvement, or ask a privacy or copyright question.</p><a class="button primary" data-feedback-form href="${url}" target="_blank" rel="noopener noreferrer">Open feedback form →</a><p class="fineprint">Opens Google Forms in a new tab. Reply email is optional.</p></section>`;
}

export const feedbackTranslations = {
  'Last updated: October 26, 2026':'更新日期：2026 年 10 月 26 日',
  'Feedback':'意见反馈',
  'Send feedback':'提交反馈',
  'Help improve TensorDrill':'帮助改进 TensorDrill',
  'Report an error, suggest an improvement, or ask a privacy or copyright question.':'欢迎提交错误、改进建议，以及隐私或版权相关问题。',
  'Open feedback form →':'打开反馈表单 →',
  'Opens Google Forms in a new tab. Reply email is optional.':'将在新标签页打开 Google 表单，回复邮箱为选填。',
};
