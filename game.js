// === Dark Forest Runner (v2.0) - Sistem Level Sederhana ===

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

// UI
const scoreText = document.getElementById("score");
const messageText = document.getElementById("message");
const livesText = document.getElementById("lives");

// Audio
const bgMusic = document.getElementById("bgMusic");
const jumpSound = document.getElementById("jumpSound");
const loseSound = document.getElementById("loseSound");
const winSound = document.getElementById("winSound");
bgMusic.volume = 0.5;
bgMusic.play();

// Assets
const playerImg = new Image();
playerImg.src = "assets/images/player.png";
const enemyImg = new Image();
enemyImg.src = "assets/images/enemy.png";
const crystalImg = new Image();
crystalImg.src = "assets/images/crystal.png";
const portalImg = new Image();
portalImg.src = "assets/images/portal.png";
const bgImg = new Image();
bgImg.src = "assets/images/bg.png";
const bulletImg = new Image();
bulletImg.src = "assets/images/bullet.png";

// Game State
let score = 0;
let lives = 3;
let cameraX = 0;
let gameOver = false;
let started = false;
let invincible = false;
let invincibleTimer = 0;
let currentLevel = 0;
let paused = false;

// Input
let keys = {};
document.addEventListener("keydown", (e) => keys[e.code] = true);
document.addEventListener("keyup", (e) => keys[e.code] = false);

// Player
const player = {
  x: 100, y: 400, w: 40, h: 60,
  vx: 0, vy: 0,
  speed: 5,
  jumping: false,
  grounded: false
};

// Ground
const ground = { x: 0, y: 500, w: 3000, h: 50 };

// Level Data
const levels = [
  {
    enemies: [
      { x: 700, y: 460, dir: 1 },
      { x: 1000, y: 460, dir: -1 },
      { x: 1400, y: 460, dir: 1 }
    ],
    crystals: [
      { x: 400, y: 460 },
      { x: 800, y: 460 },
      { x: 1200, y: 460 },
      { x: 1600, y: 460 }
    ],
    portal: { x: 2500, y: 460 }
  },
  {
    enemies: [
      { x: 900, y: 460, dir: 1 },
      { x: 1300, y: 460, dir: -1 },
      { x: 1700, y: 460, dir: 1 }
    ],
    crystals: [
      { x: 500, y: 460 },
      { x: 1000, y: 460 },
      { x: 1500, y: 460 },
      { x: 2000, y: 460 }
    ],
    portal: { x: 2800, y: 460 }
  }
];

let enemies = [];
let crystals = [];
let portal = {};
let bullets = [];
let particles = [];

function loadLevel(levelIndex) {
  const level = levels[levelIndex];
  enemies = level.enemies.map(e => ({ ...e, w: 40, h: 40, speed: 2, alive: true }));
  crystals = level.crystals.map(c => ({ ...c, collected: false }));
  portal = { ...level.portal, w: 40, h: 40 };
  ground.w = 3000;
}

function spawnParticles(x, y, color = "orange") {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      size: 4,
      life: 25,
      color
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
}

function resetGame() {
  player.x = 100; player.y = 400;
  player.vx = 0; player.vy = 0;
  score = 0; cameraX = 0;
  lives = 3;
  gameOver = false; started = false; invincible = false;
  currentLevel = 0;
  loadLevel(currentLevel);
  particles = [];
  bullets = [];
  messageText.textContent = "Tekan ← → untuk gerak, SPACE lompat, R untuk mulai ulang.";
  bgMusic.currentTime = 0; bgMusic.play();
  livesText.textContent = "❤❤❤";
}
resetGame();

document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "KeyR") resetGame();
});

function clampPlayerPosition() {
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > ground.w) player.x = ground.w - player.w;
  if (player.y < 0) player.y = 0;
}

