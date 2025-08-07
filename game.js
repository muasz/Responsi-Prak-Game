// === Dark Forest Runner (v4.0) - Enhanced with Asset Integration ===

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

// Mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0);

// Touch device optimization
if (isMobile) {
  // Prevent zoom on double tap
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, { passive: false });
  
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(e) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}

// UI
const scoreText = document.getElementById("score");
const messageText = document.getElementById("message");
const livesText = document.getElementById("lives");

// Enhanced Asset Manager
const assetManager = {
  images: {},
  loadQueue: [],
  loaded: 0,
  total: 0,
  
  loadImage(name, src) {
    this.total++;
    this.loadQueue.push({name, src});
  },
  
  async loadAll() {
    const promises = this.loadQueue.map(({name, src}) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images[name] = img;
          this.loaded++;
          resolve();
        };
        img.onerror = reject;
        img.src = src;
      });
    });
    
    await Promise.all(promises);
  },
  
  get(name) {
    return this.images[name];
  }
};

// Load enhanced assets
assetManager.loadImage('player', 'assets/images/player.png');
assetManager.loadImage('enemy', 'assets/images/enemy.png');
assetManager.loadImage('crystal', 'assets/images/crystal.png');
assetManager.loadImage('bullet', 'assets/images/bullet.png');
assetManager.loadImage('portal', 'assets/images/portal.png');

// Background elements
assetManager.loadImage('tree1', 'kenney_background-elements/PNG/tree01.png');
assetManager.loadImage('tree2', 'kenney_background-elements/PNG/tree02.png');
assetManager.loadImage('tree3', 'kenney_background-elements/PNG/tree03.png');
assetManager.loadImage('tree4', 'kenney_background-elements/PNG/tree04.png');
assetManager.loadImage('cloud1', 'kenney_background-elements/PNG/cloud1.png');
assetManager.loadImage('cloud2', 'kenney_background-elements/PNG/cloud2.png');
assetManager.loadImage('cloud3', 'kenney_background-elements/PNG/cloud3.png');

// Platform tiles
assetManager.loadImage('grassLeft', 'kenney_platformer-art-deluxe/Base pack/Tiles/grassLeft.png');
assetManager.loadImage('grassMid', 'kenney_platformer-art-deluxe/Base pack/Tiles/grassMid.png');
assetManager.loadImage('grassRight', 'kenney_platformer-art-deluxe/Base pack/Tiles/grassRight.png');
assetManager.loadImage('stone', 'kenney_platformer-art-deluxe/Base pack/Tiles/stone.png');
assetManager.loadImage('box', 'kenney_platformer-art-deluxe/Base pack/Tiles/box.png');

// Enhanced enemies
assetManager.loadImage('slimeWalk1', 'kenney_platformer-art-deluxe/Base pack/Enemies/slimeWalk1.png');
assetManager.loadImage('slimeWalk2', 'kenney_platformer-art-deluxe/Base pack/Enemies/slimeWalk2.png');
assetManager.loadImage('flyFly1', 'kenney_platformer-art-deluxe/Base pack/Enemies/flyFly1.png');
assetManager.loadImage('flyFly2', 'kenney_platformer-art-deluxe/Base pack/Enemies/flyFly2.png');

// Settings
let gameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  showMobileControls: isMobile
};

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem('darkForestSettings');
  if (saved) {
    gameSettings = { ...gameSettings, ...JSON.parse(saved) };
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('darkForestSettings', JSON.stringify(gameSettings));
}

