let currentStep = 0, easterClicks = 0, musicStarted = false;

document.getElementById('passwordInput').focus();

function playDing() {
  try {
    const c = document.getElementById('hintSound').cloneNode(true);
    c.volume = 1; c.play().catch(() => {});
  } catch(e) {}
}

function startMusic() {
  if (musicStarted) return;
  const bg = document.getElementById('bgMusic');
  bg.volume = 0.3; bg.play().catch(() => {});
  musicStarted = true;
}
document.addEventListener('click', () => startMusic(), { once: true });

// Летающие сердечки
function createHearts() {
  const container = document.getElementById('heartsBg');
  const hearts = ['❤️', '💖', '💕', '💗', '💘', '🌹', '✨', '🌸'];
  const count = window.innerWidth > 768 ? 40 : 25;
  for (let i = 0; i < count; i++) {
    const h = document.createElement('div');
    h.className = 'heart-particle';
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    h.style.fontSize = (10 + Math.random() * 28) + 'px';
    h.style.left = Math.random() * 100 + '%';
    h.style.animationDuration = (8 + Math.random() * 18) + 's';
    h.style.animationDelay = -(Math.random() * 25) + 's';
    container.appendChild(h);
  }
}
createHearts();

// Золотые искры
function createSparkles() {
  const container = document.getElementById('sparkleBg');
  const count = window.innerWidth > 768 ? 30 : 18;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.animationDuration = (1.5 + Math.random() * 3) + 's';
    s.style.animationDelay = -(Math.random() * 4) + 's';
    const size = 2 + Math.random() * 3;
    s.style.width = size + 'px'; s.style.height = size + 'px';
    container.appendChild(s);
  }
}
createSparkles();

// Пасхалка
function handleEasterClick() {
  easterClicks++;
  const counter = document.getElementById('easterCounter');
  counter.textContent = easterClicks; counter.classList.add('show');
  document.getElementById('easterBtn').style.transform = 'scale(1.3)';
  setTimeout(() => document.getElementById('easterBtn').style.transform = '', 200);
  if (easterClicks >= 5) {
    easterClicks = 0; counter.classList.remove('show');
    document.getElementById('easterEggModal').classList.add('active');
    launchConfetti(80);
  }
  clearTimeout(handleEasterClick._t);
  handleEasterClick._t = setTimeout(() => { easterClicks = 0; counter.classList.remove('show'); }, 3000);
}
function closeEasterEgg() { document.getElementById('easterEggModal').classList.remove('active'); }

