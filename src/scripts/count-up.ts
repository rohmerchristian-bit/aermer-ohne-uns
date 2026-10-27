// Counts large numbers up from zero when they scroll into view.
// The final value is in the HTML (and in a visually hidden copy for screen readers),
// so nothing is lost without JavaScript or with reduced motion.

import { formatEuro } from '../lib/format.ts';

const DURATION = 1400;

function animate(el: HTMLElement): void {
  const target = Number(el.dataset.countTo);
  const unit = el.dataset.countUnit;
  if (!Number.isFinite(target) || target <= 0) return;

  // Reserve the final width so the layout does not move while counting.
  el.style.minWidth = `${el.getBoundingClientRect().width}px`;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / DURATION);
    const eased = 1 - (1 - t) ** 4;
    const value = Math.round(target * eased);
    // data-count-unit="Mio. €" shows whole numbers with that unit instead of a full euro amount.
    el.textContent = unit ? `${value} ${unit}` : formatEuro(value);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initCountUp(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const elements = document.querySelectorAll<HTMLElement>('[data-count-to]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        animate(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  elements.forEach((el) => observer.observe(el));
}