function applySettings() {
  try {
    bgMusic.volume = gameSettings.musicVolume;
    jumpSound.volume = gameSettings.sfxVolume;
    loseSound.volume = gameSettings.sfxVolume;
    winSound.volume = gameSettings.sfxVolume;
    
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
      if (gameSettings.showMobileControls) {
        mobileControls.style.display = 'flex';
      } else {
        mobileControls.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Apply settings error:', error);
  }
}

// Audio
const bgMusic = document.getElementById("bgMusic");
const jumpSound = document.getElementById("jumpSound");
const loseSound = document.getElementById("loseSound");
const winSound = document.getElementById("winSound");

// Enhanced Background System with Parallax
const backgroundSystem = {
  layers: [
    { 
      elements: [], 
      speed: 0.2, 
      type: 'cloud',
      density: 0.3 
    },
    { 
      elements: [], 
      speed: 0.5, 
      type: 'tree_far',
      density: 0.4 
    },
    { 
      elements: [], 
      speed: 0.8, 
      type: 'tree_near',
      density: 0.6 
    }
  ],
  
  init() {
    this.layers.forEach((layer, index) => {
      this.generateElements(layer, index);
    });
  },
  
  generateElements(layer, layerIndex) {
    const elementCount = Math.floor(canvas.width / 200 * layer.density);
    
    for (let i = 0; i < elementCount; i++) {
      let element = {
        x: (i * 200) + Math.random() * 100,
        y: 0,
        scale: 0.3 + Math.random() * 0.4,
        image: null
      };
      
      if (layer.type === 'cloud') {
        element.y = 50 + Math.random() * 150;
        element.image = `cloud${Math.floor(Math.random() * 3) + 1}`;
        element.scale = 0.2 + Math.random() * 0.3;
      } else if (layer.type === 'tree_far') {
        element.y = canvas.height - 200 - Math.random() * 50;
        element.image = `tree${Math.floor(Math.random() * 4) + 1}`;
        element.scale = 0.4 + Math.random() * 0.3;
      } else if (layer.type === 'tree_near') {
        element.y = canvas.height - 250 - Math.random() * 100;
        element.image = `tree${Math.floor(Math.random() * 4) + 1}`;
        element.scale = 0.6 + Math.random() * 0.4;
      }
      
      layer.elements.push(element);
    }
  },
  
  update(scrollSpeed) {
    this.layers.forEach(layer => {
      layer.elements.forEach(element => {
        element.x -= scrollSpeed * layer.speed;
        
        // Wrap around when element goes off screen
        if (element.x + 200 < 0) {
          element.x = canvas.width + Math.random() * 200;
        }
      });
    });
  },
  
  render() {
    this.layers.forEach(layer => {
      layer.elements.forEach(element => {
        const img = assetManager.get(element.image);
        if (img) {
          ctx.save();
          ctx.globalAlpha = 0.7; // Make background elements slightly transparent
          ctx.drawImage(
            img,
            element.x,
            element.y,
            img.width * element.scale,
            img.height * element.scale
          );
          ctx.restore();
        }
      });
    });
  }
};

// Enhanced Platform System
const platformSystem = {
  platforms: [],
  tileSize: 70,
  
  createPlatform(x, y, width, type = 'grass') {
    const platform = {
      x, y, width, 
      height: this.tileSize,
      type,
      tiles: []
    };
    
    // Generate tile pattern
    const tileCount = Math.ceil(width / this.tileSize);
    for (let i = 0; i < tileCount; i++) {
      let tileType = `${type}Mid`;
      if (i === 0) tileType = `${type}Left`;
      if (i === tileCount - 1) tileType = `${type}Right`;
      
      platform.tiles.push({
        x: x + (i * this.tileSize),
        y: y,
        type: tileType
      });
    }
    
    this.platforms.push(platform);
    return platform;
  },
  
  render() {
    this.platforms.forEach(platform => {
      platform.tiles.forEach(tile => {
        const img = assetManager.get(tile.type);
        if (img) {
          ctx.drawImage(img, tile.x, tile.y, this.tileSize, this.tileSize);
        } else {
          // Fallback to colored rectangles
          ctx.fillStyle = platform.type === 'grass' ? '#4a7c2c' : '#8B4513';
          ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
        }
      });
    });
  },
  
  checkCollision(rect) {
    for (let platform of this.platforms) {
      if (rect.x < platform.x + platform.width &&
          rect.x + rect.width > platform.x &&
          rect.y < platform.y + platform.height &&
          rect.y + rect.height > platform.y) {
        return platform;
      }
    }
    return null;
  },
  
  clear() {
    this.platforms = [];
  }
};

// High Score System
let highScores = [];

function loadHighScores() {
  const saved = localStorage.getItem('darkForestHighScores');
  if (saved) {
    highScores = JSON.parse(saved);
  }
}

function saveHighScore(score) {
  highScores.push({
    score: score,
    date: new Date().toLocaleDateString(),
    level: currentLevel + 1
  });
  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 10); // Keep top 10
  localStorage.setItem('darkForestHighScores', JSON.stringify(highScores));
}

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
let powerUps = [];
let lastShootTime = 0;

// Input
let keys = {};
let mobileInput = {
  left: false,
  right: false,
  jump: false,
  shoot: false
};

document.addEventListener("keydown", (e) => keys[e.code] = true);
document.addEventListener("keyup", (e) => keys[e.code] = false);

// Player
const player = {
  x: 100, y: 400, w: 40, h: 60,
  vx: 0, vy: 0,
  speed: 5,
  jumping: false,
  grounded: false,
  hasDoubleJump: false,
  hasFastShoot: false,
  powerUpTimer: 0
};

// Ground
const ground = { x: 0, y: 500, w: 5000, h: 50 };

