const menuButton = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');

function menuIsOverlay() {
  return menuButton && window.getComputedStyle(menuButton).display !== 'none';
}

function setMenuOpen(open) {
  if (!menuButton || !mainNav) return;
  const next = Boolean(open) && menuIsOverlay();
  mainNav.classList.toggle('open', next);
  menuButton.classList.toggle('is-open', next);
  menuButton.setAttribute('aria-expanded', next ? 'true' : 'false');
  menuButton.setAttribute('aria-label', next ? 'Close menu' : 'Menu');
  menuButton.textContent = next ? '✕' : '☰';
  document.body.classList.toggle('nav-open', next);
  document.documentElement.classList.toggle('nav-open', next);
}

function closeMenu() {
  setMenuOpen(false);
}

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    setMenuOpen(!mainNav.classList.contains('open'));
  });

  mainNav.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a');
    if (link) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!mainNav.classList.contains('open')) return;
    if (mainNav.contains(event.target) || menuButton.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !mainNav.classList.contains('open')) return;
    closeMenu();
    menuButton.focus();
  });

  window.addEventListener('resize', () => {
    if (!menuIsOverlay()) closeMenu();
  });
}