function update() {
  if (gameOver) return;
  if (!started && (keys["ArrowLeft"] || keys["ArrowRight"] || keys["Space"])) {
    started = true;
    messageText.textContent = "";
  }
  if (!started) return;

  if (invincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) invincible = false;
  }

  if (keys["ArrowLeft"]) player.vx = -player.speed;
  else if (keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  if (keys["Space"] && player.grounded && !player.jumping) {
    player.vy = -12;
    player.jumping = true;
    player.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
    spawnParticles(player.x + player.w / 2, player.y + player.h, "white");
  }

  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;
  clampPlayerPosition();

  if (player.y + player.h > ground.y) {
    player.y = ground.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
  }

  if (player.y > canvas.height) {
    lives--;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "red");
    if (lives <= 0) {
      gameOver = true;
      loseSound.currentTime = 0; loseSound.play();
      messageText.textContent = "Kamu jatuh! Tekan R untuk restart.";
      messageText.className = "lose";
    } else {
      player.x = 100;
      player.y = 400;
      player.vx = 0;
      player.vy = 0;
      messageText.textContent = `Kamu jatuh! Sisa nyawa: ${lives}`;
      setTimeout(() => { messageText.textContent = ""; }, 1000);
    }
    return;
  }

  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    enemy.x += enemy.dir * enemy.speed;
    if (enemy.x < 600 || enemy.x > 1600) enemy.dir *= -1;

    if (checkCollision(player, enemy)) {
      if (player.vy > 0 && player.y + player.h - enemy.y < 20) {
        enemy.alive = false;
        score += 50;
        player.vy = -10;
        spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "orange");
        messageText.textContent = "Musuh dihancurkan!";
        setTimeout(() => { messageText.textContent = ""; }, 800);
      } else if (!invincible) {
        lives--;
        invincible = true;
        invincibleTimer = 60;
        spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "red");
        if (lives <= 0) {
          gameOver = true;
          loseSound.currentTime = 0; loseSound.play();
          messageText.textContent = "Kamu kalah! Tekan R untuk restart.";
          messageText.className = "lose";
        } else {
          messageText.textContent = `Kena musuh! Sisa nyawa: ${lives}`;
          setTimeout(() => { messageText.textContent = ""; }, 1000);
        }
      }
    }
  });

  crystals.forEach(c => {
    if (!c.collected && checkCollision(player, { x: c.x, y: c.y, w: 30, h: 30 })) {
      c.collected = true;
      score += 10;
      spawnParticles(c.x + 15, c.y + 15, "cyan");
    }
  });

  if (checkCollision(player, portal)) {
    currentLevel++;
    if (currentLevel >= levels.length) {
      gameOver = true;
      winSound.currentTime = 0; winSound.play();
      messageText.textContent = "Kamu menyelesaikan semua level! Tekan R untuk ulangi.";
      messageText.className = "win";
    } else {
      player.x = 100;
      player.y = 400;
      loadLevel(currentLevel);
      messageText.textContent = `Level ${currentLevel + 1}`;
      setTimeout(() => { messageText.textContent = ""; }, 1500);
    }
    return;
  }

  updateParticles();
  updateBullets();
  cameraX = player.x - canvas.width / 2 + player.w / 2;
  scoreText.textContent = `Score: ${score}`;
  livesText.textContent = "❤".repeat(lives);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraX, 0);
  ctx.drawImage(bgImg, 0, 0, ground.w, canvas.height);
  ctx.fillStyle = "#333";
  ctx.fillRect(ground.x, ground.y, ground.w, ground.h);

  crystals.forEach(c => {
    if (!c.collected) ctx.drawImage(crystalImg, c.x, c.y, 30, 30);
  });

  ctx.drawImage(portalImg, portal.x, portal.y, portal.w, portal.h);

  enemies.forEach(enemy => {
    if (enemy.alive) ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.w, enemy.h);
  });

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h));

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  ctx.restore();
}

function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function gameLoop() {
  if (!paused && started && !gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}
gameLoop();

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyX" && !gameOver) {
    bullets.push({
      x: player.x + player.w,
      y: player.y + player.h / 2 - 8,
      w: 16,
      h: 8,
      vx: 10
    });
  }
});

function updateBullets() {
  bullets = bullets.filter(b => b.x < ground.w);
  bullets.forEach(b => b.x += b.vx);

  bullets.forEach(b => {
    enemies.forEach(enemy => {
      if (enemy.alive && checkCollision(b, enemy)) {
        enemy.alive = false;
        score += 50;
        spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "orange");
        messageText.textContent = "Musuh ditembak!";
        setTimeout(() => { messageText.textContent = ""; }, 800);
      }
    });
  });
}

const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");

function startGame() {
  startScreen.classList.remove("show");
  started = true;
  paused = false;
  messageText.textContent = "";
  bgMusic.play();
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  if (paused) {
    pauseScreen.classList.add("show");
    bgMusic.pause();
  } else {
    pauseScreen.classList.remove("show");
    bgMusic.play();
    requestAnimationFrame(gameLoop);
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Escape") {
    togglePause();
  }
});