// Enhanced Level Data with more content
const levels = [
  {
    name: "Forest Beginning",
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
    powerUps: [
      { x: 900, y: 460, type: 'doubleJump' }
    ],
    portal: { x: 2500, y: 460 }
  },
  {
    name: "Dark Woods",
    enemies: [
      { x: 600, y: 460, dir: 1 },
      { x: 900, y: 460, dir: -1 },
      { x: 1300, y: 460, dir: 1 },
      { x: 1700, y: 460, dir: -1 }
    ],
    crystals: [
      { x: 500, y: 460 },
      { x: 1000, y: 460 },
      { x: 1500, y: 460 },
      { x: 2000, y: 460 }
    ],
    powerUps: [
      { x: 1100, y: 460, type: 'fastShoot' },
      { x: 1800, y: 460, type: 'extraLife' }
    ],
    portal: { x: 2800, y: 460 }
  },
  {
    name: "Shadow Valley",
    enemies: [
      { x: 500, y: 460, dir: 1 },
      { x: 800, y: 460, dir: -1 },
      { x: 1200, y: 460, dir: 1 },
      { x: 1600, y: 460, dir: -1 },
      { x: 2000, y: 460, dir: 1 }
    ],
    crystals: [
      { x: 600, y: 460 },
      { x: 1000, y: 460 },
      { x: 1400, y: 460 },
      { x: 1800, y: 460 },
      { x: 2200, y: 460 }
    ],
    powerUps: [
      { x: 900, y: 460, type: 'doubleJump' },
      { x: 1500, y: 460, type: 'fastShoot' }
    ],
    portal: { x: 3200, y: 460 }
  },
  {
    name: "Crystal Cave",
    enemies: [
      { x: 400, y: 460, dir: 1 },
      { x: 700, y: 460, dir: -1 },
      { x: 1100, y: 460, dir: 1 },
      { x: 1500, y: 460, dir: -1 },
      { x: 1900, y: 460, dir: 1 },
      { x: 2300, y: 460, dir: -1 }
    ],
    crystals: [
      { x: 300, y: 460 },
      { x: 800, y: 460 },
      { x: 1200, y: 460 },
      { x: 1600, y: 460 },
      { x: 2000, y: 460 },
      { x: 2400, y: 460 }
    ],
    powerUps: [
      { x: 600, y: 460, type: 'extraLife' },
      { x: 1400, y: 460, type: 'doubleJump' },
      { x: 2100, y: 460, type: 'fastShoot' }
    ],
    portal: { x: 3500, y: 460 }
  },
  {
    name: "Final Challenge",
    enemies: [
      { x: 300, y: 460, dir: 1 },
      { x: 600, y: 460, dir: -1 },
      { x: 900, y: 460, dir: 1 },
      { x: 1200, y: 460, dir: -1 },
      { x: 1500, y: 460, dir: 1 },
      { x: 1800, y: 460, dir: -1 },
      { x: 2100, y: 460, dir: 1 },
      { x: 2400, y: 460, dir: -1 }
    ],
    crystals: [
      { x: 400, y: 460 },
      { x: 700, y: 460 },
      { x: 1000, y: 460 },
      { x: 1300, y: 460 },
      { x: 1600, y: 460 },
      { x: 1900, y: 460 },
      { x: 2200, y: 460 },
      { x: 2500, y: 460 }
    ],
    powerUps: [
      { x: 800, y: 460, type: 'doubleJump' },
      { x: 1400, y: 460, type: 'fastShoot' },
      { x: 2000, y: 460, type: 'extraLife' }
    ],
    portal: { x: 3800, y: 460 }
  }
];

let enemies = [];
let crystals = [];
let portal = {};
let bullets = [];
let particles = [];
let obstacles = [];

// Enhanced Enemy System with Animation
class AnimatedEnemy {
  constructor(x, y, type = 'slime') {
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 40;
    this.type = type;
    this.speed = 2;
    this.alive = true;
    this.direction = -1; // -1 left, 1 right
    this.animFrame = 0;
    this.animTimer = 0;
    this.animSpeed = 0.2;
    this.patrol = {
      start: x - 100,
      end: x + 100,
      active: true
    };
    
    // Flying enemies have different behavior
    if (type === 'fly') {
      this.flyHeight = y;
      this.bobOffset = 0;
      this.bobSpeed = 0.1;
    }
  }
  
  update() {
    if (!this.alive) return;
    
    // Animation
    this.animTimer += this.animSpeed;
    if (this.animTimer >= 1) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }
    
    // Movement based on type
    if (this.type === 'fly') {
      this.updateFlyMovement();
    } else {
      this.updateGroundMovement();
    }
  }
  
  updateGroundMovement() {
    // Patrol behavior
    if (this.patrol.active) {
      this.x += this.speed * this.direction;
      
      if (this.x <= this.patrol.start || this.x >= this.patrol.end) {
        this.direction *= -1;
      }
    }
  }
  
  updateFlyMovement() {
    // Flying pattern with bobbing
    this.x += this.speed * this.direction * 0.7;
    this.bobOffset += this.bobSpeed;
    this.y = this.flyHeight + Math.sin(this.bobOffset) * 15;
    
    // Change direction randomly or when hitting patrol bounds
    if (this.x <= this.patrol.start || this.x >= this.patrol.end) {
      this.direction *= -1;
    }
  }
  
  render() {
    if (!this.alive) return;
    
    let imageName = '';
    if (this.type === 'slime') {
      imageName = `slimeWalk${this.animFrame + 1}`;
    } else if (this.type === 'fly') {
      imageName = `flyFly${this.animFrame + 1}`;
    }
    
    const img = assetManager.get(imageName);
    if (img) {
      ctx.save();
      
      // Flip sprite based on direction
      if (this.direction === 1) {
        ctx.scale(-1, 1);
        ctx.drawImage(img, -this.x - this.w, this.y, this.w, this.h);
      } else {
        ctx.drawImage(img, this.x, this.y, this.w, this.h);
      }
      
      ctx.restore();
    } else {
      // Fallback to colored rectangle
      ctx.fillStyle = this.type === 'fly' ? '#8A2BE2' : '#FF4500';
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
  
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.w,
      height: this.h
    };
  }
}

