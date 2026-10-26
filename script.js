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

const lodgeAudio = document.getElementById('lodgeAudio');
const audioButton = document.querySelector('.audio-btn');
let lanternLit = false;

if (lodgeAudio && audioButton) {
  lodgeAudio.addEventListener('ended', () => {
    lanternLit = false;
    audioButton.textContent = '▶ Light the Lantern';
  });
}

if (window.SJ63Meetings) {
  var nextMeetingLine = document.getElementById('next-meeting-line');
  if (nextMeetingLine) {
    var meeting = window.SJ63Meetings.nextRegularMeeting(new Date());
    var line = window.SJ63Meetings.meetingLine(meeting);
    if (line) nextMeetingLine.textContent = line;
  }
  window.SJ63Meetings.hidePastEvents(document, new Date());
}

function toggleAudio() {
  if (!lodgeAudio || !audioButton) return;

  if (!lanternLit) {
    lanternLit = true;
    audioButton.textContent = '❚❚ Dim the Lantern';
    const playAttempt = lodgeAudio.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        lanternLit = false;
        audioButton.textContent = '▶ Light the Lantern';
      });
    }
  } else {
    lanternLit = false;
    lodgeAudio.pause();
    audioButton.textContent = '▶ Light the Lantern';
  }
}
