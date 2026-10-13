/**
 * Joc X și 0 (Tic-Tac-Toe)
 * Include Mod 1v1 Local, vs AI (Ușor, Mediu, Imbatabil/Minimax),
 * Efecte Sonore Web Audio API, Confetti și Temă Luminoasă/Întunecată.
 */

// Stare Joc
const state = {
  board: Array(9).fill(''),
  currentPlayer: 'X',
  gameActive: true,
  gameMode: 'ai', // 'ai' sau 'pvp'
  difficulty: 'hard', // 'easy', 'medium', 'hard'
  playerSymbol: 'X', // În mod AI: simbolul ales de utilizator
  aiSymbol: 'O',
  scores: {
    X: 0,
    O: 0,
    ties: 0
  },
  soundEnabled: true,
  theme: 'dark'
};

// Combinații Câștigătoare
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

// Elemente DOM
const cells = document.querySelectorAll('.cell');
const turnText = document.getElementById('turn-text');
const turnDot = document.querySelector('.turn-dot');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreTiesEl = document.getElementById('score-ties');
const subXEl = document.getElementById('sub-x');
const subOEl = document.getElementById('sub-o');
const cardXEl = document.getElementById('card-x');
const cardOEl = document.getElementById('card-o');
const bannerEl = document.getElementById('message-banner');
const bannerTextEl = document.getElementById('banner-text');
const btnRestart = document.getElementById('btn-restart');
const btnResetScore = document.getElementById('btn-reset-score');
const soundToggle = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const modeButtons = document.querySelectorAll('#mode-selector .segment');
const difficultyGroup = document.getElementById('difficulty-group');
const diffButtons = document.querySelectorAll('#difficulty-selector .segment');
const symbolGroup = document.getElementById('symbol-group');
const symbolButtons = document.querySelectorAll('.symbol-btn');

// --- SISTEM SUNETE (Web Audio API) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, gainVal = 0.15) {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playMove(symbol) {
    if (symbol === 'X') {
      this.playTone(520, 'sine', 0.12, 0.2);
    } else {
      this.playTone(380, 'triangle', 0.15, 0.2);
    }
  }

  playWin() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.35, 0.2);
        }, idx * 120);
      });
    } catch (e) {}
  }

  playTie() {
    if (!state.soundEnabled) return;
    try {
      this.init();
      const notes = [400, 360, 320];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.2, 0.15);
        }, idx * 120);
      });
    } catch (e) {}
  }
}

const sounds = new SoundEffects();

// --- SISTEM CONFETTI NATIV ---
class ConfettiManager {
  constructor() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    this.particles = [];
    const colors = ['#38bdf8', '#f43f5e', '#a855f7', '#f59e0b', '#10b981', '#ffffff'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: (Math.random() - 0.8) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }
    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let activeParticles = 0;