// Enhanced Level System with Obstacles
function createObstacle(x, y, width, height, type = 'box') {
  return {
    x, y, width, height, type,
    render() {
      const img = assetManager.get(this.type);
      if (img) {
        // Tile the obstacle image
        for (let i = 0; i < this.width; i += 70) {
          for (let j = 0; j < this.height; j += 70) {
            ctx.drawImage(img, this.x + i, this.y + j, 
              Math.min(70, this.width - i), 
              Math.min(70, this.height - j));
          }
        }
      } else {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  };
}

function loadLevel(levelIndex) {
  const level = levels[levelIndex];
  
  // Create animated enemies
  enemies = level.enemies.map(e => {
    const enemyType = e.type || (Math.random() > 0.5 ? 'slime' : 'fly');
    const enemy = new AnimatedEnemy(e.x, e.y, enemyType);
    enemy.speed = 2 + levelIndex * 0.5;
    return enemy;
  });
  
  crystals = level.crystals.map(c => ({ ...c, collected: false }));
  powerUps = level.powerUps.map(p => ({ ...p, w: 30, h: 30, collected: false }));
  portal = { ...level.portal, w: 40, h: 40 };
  
  // Clear obstacles and platforms
  obstacles = [];
  platformSystem.clear();
  
  // Create varied platform layouts based on level
  if (levelIndex === 0) {
    // Beginner level - simple platforms
    platformSystem.createPlatform(0, 480, 400, 'grass');
    platformSystem.createPlatform(500, 450, 200, 'grass');
    platformSystem.createPlatform(800, 420, 250, 'grass');
    platformSystem.createPlatform(1200, 480, 300, 'grass');
    platformSystem.createPlatform(1600, 450, 200, 'grass');
  } else if (levelIndex === 1) {
    // Intermediate - more gaps and heights
    platformSystem.createPlatform(0, 480, 300, 'grass');
    platformSystem.createPlatform(400, 400, 150, 'grass');
    platformSystem.createPlatform(650, 350, 200, 'grass');
    platformSystem.createPlatform(950, 300, 180, 'grass');
    platformSystem.createPlatform(1200, 380, 250, 'grass');
    platformSystem.createPlatform(1550, 430, 200, 'grass');
  } else if (levelIndex === 2) {
    // Advanced - vertical challenges
    platformSystem.createPlatform(0, 480, 250, 'grass');
    platformSystem.createPlatform(350, 380, 120, 'grass');
    platformSystem.createPlatform(550, 280, 150, 'grass');
    platformSystem.createPlatform(800, 200, 120, 'grass');
    platformSystem.createPlatform(1000, 320, 180, 'grass');
    platformSystem.createPlatform(1300, 400, 200, 'grass');
  } else if (levelIndex === 3) {
    // Expert - precise jumping required
    platformSystem.createPlatform(0, 480, 200, 'grass');
    platformSystem.createPlatform(300, 350, 100, 'grass');
    platformSystem.createPlatform(500, 220, 120, 'grass');
    platformSystem.createPlatform(750, 150, 100, 'grass');
    platformSystem.createPlatform(950, 250, 150, 'grass');
    platformSystem.createPlatform(1200, 380, 180, 'grass');
    platformSystem.createPlatform(1500, 300, 200, 'grass');
  } else {
    // Master level - extreme difficulty
    platformSystem.createPlatform(0, 480, 150, 'grass');
    platformSystem.createPlatform(250, 380, 80, 'grass');
    platformSystem.createPlatform(430, 250, 100, 'grass');
    platformSystem.createPlatform(630, 150, 80, 'grass');
    platformSystem.createPlatform(800, 200, 120, 'grass');
    platformSystem.createPlatform(1000, 320, 100, 'grass');
    platformSystem.createPlatform(1200, 400, 150, 'grass');
    platformSystem.createPlatform(1450, 280, 180, 'grass');
  }
  
  // Add dynamic obstacles for variety
  const obstacleCount = 2 + levelIndex;
  for (let i = 0; i < obstacleCount; i++) {
    const x = 300 + (i * 400) + Math.random() * 100;
    const y = 380 + Math.random() * 80;
    const width = 70 + Math.random() * 70;
    const height = 70;
    const type = Math.random() > 0.5 ? 'box' : 'stone';
    
    // Don't place obstacles too close to player start
    if (x > 200) {
      obstacles.push(createObstacle(x, y, width, height, type));
    }
  }
  if (levelIndex === 0) {
    platformSystem.createPlatform(0, 480, 400, 'grass');
    platformSystem.createPlatform(500, 400, 300, 'grass');
    platformSystem.createPlatform(900, 450, 200, 'grass');
    platformSystem.createPlatform(1200, 380, 250, 'grass');
  } else if (levelIndex === 1) {
    platformSystem.createPlatform(0, 480, 300, 'grass');
    platformSystem.createPlatform(400, 420, 150, 'grass');
    platformSystem.createPlatform(650, 360, 200, 'grass');
    platformSystem.createPlatform(950, 300, 180, 'grass');
    platformSystem.createPlatform(1200, 400, 300, 'grass');
  }
  // Add more platform configurations for other levels...
  
  ground.w = 4000 + levelIndex * 500;
  
  messageText.textContent = `Level ${levelIndex + 1}: ${level.name}`;
  setTimeout(() => { messageText.textContent = ""; }, 2000);
}

// Power-up System
function applyPowerUp(type) {
  switch(type) {
    case 'doubleJump':
      player.hasDoubleJump = true;
      player.powerUpTimer = 300; // 5 seconds at 60fps
      messageText.textContent = "Double Jump activated!";
      break;
    case 'fastShoot':
      player.hasFastShoot = true;
      player.powerUpTimer = 600; // 10 seconds
      messageText.textContent = "Fast Shoot activated!";
      break;
    case 'extraLife':
      lives = Math.min(lives + 1, 5);
      messageText.textContent = "Extra Life!";
      break;
  }
  setTimeout(() => { messageText.textContent = ""; }, 1500);
}

function updatePowerUps() {
  if (player.powerUpTimer > 0) {
    player.powerUpTimer--;
    if (player.powerUpTimer <= 0) {
      player.hasDoubleJump = false;
      player.hasFastShoot = false;
    }
  }
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
  player.hasDoubleJump = false;
  player.hasFastShoot = false;
  player.powerUpTimer = 0;
  score = 0; cameraX = 0;
  lives = 3;
  gameOver = false; started = false; invincible = false;
  currentLevel = 0;
  loadLevel(currentLevel);
  particles = [];
  bullets = [];
  lastShootTime = 0;
  
  // Reset game stats
  gameStats = {
    totalJumps: 0,
    totalShots: 0,
    enemiesKilled: 0,
    crystalsCollected: 0,
    levelsCompleted: 0,
    powerUpsUsed: 0
  };
  
  messageText.textContent = "Gunakan ← → untuk gerak, SPACE lompat, X menembak.";
  messageText.className = "";
  bgMusic.currentTime = 0; 
  if (gameSettings.musicVolume > 0) bgMusic.play();
  livesText.textContent = "❤".repeat(lives);
}

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
  if (!started && (keys["ArrowLeft"] || keys["ArrowRight"] || keys["Space"] || 
                   mobileInput.left || mobileInput.right || mobileInput.jump)) {
    started = true;
    messageText.textContent = "";
  }
  if (!started) return;

  if (invincible) {
    invincibleTimer--;
    if (invincibleTimer <= 0) invincible = false;
  }

  // Handle both keyboard and mobile input
  if (keys["ArrowLeft"] || mobileInput.left) player.vx = -player.speed;
  else if (keys["ArrowRight"] || mobileInput.right) player.vx = player.speed;
  else player.vx = 0;

  // Enhanced jumping with double jump
  if ((keys["Space"] || mobileInput.jump) && player.grounded && !player.jumping) {
    player.vy = -12;
    player.jumping = true;
    player.grounded = false;
    gameStats.totalJumps++;
    jumpSound.currentTime = 0;
    jumpSound.play();
    spawnParticles(player.x + player.w / 2, player.y + player.h, "white");
  } else if ((keys["Space"] || mobileInput.jump) && player.hasDoubleJump && !player.grounded && player.vy > -5) {
    player.vy = -10;
    player.hasDoubleJump = false; // Use up double jump
    gameStats.totalJumps++;
    jumpSound.currentTime = 0;
    jumpSound.play();
    spawnParticles(player.x + player.w / 2, player.y + player.h, "yellow");
  }

  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;
  clampPlayerPosition();

  // Enhanced collision with platforms
  const platformCollision = platformSystem.checkCollision({
    x: player.x,
    y: player.y + player.vy,
    width: player.w,
    height: player.h
  });

  if (platformCollision && player.vy > 0) {
    player.y = platformCollision.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
    if (currentLevel > 0) player.hasDoubleJump = true; // Reset double jump on landing
  }

  // Check collision with obstacles
  obstacles.forEach(obstacle => {
    if (player.x < obstacle.x + obstacle.width &&
        player.x + player.w > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.h > obstacle.y) {
      
      // Simple collision response - stop player movement
      if (player.vx > 0) player.x = obstacle.x - player.w;
      else if (player.vx < 0) player.x = obstacle.x + obstacle.width;
      
      if (player.vy > 0 && player.y < obstacle.y) {
        player.y = obstacle.y - player.h;
        player.vy = 0;
        player.grounded = true;
        player.jumping = false;
        if (currentLevel > 0) player.hasDoubleJump = true;
      }
    }
  });

  // Ground collision (fallback)
  if (player.y + player.h > ground.y) {
    player.y = ground.y - player.h;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
    if (currentLevel > 0) player.hasDoubleJump = true;
  }

  // Update background parallax
  const scrollSpeed = Math.abs(player.vx) * 0.5 + 1;
  backgroundSystem.update(scrollSpeed);

  // Update animated enemies
  enemies.forEach(enemy => {
    if (enemy.update) {
      enemy.update();
    }
  });

  updatePowerUps();
  handleShooting();

  if (player.y > canvas.height) {
    lives--;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "red");
    if (lives <= 0) {
      gameOver = true;
      saveHighScore(score); // Save score when game over
      loseSound.currentTime = 0; loseSound.play();
      messageText.textContent = "Game Over! Tekan R untuk restart atau lihat High Scores.";
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
      gameStats.crystalsCollected++;
      spawnParticles(c.x + 15, c.y + 15, "cyan");
    }
  });

  // Power-up collisions
  powerUps.forEach(p => {
    if (!p.collected && checkCollision(player, { x: p.x, y: p.y, w: p.w, h: p.h })) {
      p.collected = true;
      score += 25;
      gameStats.powerUpsUsed++;
      applyPowerUp(p.type);
      spawnParticles(p.x + p.w/2, p.y + p.h/2, "gold");
    }
  });

  if (checkCollision(player, portal)) {
    currentLevel++;
    gameStats.levelsCompleted++;
    if (currentLevel >= levels.length) {
      gameOver = true;
      saveHighScore(score); // Save score on win
      winSound.currentTime = 0; winSound.play();
      messageText.textContent = `🎉 Selamat! Game selesai! 🎉
      Stats: ${gameStats.totalJumps} lompatan, ${gameStats.totalShots} tembakan, 
      ${gameStats.enemiesKilled} musuh dikalahkan!`;
      messageText.className = "win";
    } else {
      player.x = 100;
      player.y = 400;
      player.hasDoubleJump = false;
      player.hasFastShoot = false;
      player.powerUpTimer = 0;
      loadLevel(currentLevel);
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
  
  // Draw enhanced background with parallax
  ctx.drawImage(bgImg, 0, 0, ground.w, canvas.height);
  backgroundSystem.render();
  
  // Draw platforms using the new system
  platformSystem.render();
  
  // Draw dynamic obstacles
  obstacles.forEach(obstacle => {
    if (obstacle.render) {
      obstacle.render();
    }
  });
  
  // Draw ground
  ctx.fillStyle = "#333";
  ctx.fillRect(ground.x, ground.y, ground.w, ground.h);

  // Draw crystals
  crystals.forEach(c => {
    if (!c.collected) {
      ctx.drawImage(crystalImg, c.x, c.y, 30, 30);
      // Add sparkle effect
      if (Math.random() < 0.3) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(c.x + Math.random() * 30, c.y + Math.random() * 30, 2, 2);
      }
    }
  });

  // Draw power-ups
  powerUps.forEach(p => {
    if (!p.collected) {
      // Power-up background glow
      ctx.fillStyle = "rgba(255,215,0,0.3)";
      ctx.fillRect(p.x - 5, p.y - 5, p.w + 10, p.h + 10);
      
      // Power-up icon
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      
      // Power-up symbol
      ctx.fillStyle = "#8B4513";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      let symbol = "?";
      switch(p.type) {
        case 'doubleJump': symbol = "↑↑"; break;
        case 'fastShoot': symbol = "💨"; break;
        case 'extraLife': symbol = "❤"; break;
      }
      ctx.fillText(symbol, p.x + p.w/2, p.y + p.h/2 + 4);
    }
  });

  ctx.drawImage(portalImg, portal.x, portal.y, portal.w, portal.h);

  // Draw enemies with enhanced animation
  enemies.forEach(enemy => {
    if (enemy.alive) {
      if (enemy.render) {
        enemy.render(); // Use new animated rendering
      } else {
        // Fallback for old enemy format
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.w, enemy.h);
      }
      
      // Enemy danger indicator
      if (Math.abs(enemy.x - player.x) < 200) {
        ctx.fillStyle = "rgba(255,0,0,0.2)";
        ctx.fillRect(enemy.x - 5, enemy.y - 5, enemy.w + 10, enemy.h + 10);
      }
    }
  });

  // Draw player with power-up effects
  if (invincible && Math.floor(Date.now() / 100) % 2) {
    ctx.globalAlpha = 0.5;
  }
  
  // Power-up visual effects
  if (player.hasDoubleJump) {
    ctx.fillStyle = "rgba(255,255,0,0.3)";
    ctx.fillRect(player.x - 5, player.y - 5, player.w + 10, player.h + 10);
  }
  if (player.hasFastShoot) {
    ctx.fillStyle = "rgba(255,100,0,0.3)";
    ctx.fillRect(player.x - 3, player.y - 3, player.w + 6, player.h + 6);
  }
  
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
  ctx.globalAlpha = 1;

  bullets.forEach(b => ctx.drawImage(bulletImg, b.x, b.y, b.w, b.h));

  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });

  ctx.restore();
  
  // Draw UI overlays
  drawUI();
}

