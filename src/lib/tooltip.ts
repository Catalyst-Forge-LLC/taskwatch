import tippy, { type Instance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';

export function tooltip(node: HTMLElement, content: string) {
  const instance: Instance = tippy(node, {
    content, theme: 'taskwatch', placement: 'top', delay: [250, 0],
    duration: [140, 100], maxWidth: 260, touch: ['hold', 400],
    appendTo: () => document.body,
    animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : 'fade'
  });
  return { update(next: string) { instance.setContent(next); }, destroy() { instance.destroy(); } };
}
