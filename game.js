const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

// UI
const scoreText = document.getElementById("score");
const messageText = document.getElementById("message");

// Audio
const bgMusic = document.getElementById("bgMusic");
const jumpSound = document.getElementById("jumpSound");
const loseSound = document.getElementById("loseSound");
const winSound = document.getElementById("winSound");
bgMusic.volume = 0.3;
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
let cameraX = 0;
let gameOver = false;
let started = false;

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

// Enemy
const enemy = { x: 700, y: 460, w: 40, h: 40, dir: 1, speed: 2, alive: true };

// Portal
const portal = { x: 2500, y: 460, w: 40, h: 40 };

// Crystals
const crystals = [
  { x: 400, y: 460, collected: false },
  { x: 800, y: 460, collected: false },
  { x: 1200, y: 460, collected: false },
  { x: 1600, y: 460, collected: false }
];

// Bullet
let bullets = [];

// Particle System
let particles = [];
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

// Reset Game
function resetGame() {
  player.x = 100; player.y = 400;
  player.vx = 0; player.vy = 0;
  enemy.x = 700; enemy.dir = 1; enemy.alive = true;
  score = 0; cameraX = 0;
  gameOver = false; started = false;
  crystals.forEach(c => c.collected = false);
  particles = [];
  bullets = [];
  messageText.textContent = "Tekan ← → untuk gerak, SPACE lompat, R untuk mulai ulang.";
  bgMusic.currentTime = 0; bgMusic.play();
}
resetGame();

// Restart dengan R
document.addEventListener("keydown", (e) => {
  if (gameOver && e.code === "KeyR") resetGame();
});

// Clamp player agar tidak keluar area
function clampPlayerPosition() {
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > ground.w) player.x = ground.w - player.w;
  if (player.y < 0) player.y = 0;
}

// Main update
function update() {
  if (gameOver) return;

  // Mulai game saat tombol ditekan
  if (!started && (keys["ArrowLeft"] || keys["ArrowRight"] || keys["Space"])) {
    started = true;
    messageText.textContent = "";
  }
  if (!started) return;

  // Movement
  if (keys["ArrowLeft"]) player.vx = -player.speed;
  else if (keys["ArrowRight"]) player.vx = player.speed;
  else player.vx = 0;

  // Lompat
  if (keys["Space"] && player.grounded && !player.jumping) {
    player.vy = -12;
    player.jumping = true;
    player.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
    spawnParticles(player.x + player.w / 2, player.y + player.h, "white");
  }

  // Physics
  player.vy += 0.6; // gravity
  player.x += player.vx;
  player.y += player.vy;
  clampPlayerPosition();

  // Ground collision
  if (player.y + player.h > ground.y) {
    player.y = ground.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
  }

  // Jatuh ke bawah layar = kalah
  if (player.y > canvas.height) {
    gameOver = true;
    loseSound.currentTime = 0; loseSound.play();
    messageText.textContent = "Kamu kalah! Tekan R untuk restart.";
    messageText.className = "lose";
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "red");
    return;
  }

  // Enemy patrol
  enemy.x += enemy.dir * enemy.speed;
  if (enemy.x < 650 || enemy.x > 850) enemy.dir *= -1;

  // Collision: enemy
  if (enemy.alive && checkCollision(player, enemy)) {
    // Cek apakah player mengenai dari atas
    if (player.vy > 0 && player.y + player.h - enemy.y < 20) {
      // Hancurkan musuh
      enemy.alive = false;
      score += 50;
      player.vy = -10; // bounce
      spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "orange");
      messageText.textContent = "Musuh dihancurkan!";
      setTimeout(() => { messageText.textContent = ""; }, 800);
    } else {
      // Kalah jika kena dari samping/bawah
      gameOver = true;
      loseSound.currentTime = 0; loseSound.play();
      messageText.textContent = "Kamu kalah! Tekan R untuk restart.";
      messageText.className = "lose";
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "red");
      return;
    }
  }

  // Collision: crystals
  crystals.forEach(c => {
    if (!c.collected && checkCollision(player, { x: c.x, y: c.y, w: 30, h: 30 })) {
      c.collected = true;
      score += 10;
      spawnParticles(c.x + 15, c.y + 15, "cyan");
    }
  });

  // Win condition
  if (checkCollision(player, portal)) {
    gameOver = true;
    winSound.currentTime = 0; winSound.play();
    messageText.textContent = "Kamu menang! Tekan R untuk restart.";
    messageText.className = "win";
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "lime");
    return;
  }

  // Update camera
  cameraX = player.x - canvas.width / 2 + player.w / 2;
  updateParticles();
  scoreText.textContent = `Score: ${score}`;
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraX, 0);

  // Background
  ctx.drawImage(bgImg, 0, 0, 3000, 540);

  // Ground
  ctx.fillStyle = "#333";
  ctx.fillRect(ground.x, ground.y, ground.w, ground.h);

  // Crystals
  crystals.forEach(c => {
    if (!c.collected)
      ctx.drawImage(crystalImg, c.x, c.y, 30, 30);
  });

  // Portal
  ctx.drawImage(portalImg, portal.x, portal.y, portal.w, portal.h);

  // Enemy
  if (enemy.alive) {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.w, enemy.h);
  }

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  // Bullets
  bullets.forEach(b => {
    ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h);
  });

  // Particles
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  ctx.restore();
}

// Collision helper
function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();

document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyX" && !gameOver) {
    // Tembak peluru ke kanan
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
  bullets = bullets.filter(b => b.x < ground.w); // hapus peluru di luar layar
  bullets.forEach(b => b.x += b.vx);
  bullets.forEach(b => {
    if (enemy.alive && checkCollision(b, enemy)) {
      enemy.alive = false;
      score += 50;
      spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "orange");
      messageText.textContent = "Musuh ditembak!";
      setTimeout(() => { messageText.textContent = ""; }, 800);
    }
  });
}