function drawUI() {
  // Power-up status
  if (player.powerUpTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = "#FFD700";
    ctx.font = "12px Arial";
    ctx.fillText(`Power-up: ${Math.ceil(player.powerUpTimer/60)}s`, 15, 30);
  }
  
  // Level indicator
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(canvas.width - 150, 10, 140, 30);
  ctx.fillStyle = "#FFF";
  ctx.font = "14px Arial";
  ctx.fillText(`Level: ${currentLevel + 1}/${levels.length}`, canvas.width - 145, 30);
}

function checkCollision(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function gameLoop() {
  try {
    if (!paused && started && !gameOver) {
      update();
      draw();
      calculateFPS();
      requestAnimationFrame(gameLoop);
    } else if (!started) {
      // Draw initial state even when not started
      draw();
      requestAnimationFrame(gameLoop);
    }
  } catch (error) {
    console.error('Game loop error:', error);
    messageText.textContent = "Game error occurred. Press R to restart.";
  }
}
gameLoop();

// Shooting mechanics with rate limiting
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "KeyX" && !gameOver) {
    shoot();
  }
});

// Add shooting for mobile
let lastMobileShoot = false;

function handleShooting() {
  if (mobileInput.shoot && !lastMobileShoot) {
    shoot();
  }
  lastMobileShoot = mobileInput.shoot;
}