// Пароль
function checkPassword() {
  const val = document.getElementById('passwordInput').value.trim();
  const err = document.getElementById('passwordError');
  if (val === '2022') {
    err.textContent = ''; err.classList.remove('visible');
    document.getElementById('screenPassword').classList.remove('active');
    document.getElementById('screenStart').classList.add('active');
    document.getElementById('screenStart').querySelector('.card').classList.add('fade-in');
  } else {
    err.textContent = 'Неверный пароль'; err.classList.add('visible');
    err.classList.remove('shake'); void err.offsetWidth; err.classList.add('shake');
    document.getElementById('passwordInput').value = '';
  }
}
document.getElementById('passwordInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkPassword(); });

// Переходы
function switchScreen(hideId, showId) {
  const h = document.getElementById(hideId), s = document.getElementById(showId);
  h.querySelector('.card')?.classList.add('fade-out');
  setTimeout(() => {
    h.classList.remove('active'); s.classList.add('active');
    const c = s.querySelector('.card');
    if (c) { c.classList.remove('fade-out'); c.classList.add('fade-in'); }
  }, 350);
}
function goToStep(step) { currentStep = step; switchScreen('screenStart', 'screenStep' + step); }
function showHint(step) { document.getElementById('hint' + step).classList.add('show'); playDing(); }
function completeStep(step) { playDing(); launchConfetti(50); setTimeout(() => openPuzzle(step), 800); }

// Пазл
let puzzleStep = 0, pieces = [], draggedEl = null;
function openPuzzle(step) {
  puzzleStep = step;
  const overlay = document.getElementById('puzzleOverlay'), grid = document.getElementById('puzzleGrid'), success = document.getElementById('puzzleSuccess');
  overlay.classList.add('active'); success.classList.remove('active'); grid.style.display = 'grid';
  grid.innerHTML = ''; pieces = [];
  const indices = Array.from({length: 9}, (_, i) => i);
  shuffle(indices);
  for (let i = 0; i < 9; i++) {
    const idx = indices[i], piece = document.createElement('div');
    piece.className = 'puzzle-piece'; piece.dataset.correct = i; piece.dataset.current = idx;
    piece.style.backgroundImage = `url('photo${step}.jpg')`;
    piece.style.backgroundPosition = `${-(idx % 3) * 100}% ${-Math.floor(idx / 3) * 100}%`;
    piece.style.backgroundSize = '300% 300%';
    const num = document.createElement('div'); num.className = 'num'; num.textContent = idx + 1; piece.appendChild(num);
    piece.draggable = true;
    piece.addEventListener('dragstart', onDragStart); piece.addEventListener('dragend', onDragEnd);
    piece.addEventListener('dragover', onDragOver); piece.addEventListener('drop', onDrop);
    piece.addEventListener('touchstart', onTouchStart, { passive: false });
    piece.addEventListener('touchmove', onTouchMove, { passive: false });
    piece.addEventListener('touchend', onTouchEnd);
    grid.appendChild(piece); pieces.push(piece);
  }
}
function onDragStart(e) { draggedEl = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function onDragEnd() { this.classList.remove('dragging'); }
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function onDrop(e) { e.preventDefault(); if (draggedEl !== this) { swapPieces(draggedEl, this); checkPuzzle(); } }

let touchPiece = null, touchClone = null;
function onTouchStart(e) {
  e.preventDefault(); touchPiece = this; this.classList.add('dragging');
  touchClone = this.cloneNode(true);
  touchClone.style.cssText = 'position:fixed;z-index:1000;pointer-events:none;opacity:.85;transition:none;border-radius:10px;';
  const r = this.getBoundingClientRect(); touchClone.style.width = r.width + 'px'; touchClone.style.height = r.height + 'px';
  document.body.appendChild(touchClone);
  const t = e.touches[0]; touchClone.style.left = (t.clientX - r.width / 2) + 'px'; touchClone.style.top = (t.clientY - r.height / 2) + 'px';
}
function onTouchMove(e) {
  e.preventDefault(); if (!touchClone) return;
  const t = e.touches[0], r = touchClone.getBoundingClientRect();
  touchClone.style.left = (t.clientX - r.width / 2) + 'px'; touchClone.style.top = (t.clientY - r.height / 2) + 'px';
}
function onTouchEnd(e) {
  if (!touchPiece || !touchClone) return; touchPiece.classList.remove('dragging');
  const t = e.changedTouches[0]; touchClone.remove(); touchClone = null;
  const el = document.elementFromPoint(t.clientX, t.clientY);
  if (el?.closest('.puzzle-piece') && el.closest('.puzzle-piece') !== touchPiece) { swapPieces(touchPiece, el.closest('.puzzle-piece')); checkPuzzle(); }
  touchPiece = null;
}
function swapPieces(a, b) {
  [a.innerHTML, b.innerHTML] = [b.innerHTML, a.innerHTML];
  [a.style.backgroundImage, b.style.backgroundImage] = [b.style.backgroundImage, a.style.backgroundImage];
  [a.style.backgroundPosition, b.style.backgroundPosition] = [b.style.backgroundPosition, a.style.backgroundPosition];
  [a.dataset.current, b.dataset.current] = [b.dataset.current, a.dataset.current];
}
function checkPuzzle() {
  if (pieces.every(p => p.dataset.correct === p.dataset.current)) {
    document.getElementById('puzzleGrid').style.display = 'none';
    document.getElementById('puzzleSuccess').classList.add('active');
    launchConfetti(60);
  }
}
function closePuzzle() {
  document.getElementById('puzzleOverlay').classList.remove('active');
  if (puzzleStep === 1) switchScreen('screenStep1', 'screenStep2');
  else if (puzzleStep === 2) switchScreen('screenStep2', 'screenStep3');
  else switchScreen('screenStep3', 'screenFinal');
}

function showFinalPhoto() { launchConfetti(100); setTimeout(() => document.getElementById('finalPhotoOverlay').classList.add('active'), 600); }
function closeFinalPhoto() {
  document.getElementById('finalPhotoOverlay').classList.remove('active');
  document.getElementById('screenFinal').classList.remove('active');
  const s = document.getElementById('screenImprints'); s.style.display = 'flex'; s.classList.add('active');
  s.querySelector('.card')?.classList.add('fade-in');
}

function launchConfetti(count) {
  const c = document.getElementById('confettiContainer');
  const colors = ['#f5a3b5', '#e8c97a', '#e07a8a', '#c9a050', '#fbbf24', '#f472b6'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div'); p.className = 'confetti-piece';
    p.style.left = (25 + Math.random() * 50) + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : (Math.random() > 0.5 ? '2px' : '0');
    const size = 5 + Math.random() * 10; p.style.width = size + 'px'; p.style.height = size + 'px';
    const dur = 2 + Math.random() * 2;
    p.style.animation = `confettiFall ${dur}s ${Math.random() * 0.5}s ease-out forwards`;
    c.appendChild(p); setTimeout(() => p.remove(), (dur + 1) * 1000);
  }
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

console.log('%c❤️ Привет! Попробуй найти пасхалку... ❤️', 'color:#f5a3b5;font-size:16px;font-weight:bold;');