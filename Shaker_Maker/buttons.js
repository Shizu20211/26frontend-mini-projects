'use strict';
// Hop defaults: 200ms, matched widths, cyclic first/last direction.
// Animate transforms only; interrupted transitions resume at the visible position.
const buttonMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const buttonGroups = [
  ui.backgroundOptions,
  ui.machineOptions,
  ui.hangOptions,
  document.querySelector('.motion-options'),
];
for (const group of buttonGroups) {
  const controls = [...group.querySelectorAll('button, label')];
  const surfaces = controls.map((control) =>
    control.tagName === 'LABEL' ? control.querySelector('span') : control,
  );
  const widths = surfaces.map((surface) => surface.offsetWidth);
  const fills = surfaces.map((surface) => {
    const fill = document.createElement('span');
    fill.className = 'button-fill';
    fill.setAttribute('aria-hidden', 'true');
    surface.classList.add('hop-button');
    surface.prepend(fill);
    return fill;
  });
  const selectedIndex = () =>
    controls.findIndex((control) =>
      control.tagName === 'LABEL'
        ? control.querySelector('input').checked
        : control.getAttribute('aria-pressed') === 'true',
    );
  let previous = -1;
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const index = surfaces.indexOf(entry.target);
      widths[index] = entry.borderBoxSize?.[0]?.inlineSize || entry.target.offsetWidth;
    }
  });
  surfaces.forEach((surface) => resizeObserver.observe(surface));
  function settle(current) {
    fills.forEach((fill, index) => {
      fill.getAnimations().forEach((animation) => animation.cancel());
      fill.style.transform = index === current ? 'translateX(0)' : 'translateX(110%)';
      surfaces[index].classList.toggle('hop-settled', index === current);
    });
  }
  function sync() {
    const current = selectedIndex();
    if (current === previous) return;
    if (previous < 0 || current < 0 || buttonMotionPreference.matches) {
      settle(current);
      previous = current;
      return;
    }
    let direction = current > previous ? 1 : -1;
    if (controls.length > 2 && previous === controls.length - 1 && current === 0) direction = 1;
    if (controls.length > 2 && previous === 0 && current === controls.length - 1) direction = -1;
    // Batch reads before writes so rapid clicks don't reset an in-flight fill.
    const snapshots = fills.map((fill) => ({
      active: fill.getAnimations().length > 0,
      transform: getComputedStyle(fill).transform,
    }));
    const matchedWidth = Math.max(widths[previous], widths[current]);
    fills.forEach((fill, index) => {
      const snapshot = snapshots[index];
      surfaces[index].classList.remove('hop-settled');
      fill.getAnimations().forEach((animation) => animation.cancel());
      const target = index === current ? 'translateX(0)' : `translateX(${-direction * 110}%)`;
      fill.style.transform = target;
      if (index !== current && index !== previous && !snapshot.active) return;
      const from =
        index === current && !snapshot.active
          ? `translateX(${direction * 110}%) scaleX(${widths[index] ? matchedWidth / widths[index] : 1})`
          : snapshot.transform;
      const animation = fill.animate([{ transform: from }, { transform: target }], {
        duration: 200,
        easing: 'ease-out',
      });
      if (index === current) {
        animation.onfinish = () => {
          if (selectedIndex() === index) surfaces[index].classList.add('hop-settled');
        };
      }
    });
    previous = current;
  }
  const observer = new MutationObserver(sync);
  observer.observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  group.addEventListener('change', sync);
  if (group.matches('.motion-options')) {
    const originalRender = renderMotionControls;
    renderMotionControls = function (item) {
      originalRender(item);
      sync();
    };
  }
  buttonMotionPreference.addEventListener('change', () => {
    if (buttonMotionPreference.matches) settle(selectedIndex());
  });
  sync();
}