function shoot() {
  const currentTime = Date.now();
  const shootCooldown = player.hasFastShoot ? 100 : 300; // Fast shoot reduces cooldown
  
  if (currentTime - lastShootTime > shootCooldown) {
    const bulletCount = player.hasFastShoot ? 2 : 1; // Fast shoot fires multiple bullets
    
    for (let i = 0; i < bulletCount; i++) {
      bullets.push({
        x: player.x + player.w,
        y: player.y + player.h / 2 - 8 + (i * 16),
        w: 16,
        h: 8,
        vx: 12 + (player.hasFastShoot ? 3 : 0) // Faster bullets with power-up
      });
      gameStats.totalShots++;
    }
    
    lastShootTime = currentTime;
  }
}

function updateBullets() {
  bullets = bullets.filter(b => b.x < ground.w);
  bullets.forEach(b => b.x += b.vx);

  bullets.forEach(b => {
    enemies.forEach(enemy => {
      if (enemy.alive && checkCollision(b, enemy)) {
        enemy.alive = false;
        score += 50;
        gameStats.enemiesKilled++;
        spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "orange");
        messageText.textContent = "Musuh ditembak! +50 poin";
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

// Mobile Controls Setup
// Haptic feedback function for mobile
function vibrate(duration = 50) {
  if (navigator.vibrate && isMobile) {
    navigator.vibrate(duration);
  }
}

function setupMobileControls() {
  try {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const jumpBtn = document.getElementById('jumpBtn');
    const shootBtn = document.getElementById('shootBtn');

    if (!leftBtn || !rightBtn || !jumpBtn || !shootBtn) {
      console.warn('Some mobile control buttons not found');
      return;
    }

  // Touch events for mobile
  leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileInput.left = true;
    vibrate(30);
    console.log('Left button pressed');
  });
  leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileInput.left = false;
    console.log('Left button released');
  });

  rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileInput.right = true;
    vibrate(30);
    console.log('Right button pressed');
  });
  rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileInput.right = false;
    console.log('Right button released');
  });

  jumpBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileInput.jump = true;
    vibrate(50);
    console.log('Jump button pressed');
  });
  jumpBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileInput.jump = false;
    console.log('Jump button released');
  });

  shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileInput.shoot = true;
    vibrate(40);
    console.log('Shoot button pressed');
  });
  shootBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileInput.shoot = false;
    console.log('Shoot button released');
  });

  // Mouse events as fallback
  leftBtn.addEventListener('mousedown', () => {
    mobileInput.left = true;
    console.log('Left button clicked (mouse)');
  });
  leftBtn.addEventListener('mouseup', () => {
    mobileInput.left = false;
    console.log('Left button released (mouse)');
  });
  rightBtn.addEventListener('mousedown', () => {
    mobileInput.right = true;
    console.log('Right button clicked (mouse)');
  });
  rightBtn.addEventListener('mouseup', () => {
    mobileInput.right = false;
    console.log('Right button released (mouse)');
  });
  jumpBtn.addEventListener('mousedown', () => {
    mobileInput.jump = true;
    console.log('Jump button clicked (mouse)');
  });
  jumpBtn.addEventListener('mouseup', () => {
    mobileInput.jump = false;
    console.log('Jump button released (mouse)');
  });
  shootBtn.addEventListener('mousedown', () => {
    mobileInput.shoot = true;
    console.log('Shoot button clicked (mouse)');
  });
  shootBtn.addEventListener('mouseup', () => {
    mobileInput.shoot = false;
    console.log('Shoot button released (mouse)');
  });
  
  } catch (error) {
    console.error('Mobile controls setup error:', error);
  }
}

