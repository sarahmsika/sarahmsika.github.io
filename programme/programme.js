(() => {
  'use strict';
  const sections = [...document.querySelectorAll('.chapter-section')];
  const links = [...document.querySelectorAll('[data-step]')];
  const explored = new Set();
  let ticking = false;
  function update() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    document.documentElement.style.setProperty('--read', Math.min(1, Math.max(0, scrollY / max)));
    const marker = innerHeight * .35;
    let current = -1;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= marker) current = index; });
    links.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
      link.classList.toggle('visited', explored.has(index));
    });
    ticking = false;
  }
  function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) explored.add(sections.indexOf(entry.target)); });
      document.getElementById('explored-count').textContent = `${explored.size} / 5 mouvements explorés`;
      document.documentElement.style.setProperty('--explored', `${explored.size / 5 * 100}%`);
      requestUpdate();
    }, { rootMargin: '-15% 0px -35% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  update();
  document.querySelectorAll('.chapter-section').forEach(section => {
    const button = section.querySelector('.expand-all');
    const modules = [...section.querySelectorAll('.module')];
    function sync() {
      const allOpen = modules.every(module => module.open);
      button.setAttribute('aria-expanded', String(allOpen));
      button.innerHTML = allOpen ? 'Tout replier <span aria-hidden="true">−</span>' : 'Tout déplier <span aria-hidden="true">+</span>';
      requestUpdate();
    }
    button.addEventListener('click', () => {
      const open = !modules.every(module => module.open);
      modules.forEach(module => { module.open = open; });
      sync();
    });
    modules.forEach(module => module.addEventListener('toggle', () => {
      sync();
      if (module.open) document.dispatchEvent(new Event('programme:expand'));
    }));
  });
  document.querySelectorAll('[data-presale-cta]').forEach(link => link.addEventListener('click', () => document.dispatchEvent(new Event('programme:presale'))));
  document.querySelectorAll('.privacy-link').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('cookie-settings').click();
    const details = document.querySelector('#cookie-banner details');
    if (details) details.open = true;
  }));
})();