    for (let p of this.particles) {
      if (p.opacity <= 0.01) continue;
      activeParticles++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravitație
      p.rotation += p.rotSpeed;
      p.opacity -= 0.012;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    if (activeParticles > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

const confetti = new ConfettiManager();

// --- LOGICA JOCULUI ---

function initGame() {
  loadSavedPreferences();
  updateLabels();
  setupEventListeners();
  resetBoard();
}

function loadSavedPreferences() {
  try {
    const savedScores = localStorage.getItem('tictactoe_scores');
    if (savedScores) {
      state.scores = JSON.parse(savedScores);
      updateScoreboardUI();
    }

    const savedTheme = localStorage.getItem('tictactoe_theme');
    if (savedTheme) {
      state.theme = savedTheme;
      applyTheme(state.theme);
    }

    const savedSound = localStorage.getItem('tictactoe_sound');
    if (savedSound !== null) {
      state.soundEnabled = savedSound === 'true';
      soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    }
  } catch (e) {
    console.warn('Eroare la încărcarea preferințelor:', e);
  }
}

function saveScores() {
  try {
    localStorage.setItem('tictactoe_scores', JSON.stringify(state.scores));
  } catch (e) {}
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
  try {
    localStorage.setItem('tictactoe_theme', theme);
  } catch (e) {}
}

function updateLabels() {
  if (state.gameMode === 'ai') {
    difficultyGroup.style.display = 'flex';
    symbolGroup.style.display = 'flex';
    if (state.playerSymbol === 'X') {
      subXEl.textContent = 'Tu (Om)';
      subOEl.textContent = 'Calculator';
    } else {
      subXEl.textContent = 'Calculator';
      subOEl.textContent = 'Tu (Om)';
    }
  } else {
    difficultyGroup.style.display = 'none';
    symbolGroup.style.display = 'none';
    subXEl.textContent = 'Jucător 1';
    subOEl.textContent = 'Jucător 2';
  }
}

function resetBoard() {
  state.board = Array(9).fill('');
  state.currentPlayer = 'X';
  state.gameActive = true;

  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.disabled = false;
  });

  hideBanner();
  updateTurnUI();

  // Dacă e rândul AI-ului să facă prima mutare
  if (state.gameMode === 'ai' && state.currentPlayer === state.aiSymbol) {
    triggerAIMove();
  }
}

function handleCellClick(e) {
  const cell = e.currentTarget;
  const index = parseInt(cell.dataset.index, 10);

  if (!state.gameActive || state.board[index] !== '') return;

  // Dacă e rândul AI-ului, blocăm click-ul uman
  if (state.gameMode === 'ai' && state.currentPlayer === state.aiSymbol) return;

  makeMove(index, state.currentPlayer);
}

function makeMove(index, player) {
  state.board[index] = player;
  const cell = cells[index];
  cell.textContent = player;
  cell.classList.add('taken', player === 'X' ? 'x-mark' : 'o-mark');
  sounds.playMove(player);

  const winResult = checkWinner(state.board);

  if (winResult) {
    handleWin(winResult);
  } else if (state.board.every(c => c !== '')) {
    handleTie();
  } else {
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();

    if (state.gameActive && state.gameMode === 'ai' && state.currentPlayer === state.aiSymbol) {
      triggerAIMove();
    }
  }
}

function triggerAIMove() {
  // Mică întârziere pentru un efect realist
  state.gameActive = false; // blochează temporar input-ul
  updateTurnUI();

  setTimeout(() => {
    // Reactivăm dacă jocul nu s-a încheiat între timp
    state.gameActive = true;
    const aiIndex = getBestAIMove();
    if (aiIndex !== null && state.board[aiIndex] === '') {
      makeMove(aiIndex, state.aiSymbol);
    }
  }, 420);
}

function updateTurnUI() {
  turnText.innerHTML = `Rândul lui <strong>${state.currentPlayer}</strong>`;
  if (state.currentPlayer === 'O') {
    turnDot.classList.add('is-o');
    cardOEl.classList.add('active-turn');
    cardXEl.classList.remove('active-turn');
  } else {
    turnDot.classList.remove('is-o');
    cardXEl.classList.add('active-turn');
    cardOEl.classList.remove('active-turn');
  }
}

function checkWinner(board) {
  for (let combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], combination: combo };
    }
  }
  return null;
}

function handleWin(winResult) {
  state.gameActive = false;
  const { winner, combination } = winResult;

  combination.forEach(idx => {
    cells[idx].classList.add('winner');
  });

  state.scores[winner]++;
  updateScoreboardUI();
  saveScores();

  let message = `Jucătorul ${winner} a câștigat! 🎉`;
  if (state.gameMode === 'ai') {
    if (winner === state.playerSymbol) {
      message = 'Felicitări! Ai învins calculatorul! 🏆';
    } else {
      message = 'Calculatorul a câștigat runda! 🤖';
    }
  }

  showBanner(message, winner === 'X' ? 'win-x' : 'win-o');
  sounds.playWin();
  confetti.start();
}