// Settings Functions
function showSettings() {
  try {
    document.getElementById('settingsScreen').classList.add('show');
    
    // Update sliders
    document.getElementById('musicVolume').value = gameSettings.musicVolume * 100;
    document.getElementById('sfxVolume').value = gameSettings.sfxVolume * 100;
    document.getElementById('showMobileControls').checked = gameSettings.showMobileControls;
    document.getElementById('musicVolumeValue').textContent = Math.round(gameSettings.musicVolume * 100) + '%';
    document.getElementById('sfxVolumeValue').textContent = Math.round(gameSettings.sfxVolume * 100) + '%';
  } catch (error) {
    console.error('Settings display error:', error);
  }
}

function closeSettings() {
  document.getElementById('settingsScreen').classList.remove('show');
  saveSettings();
}

function resetSettings() {
  gameSettings = {
    musicVolume: 0.5,
    sfxVolume: 0.7,
    showMobileControls: true
  };
  applySettings();
  showSettings(); // Refresh display
}

// High Score Functions
function showHighScores() {
  const screen = document.getElementById('highScoreScreen');
  const list = document.getElementById('highScoreList');
  
  list.innerHTML = '';
  if (highScores.length === 0) {
    list.innerHTML = '<div class="score-entry">No scores yet!</div>';
  } else {
    highScores.forEach((score, index) => {
      const entry = document.createElement('div');
      entry.className = 'score-entry';
      entry.innerHTML = `
        <span>#${index + 1}</span>
        <span>Level ${score.level}</span>
        <span>${score.score} pts</span>
        <span>${score.date}</span>
      `;
      list.appendChild(entry);
    });
  }
  
  screen.classList.add('show');
}

function closeHighScore() {
  document.getElementById('highScoreScreen').classList.remove('show');
}

function clearHighScores() {
  if (confirm('Clear all high scores?')) {
    highScores = [];
    localStorage.removeItem('darkForestHighScores');
    showHighScores(); // Refresh display
  }
}

// Settings event listeners
document.getElementById('musicVolume').addEventListener('input', (e) => {
  gameSettings.musicVolume = e.target.value / 100;
  document.getElementById('musicVolumeValue').textContent = e.target.value + '%';
  applySettings();
});

document.getElementById('sfxVolume').addEventListener('input', (e) => {
  gameSettings.sfxVolume = e.target.value / 100;
  document.getElementById('sfxVolumeValue').textContent = e.target.value + '%';
  applySettings();
});

document.getElementById('showMobileControls').addEventListener('change', (e) => {
  gameSettings.showMobileControls = e.target.checked;
  applySettings();
});

// Initialize mobile controls
setupMobileControls();

// Tutorial Functions
function showTutorial() {
  document.getElementById('tutorialScreen').classList.add('show');
}

function closeTutorial() {
  document.getElementById('tutorialScreen').classList.remove('show');
}

// Loading System
let assetsLoaded = 0;
const totalAssets = 6; // player, enemy, crystal, portal, bg, bullet

function updateLoadingProgress() {
  try {
    const progress = (assetsLoaded / totalAssets) * 100;
    const progressElement = document.getElementById('loadingProgress');
    if (progressElement) {
      progressElement.style.width = progress + '%';
    }
    
    if (assetsLoaded >= totalAssets) {
      setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
          loadingScreen.classList.remove('show');
        }
      }, 500);
    }
  } catch (error) {
    console.error('Loading progress error:', error);
  }
}

// Add loading listeners to images
playerImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };
enemyImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };
crystalImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };
portalImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };
bgImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };
bulletImg.onload = () => { assetsLoaded++; updateLoadingProgress(); };

// Show loading screen initially
const loadingScreen = document.getElementById('loadingScreen');
if (loadingScreen) {
  loadingScreen.classList.add('show');
  console.log('Loading screen activated');
} else {
  console.warn('Loading screen element not found');
}

// Enhanced Error Handling
window.addEventListener('error', (e) => {
  console.error('Game Error:', e.error);
  messageText.textContent = "Terjadi kesalahan. Refresh halaman untuk mencoba lagi.";
  messageText.className = "lose";
});

// Performance monitoring
let fps = 0;
let lastTime = performance.now();

function calculateFPS() {
  const now = performance.now();
  fps = 1000 / (now - lastTime);
  lastTime = now;
}

// Enhanced Game Analytics
let gameStats = {
  totalJumps: 0,
  totalShots: 0,
  enemiesKilled: 0,
  crystalsCollected: 0,
  levelsCompleted: 0,
  powerUpsUsed: 0
};

// Initialize game
async function initGame() {
  try {
    console.log('Initializing Dark Forest Runner v4.0...');
    console.log('Loading assets...');
    
    // Load all assets
    await assetManager.loadAll();
    console.log(`Loaded ${assetManager.loaded} assets successfully`);
    
    // Initialize systems
    backgroundSystem.init();
    console.log('Background system initialized');
    
    loadSettings();
    loadHighScores();
    resetGame();
    
    console.log('Game initialized successfully!');
    console.log('Enhanced features: Parallax backgrounds, animated enemies, platform system');
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Game failed to initialize. Please refresh the page.');
  }
}

// Start initialization when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