function handleTie() {
  state.gameActive = false;
  state.scores.ties++;
  updateScoreboardUI();
  saveScores();

  showBanner('Egalitate! O rundă disputată strâns! 🤝', 'tie');
  sounds.playTie();
}

function showBanner(text, typeClass) {
  bannerTextEl.textContent = text;
  bannerEl.className = `message-banner show ${typeClass}`;
}

function hideBanner() {
  bannerEl.className = 'message-banner';
  bannerTextEl.textContent = '';
}

function updateScoreboardUI() {
  scoreXEl.textContent = state.scores.X;
  scoreOEl.textContent = state.scores.O;
  scoreTiesEl.textContent = state.scores.ties;
}

// --- INTELIGENȚĂ ARTIFICIALĂ (AI) ---

function getAvailableMoves(board) {
  const moves = [];
  board.forEach((cell, idx) => {
    if (cell === '') moves.push(idx);
  });
  return moves;
}

function getBestAIMove() {
  const availableMoves = getAvailableMoves(state.board);
  if (availableMoves.length === 0) return null;

  if (state.difficulty === 'easy') {
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  if (state.difficulty === 'medium') {
    // 50% șanse să facă o mutare optimă, altfel mutare aleatoare
    if (Math.random() < 0.5) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Dificultate Imbatabilă (Minimax) sau Verificare Tactică Medie
  return minimaxBestMove(state.board, state.aiSymbol);
}

function minimaxBestMove(board, aiPlayer) {
  const humanPlayer = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves = getAvailableMoves(board);

  // Dacă e prima mutare pe o tablă goală, alege centru sau colț rapid
  if (availableMoves.length === 9) {
    return 4; // Centru
  }

  let bestScore = -Infinity;
  let bestMove = availableMoves[0];

  for (let move of availableMoves) {
    board[move] = aiPlayer;
    let score = minimax(board, 0, false, aiPlayer, humanPlayer, -Infinity, Infinity);
    board[move] = '';

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer, alpha, beta) {
  const winResult = checkWinner(board);

  if (winResult) {
    if (winResult.winner === aiPlayer) return 10 - depth;
    if (winResult.winner === humanPlayer) return depth - 10;
  }

  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) return 0; // Egalitate

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (let move of availableMoves) {
      board[move] = aiPlayer;
      let evalScore = minimax(board, depth + 1, false, aiPlayer, humanPlayer, alpha, beta);
      board[move] = '';
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let move of availableMoves) {
      board[move] = humanPlayer;
      let evalScore = minimax(board, depth + 1, true, aiPlayer, humanPlayer, alpha, beta);
      board[move] = '';
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha-beta pruning
    }
    return minEval;
  }
}

// --- EVENIMENTE DOM ---

function setupEventListeners() {
  cells.forEach(cell => {
    cell.addEventListener('click', handleCellClick);
  });

  btnRestart.addEventListener('click', () => {
    resetBoard();
  });

  btnResetScore.addEventListener('click', () => {
    if (confirm('Ești sigur că dorești să resetezi scorul?')) {
      state.scores = { X: 0, O: 0, ties: 0 };
      saveScores();
      updateScoreboardUI();
    }
  });

  // Schimbare Mod Joc
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.gameMode = btn.dataset.mode;
      updateLabels();
      resetBoard();
    });
  });

  // Schimbare Dificultate
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.difficulty = btn.dataset.diff;
      resetBoard();
    });
  });

  // Alegere Simbol
  symbolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      symbolButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.playerSymbol = btn.dataset.symbol;
      state.aiSymbol = state.playerSymbol === 'X' ? 'O' : 'X';
      updateLabels();
      resetBoard();
    });
  });

  // Comutare Sunet
  soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundIcon.textContent = state.soundEnabled ? '🔊' : '🔇';
    try {
      localStorage.setItem('tictactoe_sound', state.soundEnabled);
    } catch (e) {}
  });

  // Comutare Temă
  themeToggle.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
  });
}

// Pornire Aplicație
document.addEventListener('DOMContentLoaded', initGame);
