// === Dark Forest Runner (v4.0) - Enhanced with Asset Integration ===

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

// JavaScript Animation Engine - Replaces CSS Animations
class AnimationEngine {
  constructor() {
    this.animations = new Map();
    this.running = true;
    this.lastFrame = performance.now();
    this.update();
  }

  // Add animation to element
  animate(element, properties) {
    const id = element.id || element.className || Math.random().toString(36);
    
    const animation = {
      element,
      startTime: performance.now(),
      duration: properties.duration || 1000,
      easing: properties.easing || 'ease',
      repeat: properties.repeat || false,
      infinite: properties.infinite || false,
      keyframes: properties.keyframes || {},
      onComplete: properties.onComplete || null,
      initialStyles: {},
      currentFrame: 0
    };

    // Store initial styles
    if (properties.keyframes['0%'] || properties.keyframes.from) {
      const initial = properties.keyframes['0%'] || properties.keyframes.from;
      Object.keys(initial).forEach(prop => {
        animation.initialStyles[prop] = getComputedStyle(element)[prop];
      });
    }

    this.animations.set(id, animation);
    return id;
  }

  // Easing functions
  easing = {
    ease: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in': (t) => t * t,
    'ease-out': (t) => t * (2 - t),
    'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    linear: (t) => t
  };

  // Parse CSS transform values
  parseTransform(transform) {
    const values = {
      translateX: 0, translateY: 0, translateZ: 0,
      scaleX: 1, scaleY: 1, scaleZ: 1,
      rotateX: 0, rotateY: 0, rotateZ: 0
    };
    
    if (!transform || transform === 'none') return values;
    
    const matches = transform.match(/(\w+)\(([^)]+)\)/g);
    if (matches) {
      matches.forEach(match => {
        const [, prop, value] = match.match(/(\w+)\(([^)]+)\)/);
        if (prop.includes('translate')) {
          const nums = value.split(',').map(v => parseFloat(v));
          if (prop === 'translateX') values.translateX = nums[0] || 0;
          if (prop === 'translateY') values.translateY = nums[0] || 0;
          if (prop === 'translate') {
            values.translateX = nums[0] || 0;
            values.translateY = nums[1] || nums[0] || 0;
          }
        } else if (prop.includes('scale')) {
          const num = parseFloat(value);
          if (prop === 'scale') values.scaleX = values.scaleY = num;
          if (prop === 'scaleX') values.scaleX = num;
          if (prop === 'scaleY') values.scaleY = num;
        } else if (prop.includes('rotate')) {
          const num = parseFloat(value);
          if (prop === 'rotate') values.rotateZ = num;
          if (prop === 'rotateX') values.rotateX = num;
          if (prop === 'rotateY') values.rotateY = num;
        }
      });
    }
    return values;
  }

  // Build transform string
  buildTransform(values) {
    const parts = [];
    if (values.translateX !== 0 || values.translateY !== 0) {
      parts.push(`translate(${values.translateX}px, ${values.translateY}px)`);
    }
    if (values.scaleX !== 1 || values.scaleY !== 1) {
      parts.push(`scale(${values.scaleX}, ${values.scaleY})`);
    }
    if (values.rotateZ !== 0) parts.push(`rotate(${values.rotateZ}deg)`);
    if (values.rotateX !== 0) parts.push(`rotateX(${values.rotateX}deg)`);
    if (values.rotateY !== 0) parts.push(`rotateY(${values.rotateY}deg)`);
    return parts.length ? parts.join(' ') : 'none';
  }

  // Interpolate between values
  interpolate(start, end, progress, unit = '') {
    if (typeof start === 'number' && typeof end === 'number') {
      return start + (end - start) * progress + unit;
    }
    if (typeof start === 'string' && typeof end === 'string') {
      const startNum = parseFloat(start);
      const endNum = parseFloat(end);
      if (!isNaN(startNum) && !isNaN(endNum)) {
        return startNum + (endNum - startNum) * progress + unit;
      }
    }
    return progress < 0.5 ? start : end;
  }

  // Update animations
  update() {
    if (!this.running) return;

    const currentTime = performance.now();
    
    this.animations.forEach((animation, id) => {
      const elapsed = currentTime - animation.startTime;
      let progress = Math.min(elapsed / animation.duration, 1);
      
      // Apply easing
      const easingFunc = this.easing[animation.easing] || this.easing.ease;
      const easedProgress = easingFunc(progress);
      
      // Apply keyframe styles
      const keyframes = Object.keys(animation.keyframes);
      if (keyframes.length >= 2) {
        const styles = {};
        
        // Find current keyframe pair
        let fromFrame = keyframes[0];
        let toFrame = keyframes[1];
        
        for (let i = 0; i < keyframes.length - 1; i++) {
          const currentPercent = parseFloat(keyframes[i].replace('%', '')) / 100;
          const nextPercent = parseFloat(keyframes[i + 1].replace('%', '')) / 100;
          
          if (easedProgress >= currentPercent && easedProgress <= nextPercent) {
            fromFrame = keyframes[i];
            toFrame = keyframes[i + 1];
            
            const frameProgress = (easedProgress - currentPercent) / (nextPercent - currentPercent);
            progress = frameProgress;
            break;
          }
        }
        
        const fromStyles = animation.keyframes[fromFrame];
        const toStyles = animation.keyframes[toFrame];
        
        // Interpolate styles
        Object.keys(fromStyles).forEach(prop => {
          if (toStyles[prop] !== undefined) {
            if (prop === 'transform') {
              const fromTransform = this.parseTransform(fromStyles[prop]);
              const toTransform = this.parseTransform(toStyles[prop]);
              const interpolated = {};
              
              Object.keys(fromTransform).forEach(key => {
                interpolated[key] = this.interpolate(fromTransform[key], toTransform[key], progress);
              });
              
              styles[prop] = this.buildTransform(interpolated);
            } else {
              styles[prop] = this.interpolate(fromStyles[prop], toStyles[prop], progress);
            }
          }
        });
        
        // Apply styles to element
        Object.keys(styles).forEach(prop => {
          if (prop === 'transform') {
            animation.element.style.transform = styles[prop];
          } else {
            animation.element.style[prop] = styles[prop];
          }
        });
      }
      
      // Check if animation is complete
      if (elapsed >= animation.duration) {
        if (animation.infinite) {
          animation.startTime = currentTime;
        } else if (animation.repeat && animation.repeat > 1) {
          animation.repeat--;
          animation.startTime = currentTime;
        } else {
          // Animation complete
          if (animation.onComplete) animation.onComplete();
          this.animations.delete(id);
        }
      }
    });
    
    requestAnimationFrame(() => this.update());
  }

  // Stop animation
  stop(id) {
    this.animations.delete(id);
  }

  // Stop all animations
  stopAll() {
    this.animations.clear();
  }

  // Predefined animation presets
  presets = {
    fadeIn: (element, duration = 500) => {
      return this.animate(element, {
        duration,
        keyframes: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        }
      });
    },
    
    slideInUp: (element, duration = 500) => {
      return this.animate(element, {
        duration,
        easing: 'ease-out',
        keyframes: {
          'from': { transform: 'translateY(50px)', opacity: '0' },
          'to': { transform: 'translateY(0px)', opacity: '1' }
        }
      });
    },
    
    bounce: (element, duration = 600) => {
      return this.animate(element, {
        duration,
        easing: 'ease-out',
        keyframes: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' }
        }
      });
    },
    
    pulse: (element, duration = 2000) => {
      return this.animate(element, {
        duration,
        infinite: true,
        keyframes: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' }
        }
      });
    },
    
    float: (element, duration = 3000) => {
      return this.animate(element, {
        duration,
        infinite: true,
        easing: 'ease-in-out',
        keyframes: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(0px)' }
        }
      });
    },
    
    spin: (element, duration = 1500) => {
      return this.animate(element, {
        duration,
        infinite: true,
        easing: 'linear',
        keyframes: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' }
        }
      });
    },
    
    glow: (element, duration = 2000) => {
      return this.animate(element, {
        duration,
        infinite: true,
        easing: 'ease-in-out',
        keyframes: {
          '0%': { boxShadow: '0 4px 16px rgba(255, 71, 87, 0.3)' },
          '50%': { boxShadow: '0 6px 20px rgba(255, 71, 87, 0.5)' },
          '100%': { boxShadow: '0 4px 16px rgba(255, 71, 87, 0.3)' }
        }
      });
    }
  };
}

// Initialize Animation Engine
const animationEngine = new AnimationEngine();

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

// UI Elements
const scoreText = document.getElementById("score");
const messageText = document.getElementById("message");
const livesText = document.getElementById("lives");
const levelIndicator = document.getElementById("levelIndicator");

// Loading Screen Management
const loadingManager = {
  showLoading() {
    const loadingContent = document.getElementById("loadingContent");
    const menuContent = document.getElementById("menuContent");
    if (loadingContent && menuContent) {
      loadingContent.style.display = "block";
      menuContent.style.display = "none";
    }
  },
  
  hideLoading() {
    const loadingContent = document.getElementById("loadingContent");
    const menuContent = document.getElementById("menuContent");
    if (loadingContent && menuContent) {
      loadingContent.style.display = "none";
      menuContent.style.display = "block";
    }
  },
  
  updateProgress(percentage, text = "Loading assets...") {
    const progressFill = document.getElementById("progressFill");
    const loadingText = document.getElementById("loadingText");
    if (progressFill) {
      progressFill.style.width = percentage + "%";
    }
    if (loadingText) {
      loadingText.textContent = text;
    }
  }
};

// Level Display Manager
const levelDisplay = {
  update(level) {
    if (levelIndicator) {
      levelIndicator.textContent = `Level ${level}`;
      levelIndicator.classList.add('level-update');
      
      // Trigger level update animation
      gameAnimations.updateLevel();
      
      setTimeout(() => {
        levelIndicator.classList.remove('level-update');
      }, 1000);
    }
  }
};

// Enhanced Asset Manager with Animation Support
const assetManager = {
  images: {},
  animations: {},
  loadQueue: [],
  loaded: 0,
  total: 0,
  
  loadImage(name, src) {
    this.total++;
    this.loadQueue.push({name, src, type: 'image'});
  },
  
  // Load animation frames
  loadAnimation(baseName, frameCount, pathTemplate) {
    for (let i = 1; i <= frameCount; i++) {
      const paddedNum = i.toString().padStart(2, '0');
      const frameName = `${baseName}_${paddedNum}`;
      const path = pathTemplate.replace('{i}', paddedNum);
      this.loadImage(frameName, path);
    }
  },
  
  async loadAll() {
    loadingManager.showLoading();
    
    const promises = this.loadQueue.map(({name, src}, index) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.images[name] = img;
          this.loaded++;
          const progress = (this.loaded / this.total) * 100;
          loadingManager.updateProgress(progress, `Loading ${name}... (${this.loaded}/${this.total})`);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load ${name} from ${src}`);
          this.loaded++;
          const progress = (this.loaded / this.total) * 100;
          loadingManager.updateProgress(progress, `Loading... (${this.loaded}/${this.total})`);
          resolve(); // Continue even if one image fails
        };
        img.src = src;
      });
    });
    
    await Promise.all(promises);
    
    // Setup animation arrays
    this.setupAnimations();
    
    loadingManager.updateProgress(100, "Ready to play!");
    
    // Small delay to show completion
    setTimeout(() => {
      loadingManager.hideLoading();
    }, 500);
    
    return this.images;
  },
  
  setupAnimations() {
    // Player walking animation
    this.animations.playerWalk = [];
    for (let i = 1; i <= 11; i++) {
      const paddedNum = i.toString().padStart(2, '0');
      const frameName = `player_walk_${paddedNum}`;
      if (this.images[frameName]) {
        this.animations.playerWalk.push(this.images[frameName]);
      }
    }
    
    // Enemy animations
    this.animations.slimeWalk = [
      this.images.enemy_slime1,
      this.images.enemy_slime2
    ].filter(img => img);
    
    this.animations.flyMove = [
      this.images.enemy_fly1,
      this.images.enemy_fly2
    ].filter(img => img);
    
    this.animations.snailWalk = [
      this.images.enemy_snail1,
      this.images.enemy_snail2
    ].filter(img => img);
    
    console.log('Animations setup complete:', Object.keys(this.animations));
  },
  
  get(name) {
    return this.images[name];
  },
  
  getAnimation(name) {
    return this.animations[name] || [];
  }
};

// Load enhanced assets
// Player assets
assetManager.loadImage('player_idle', 'kenney_platformer-art-deluxe/Base pack/Player/p1_front.png');
assetManager.loadImage('player_jump', 'kenney_platformer-art-deluxe/Base pack/Player/p1_jump.png');
assetManager.loadImage('player_hurt', 'kenney_platformer-art-deluxe/Base pack/Player/p1_hurt.png');
assetManager.loadImage('player_duck', 'kenney_platformer-art-deluxe/Base pack/Player/p1_duck.png');

// Player walking animation (11 frames)
assetManager.loadAnimation('player_walk', 11, 'kenney_platformer-art-deluxe/Base pack/Player/p1_walk/PNG/p1_walk{i}.png');

// Enhanced enemies
assetManager.loadImage('enemy_slime1', 'kenney_platformer-art-deluxe/Base pack/Enemies/slimeWalk1.png');
assetManager.loadImage('enemy_slime2', 'kenney_platformer-art-deluxe/Base pack/Enemies/slimeWalk2.png');
assetManager.loadImage('enemy_fly1', 'kenney_platformer-art-deluxe/Base pack/Enemies/flyFly1.png');
assetManager.loadImage('enemy_fly2', 'kenney_platformer-art-deluxe/Base pack/Enemies/flyFly2.png');
assetManager.loadImage('enemy_snail1', 'kenney_platformer-art-deluxe/Base pack/Enemies/snailWalk1.png');
assetManager.loadImage('enemy_snail2', 'kenney_platformer-art-deluxe/Base pack/Enemies/snailWalk2.png');

// Enhanced collectibles
assetManager.loadImage('crystal_gold', 'kenney_platformer-art-deluxe/Base pack/Items/coinGold.png');
assetManager.loadImage('crystal_silver', 'kenney_platformer-art-deluxe/Base pack/Items/coinSilver.png');
assetManager.loadImage('gem_green', 'kenney_platformer-art-deluxe/Base pack/Items/gemGreen.png');
assetManager.loadImage('gem_red', 'kenney_platformer-art-deluxe/Base pack/Items/gemRed.png');
assetManager.loadImage('gem_yellow', 'kenney_platformer-art-deluxe/Base pack/Items/gemYellow.png');
assetManager.loadImage('star_powerup', 'kenney_platformer-art-deluxe/Base pack/Items/star.png');

// Environmental elements
assetManager.loadImage('cloud1', 'kenney_platformer-art-deluxe/Base pack/Items/cloud1.png');
assetManager.loadImage('cloud2', 'kenney_platformer-art-deluxe/Base pack/Items/cloud2.png');
assetManager.loadImage('cloud3', 'kenney_platformer-art-deluxe/Base pack/Items/cloud3.png');
assetManager.loadImage('bush', 'kenney_platformer-art-deluxe/Base pack/Items/bush.png');
assetManager.loadImage('plant', 'kenney_platformer-art-deluxe/Base pack/Items/plant.png');
assetManager.loadImage('plant_purple', 'kenney_platformer-art-deluxe/Base pack/Items/plantPurple.png');

// Goal elements
assetManager.loadImage('flag_goal', 'kenney_platformer-art-deluxe/Base pack/Items/flagGreen.png');

// Original fallback assets
assetManager.loadImage('player_original', 'assets/images/player.png');
assetManager.loadImage('enemy_original', 'assets/images/enemy.png');
assetManager.loadImage('crystal_original', 'assets/images/crystal.png');
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

// Enhanced Animated Player Class
class AnimatedPlayer {
  constructor() {
    this.x = 100;
    this.y = 400;
    this.w = 40;
    this.h = 60;
    this.vx = 0;
    this.vy = 0;
    this.speed = 5;
    this.jumping = false;
    this.grounded = false;
    this.hasDoubleJump = false;
    this.hasFastShoot = false;
    this.powerUpTimer = 0;
    
    // Animation properties
    this.state = 'idle'; // idle, walking, jumping, hurt, ducking
    this.frame = 0;
    this.frameTimer = 0;
    this.frameSpeed = 8; // frames per second
    this.facing = 1; // 1 for right, -1 for left
    this.lastDirection = 0;
    
    // Smooth movement
    this.targetX = this.x;
    this.smoothing = 0.15;
    
    // Visual effects
    this.dustParticles = [];
    this.afterImages = [];
  }
  
  update() {
    this.frameTimer++;
    
    // Determine animation state
    this.updateAnimationState();
    
    // Update frame animation
    if (this.frameTimer >= 60 / this.frameSpeed) {
      this.frame++;
      this.frameTimer = 0;
      
      // Reset frame based on animation
      const walkFrames = assetManager.getAnimation('playerWalk');
      if (this.state === 'walking' && walkFrames.length > 0) {
        if (this.frame >= walkFrames.length) this.frame = 0;
      } else {
        this.frame = 0; // Static states don't animate
      }
    }
    
    // Smooth movement interpolation
    if (Math.abs(this.targetX - this.x) > 0.1) {
      this.x += (this.targetX - this.x) * this.smoothing;
    }
    
    // Update dust particles
    this.updateDustParticles();
    
    // Update after images for fast movement
    this.updateAfterImages();
  }
  
  updateAnimationState() {
    const prevState = this.state;
    
    if (this.powerUpTimer > 0 && this.powerUpTimer % 10 < 5) {
      this.state = 'hurt'; // Flashing when powered up
    } else if (!this.grounded && this.vy !== 0) {
      this.state = 'jumping';
    } else if (keys['KeyS'] || keys['ArrowDown']) {
      this.state = 'ducking';
    } else if (keys['KeyA'] || keys['ArrowLeft'] || keys['KeyD'] || keys['ArrowRight']) {
      this.state = 'walking';
      
      // Update facing direction
      if (keys['KeyA'] || keys['ArrowLeft']) {
        this.facing = -1;
        this.lastDirection = -1;
      } else if (keys['KeyD'] || keys['ArrowRight']) {
        this.facing = 1;
        this.lastDirection = 1;
      }
      
      // Create dust particles when walking
      if (this.grounded && Math.random() < 0.3) {
        this.createDustParticle();
      }
    } else {
      this.state = 'idle';
    }
    
    // Reset frame when state changes
    if (prevState !== this.state) {
      this.frame = 0;
      this.frameTimer = 0;
    }
  }
  
  createDustParticle() {
    this.dustParticles.push({
      x: this.x + this.w / 2 + (Math.random() - 0.5) * this.w,
      y: this.y + this.h - 5,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 2,
      life: 20,
      maxLife: 20,
      size: Math.random() * 3 + 1
    });
  }
  
  updateDustParticles() {
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.life--;
      
      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
      }
    }
  }
  
  updateAfterImages() {
    // Create after images for fast movement
    if (Math.abs(this.vx) > 3 || this.hasFastShoot) {
      this.afterImages.push({
        x: this.x,
        y: this.y,
        life: 10,
        maxLife: 10,
        state: this.state,
        frame: this.frame,
        facing: this.facing
      });
    }
    
    // Update after images
    for (let i = this.afterImages.length - 1; i >= 0; i--) {
      this.afterImages[i].life--;
      if (this.afterImages[i].life <= 0) {
        this.afterImages.splice(i, 1);
      }
    }
  }
  
  draw(ctx) {
    // Draw after images first
    this.drawAfterImages(ctx);
    
    // Draw dust particles
    this.drawDustParticles(ctx);
    
    // Get appropriate sprite
    let sprite = this.getCurrentSprite();
    
    if (sprite) {
      ctx.save();
      
      // Flip sprite if facing left
      if (this.facing === -1) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -(this.x + this.w), this.y, this.w, this.h);
      } else {
        ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
      }
      
      ctx.restore();
      
      // Power-up glow effect
      if (this.powerUpTimer > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.hasDoubleJump ? '#00ff00' : '#ff0000';
        ctx.fillRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4);
        ctx.restore();
      }
    } else {
      // Fallback rectangle if no sprite
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
  
  getCurrentSprite() {
    switch (this.state) {
      case 'walking':
        const walkFrames = assetManager.getAnimation('playerWalk');
        if (walkFrames.length > 0) {
          return walkFrames[this.frame % walkFrames.length];
        }
        return assetManager.get('player_idle') || assetManager.get('player_original');
        
      case 'jumping':
        return assetManager.get('player_jump') || assetManager.get('player_original');
        
      case 'hurt':
        return assetManager.get('player_hurt') || assetManager.get('player_original');
        
      case 'ducking':
        return assetManager.get('player_duck') || assetManager.get('player_original');
        
      default: // idle
        return assetManager.get('player_idle') || assetManager.get('player_original');
    }
  }
  
  drawAfterImages(ctx) {
    ctx.save();
    for (const afterImage of this.afterImages) {
      const alpha = afterImage.life / afterImage.maxLife * 0.3;
      ctx.globalAlpha = alpha;
      
      let sprite = assetManager.get('player_idle') || assetManager.get('player_original');
      if (sprite) {
        if (afterImage.facing === -1) {
          ctx.scale(-1, 1);
          ctx.drawImage(sprite, -(afterImage.x + this.w), afterImage.y, this.w, this.h);
          ctx.scale(-1, 1);
        } else {
          ctx.drawImage(sprite, afterImage.x, afterImage.y, this.w, this.h);
        }
      }
    }
    ctx.restore();
  }
  
  drawDustParticles(ctx) {
    ctx.save();
    for (const p of this.dustParticles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }
  
  // Reset method for level changes
  reset() {
    this.x = 100;
    this.y = 400;
    this.vx = 0;
    this.vy = 0;
    this.jumping = false;
    this.grounded = false;
    this.hasDoubleJump = false;
    this.hasFastShoot = false;
    this.powerUpTimer = 0;
    this.state = 'idle';
    this.frame = 0;
    this.frameTimer = 0;
    this.dustParticles = [];
    this.afterImages = [];
  }
}

// Create enhanced player instance
const player = new AnimatedPlayer();

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
    
    // Enhanced visual properties
    this.scale = 1;
    this.targetScale = 1;
    this.rotation = 0;
    this.alpha = 1;
    this.shadowOffset = 0;
    
    // Particle effects
    this.moveParticles = [];
    this.deathParticles = [];
    
    // Flying enemies have different behavior
    if (type === 'fly') {
      this.flyHeight = y;
      this.bobOffset = 0;
      this.bobSpeed = 0.1;
      this.speed = 1.5;
    } else if (type === 'snail') {
      this.speed = 1; // Slower than slime
    }
  }
  
  update() {
    if (!this.alive) {
      this.updateDeathAnimation();
      return;
    }
    
    // Animation
    this.animTimer += this.animSpeed;
    if (this.animTimer >= 1) {
      this.animFrame = (this.animFrame + 1) % 2;
      this.animTimer = 0;
    }
    
    // Smooth scaling
    this.scale += (this.targetScale - this.scale) * 0.2;
    
    // Movement based on type
    if (this.type === 'fly') {
      this.updateFlyMovement();
    } else {
      this.updateGroundMovement();
    }
    
    // Update particles
    this.updateParticles();
    
    // Create movement particles occasionally
    if (Math.random() < 0.1) {
      this.createMoveParticle();
    }
  }
  
  updateGroundMovement() {
    // Patrol behavior with smooth direction changes
    this.x += this.speed * this.direction;
    
    // Add slight bouncing for slimes
    if (this.type === 'slime') {
      this.shadowOffset = Math.sin(this.animFrame * Math.PI) * 2;
    }
    
    if (this.x <= this.patrol.start || this.x >= this.patrol.end) {
      this.direction *= -1;
      this.targetScale = 1.2; // Squeeze effect when turning
      setTimeout(() => { this.targetScale = 1; }, 200);
    }
  }
  
  updateFlyMovement() {
    // Flying pattern with enhanced bobbing
    this.x += this.speed * this.direction * 0.7;
    this.bobOffset += this.bobSpeed;
    this.y = this.flyHeight + Math.sin(this.bobOffset) * 15;
    
    // Wing flapping rotation
    this.rotation = Math.sin(this.animFrame * Math.PI * 2) * 0.1;
    
    // Change direction at patrol bounds
    if (this.x <= this.patrol.start || this.x >= this.patrol.end) {
      this.direction *= -1;
    }
  }
  
  createMoveParticle() {
    this.moveParticles.push({
      x: this.x + this.w / 2 + (Math.random() - 0.5) * this.w,
      y: this.y + this.h + Math.random() * 5,
      vx: (Math.random() - 0.5) * 1,
      vy: -Math.random() * 1,
      life: 15,
      maxLife: 15,
      size: Math.random() * 2 + 1,
      color: this.type === 'fly' ? '#87CEEB' : this.type === 'slime' ? '#90EE90' : '#8B4513'
    });
  }
  
  updateParticles() {
    // Update move particles
    for (let i = this.moveParticles.length - 1; i >= 0; i--) {
      const p = this.moveParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life--;
      
      if (p.life <= 0) {
        this.moveParticles.splice(i, 1);
      }
    }
    
    // Update death particles
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      const p = this.deathParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
      p.rotation += p.rotSpeed;
      
      if (p.life <= 0) {
        this.deathParticles.splice(i, 1);
      }
    }
  }
  
  die() {
    this.alive = false;
    this.alpha = 1;
    
    // Create death explosion particles
    for (let i = 0; i < 8; i++) {
      this.deathParticles.push({
        x: this.x + this.w / 2,
        y: this.y + this.h / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 30,
        maxLife: 30,
        size: Math.random() * 4 + 2,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        color: this.type === 'fly' ? '#4169E1' : this.type === 'slime' ? '#32CD32' : '#A0522D'
      });
    }
  }
  
  updateDeathAnimation() {
    this.alpha -= 0.03;
    this.scale += 0.02;
    this.rotation += 0.1;
    
    if (this.alpha <= 0) {
      this.alpha = 0;
    }
  }
  
  draw(ctx) {
    // Draw movement particles
    this.drawParticles(ctx, this.moveParticles);
    
    if (this.alive || this.alpha > 0) {
      ctx.save();
      
      // Apply transformations
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);
      
      // Get sprite based on type and animation frame
      let sprite = this.getSprite();
      
      if (sprite) {
        // Flip sprite based on direction
        if (this.direction === -1) {
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(sprite, -this.w / 2, -this.h / 2 + this.shadowOffset, this.w, this.h);
      } else {
        // Fallback shape
        ctx.fillStyle = this.getColor();
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      }
      
      ctx.restore();
      
      // Draw shadow for ground enemies
      if (this.type !== 'fly' && this.alive) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.ellipse(this.x + this.w / 2, this.y + this.h + 5, this.w / 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Draw death particles
    this.drawParticles(ctx, this.deathParticles);
  }
  
  getSprite() {
    const animations = assetManager.getAnimation(`${this.type}Walk`) || 
                     assetManager.getAnimation(`${this.type}Move`);
    
    if (animations.length > 0) {
      return animations[this.animFrame % animations.length];
    }
    
    // Fallback to individual sprites
    const spriteName = `enemy_${this.type}${this.animFrame + 1}`;
    return assetManager.get(spriteName) || assetManager.get('enemy_original');
  }
  
  getColor() {
    switch (this.type) {
      case 'slime': return '#32CD32';
      case 'fly': return '#4169E1';
      case 'snail': return '#A0522D';
      default: return '#FF6B6B';
    }
  }
  
  drawParticles(ctx, particles) {
    ctx.save();
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || '#888';
      
      if (p.rotation !== undefined) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else {
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
    }
    ctx.restore();
  }
    
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

// Enhanced Level System with Professional Obstacles
function createObstacle(x, y, width, height, type = 'box') {
  return {
    x, y, width, height, type,
    render() {
      const img = assetManager.get(this.type);
      if (img) {
        // Professional tile rendering with proper alignment
        const tileSize = 70;
        for (let i = 0; i < this.width; i += tileSize) {
          for (let j = 0; j < this.height; j += tileSize) {
            const tileWidth = Math.min(tileSize, this.width - i);
            const tileHeight = Math.min(tileSize, this.height - j);
            ctx.drawImage(img, this.x + i, this.y + j, tileWidth, tileHeight);
          }
        }
        
        // Add subtle border for visual clarity
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
      } else {
        // Enhanced fallback with gradient and border
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        if (this.type === 'box') {
          gradient.addColorStop(0, '#D2B48C');
          gradient.addColorStop(1, '#8B7355');
        } else {
          gradient.addColorStop(0, '#A0A0A0');
          gradient.addColorStop(1, '#606060');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Professional border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    },
    
    // Enhanced collision detection with pixel-perfect bounds
    getBounds() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      };
    }
  };
}

function loadLevel(levelIndex) {
  const level = levels[levelIndex];
  
  // Update level display
  levelDisplay.update(levelIndex + 1);
  
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
    // Beginner level - simple platforms with strategic obstacles
    platformSystem.createPlatform(0, 480, 400, 'grass');
    platformSystem.createPlatform(500, 450, 200, 'grass');
    platformSystem.createPlatform(800, 420, 250, 'grass');
    platformSystem.createPlatform(1200, 480, 300, 'grass');
    platformSystem.createPlatform(1600, 450, 200, 'grass');
    
    // Strategic obstacle placement - not blocking critical paths
    obstacles.push(createObstacle(450, 410, 70, 70, 'box'));  // Small gap jump challenge
    obstacles.push(createObstacle(1050, 380, 140, 70, 'stone')); // Platform gap challenge
    
  } else if (levelIndex === 1) {
    // Intermediate - more gaps and heights with thoughtful obstacles
    platformSystem.createPlatform(0, 480, 300, 'grass');
    platformSystem.createPlatform(400, 400, 150, 'grass');
    platformSystem.createPlatform(650, 350, 200, 'grass');
    platformSystem.createPlatform(950, 300, 180, 'grass');
    platformSystem.createPlatform(1200, 380, 250, 'grass');
    platformSystem.createPlatform(1550, 430, 200, 'grass');
    
    // Carefully placed obstacles that enhance difficulty without frustration
    obstacles.push(createObstacle(350, 460, 70, 70, 'box'));   // Before first jump
    obstacles.push(createObstacle(580, 310, 70, 70, 'stone')); // On platform edge
    obstacles.push(createObstacle(1130, 340, 70, 70, 'box'));  // Between platforms
    
  } else if (levelIndex === 2) {
    // Advanced - vertical challenges with precision obstacles
    platformSystem.createPlatform(0, 480, 250, 'grass');
    platformSystem.createPlatform(350, 380, 120, 'grass');
    platformSystem.createPlatform(550, 280, 150, 'grass');
    platformSystem.createPlatform(800, 200, 120, 'grass');
    platformSystem.createPlatform(1000, 320, 180, 'grass');
    platformSystem.createPlatform(1300, 400, 200, 'grass');
    
    // Obstacles that require careful timing and skill
    obstacles.push(createObstacle(280, 440, 70, 70, 'stone')); // Jump timing challenge
    obstacles.push(createObstacle(470, 340, 70, 70, 'box'));   // Platform precision
    obstacles.push(createObstacle(720, 160, 70, 70, 'stone')); // High platform challenge
    obstacles.push(createObstacle(1220, 360, 70, 70, 'box'));  // Landing challenge
    
  } else if (levelIndex === 3) {
    // Expert - precise jumping required with expert obstacle placement
    platformSystem.createPlatform(0, 480, 200, 'grass');
    platformSystem.createPlatform(300, 350, 100, 'grass');
    platformSystem.createPlatform(500, 220, 120, 'grass');
    platformSystem.createPlatform(750, 150, 100, 'grass');
    platformSystem.createPlatform(950, 250, 150, 'grass');
    platformSystem.createPlatform(1200, 380, 180, 'grass');
    platformSystem.createPlatform(1500, 300, 200, 'grass');
    
    // Expert-level obstacle placement requiring mastery
    obstacles.push(createObstacle(220, 440, 70, 70, 'box'));   // Early challenge
    obstacles.push(createObstacle(420, 180, 70, 70, 'stone')); // Mid-air precision
    obstacles.push(createObstacle(670, 110, 70, 70, 'box'));   // High-level skill
    obstacles.push(createObstacle(1100, 210, 70, 70, 'stone')); // Expert timing
    obstacles.push(createObstacle(1420, 260, 70, 70, 'box'));  // Final challenge
    
  } else {
    // Master level - extreme difficulty with masterful obstacle design
    platformSystem.createPlatform(0, 480, 150, 'grass');
    platformSystem.createPlatform(250, 380, 80, 'grass');
    platformSystem.createPlatform(430, 250, 100, 'grass');
    platformSystem.createPlatform(630, 150, 80, 'grass');
    platformSystem.createPlatform(800, 200, 120, 'grass');
    platformSystem.createPlatform(1000, 320, 100, 'grass');
    platformSystem.createPlatform(1200, 400, 150, 'grass');
    platformSystem.createPlatform(1450, 280, 180, 'grass');
    
    // Master-level obstacles requiring perfect execution
    obstacles.push(createObstacle(170, 440, 70, 70, 'stone')); // Immediate challenge
    obstacles.push(createObstacle(350, 210, 70, 70, 'box'));   // Precision jump
    obstacles.push(createObstacle(550, 110, 70, 70, 'stone')); // Perfect timing
    obstacles.push(createObstacle(720, 160, 70, 70, 'box'));   // Expert navigation
    obstacles.push(createObstacle(920, 280, 70, 70, 'stone')); // Master timing
    obstacles.push(createObstacle(1120, 360, 70, 70, 'box'));  // Final precision
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
  // Reset enhanced player
  player.reset();
  
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

  // Update enhanced player animations
  player.update();

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

  // Enhanced collision with obstacles - smooth and fair
  obstacles.forEach(obstacle => {
    const bounds = obstacle.getBounds ? obstacle.getBounds() : obstacle;
    
    // More precise collision detection
    if (player.x + player.w > bounds.x + 2 &&
        player.x < bounds.x + bounds.width - 2 &&
        player.y + player.h > bounds.y + 2 &&
        player.y < bounds.y + bounds.height - 2) {
      
      // Smart collision response based on player approach direction
      const playerCenterX = player.x + player.w / 2;
      const playerCenterY = player.y + player.h / 2;
      const obstacleCenterX = bounds.x + bounds.width / 2;
      const obstacleCenterY = bounds.y + bounds.height / 2;
      
      const deltaX = playerCenterX - obstacleCenterX;
      const deltaY = playerCenterY - obstacleCenterY;
      
      // Determine collision side and respond appropriately
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal collision
        if (deltaX > 0) {
          // Player hitting from right
          player.x = bounds.x + bounds.width + 1;
        } else {
          // Player hitting from left
          player.x = bounds.x - player.w - 1;
        }
        player.vx = 0; // Stop horizontal movement
      } else {
        // Vertical collision
        if (deltaY > 0 && player.vy > 0) {
          // Player landing on top
          player.y = bounds.y - player.h;
          player.vy = 0;
          player.grounded = true;
          player.jumping = false;
          if (currentLevel > 0) player.hasDoubleJump = true;
        } else if (deltaY < 0 && player.vy < 0) {
          // Player hitting from below
          player.y = bounds.y + bounds.height + 1;
          player.vy = 0;
        }
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
      
      // Trigger game over animation
      setTimeout(() => {
        gameAnimations.gameOverSlide(messageText);
      }, 100);
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
      
      // Enhanced feedback for crystal collection
      vibrate(30); // Light vibration for crystal
      
      // Visual feedback for crystal collection
      messageText.textContent = "Crystal collected! +10 points";
      messageText.classList.add('powerup-collected');
      setTimeout(() => {
        messageText.classList.remove('powerup-collected');
        if (messageText.textContent === "Crystal collected! +10 points") {
          messageText.textContent = "";
        }
      }, 1000);
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
      
      // Enhanced feedback for power-up
      vibrate(100); // Stronger vibration for power-up
      
      // Enhanced visual feedback for power-up
      const powerUpMessages = {
        speed: "Speed Boost! 🏃‍♂️",
        jump: "Double Jump! 🦘", 
        shoot: "Fast Shooting! 💥"
      };
      messageText.textContent = powerUpMessages[p.type] || "Power-up activated!";
      messageText.classList.add('powerup-collected');
      setTimeout(() => {
        messageText.classList.remove('powerup-collected');
        if (messageText.textContent === powerUpMessages[p.type]) {
          messageText.textContent = "";
        }
      }, 1500);
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
      
      // Trigger victory animation
      setTimeout(() => {
        gameAnimations.victoryBounce(messageText);
      }, 100);
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
  
  // Draw dynamic obstacles with enhanced visuals
  obstacles.forEach(obstacle => {
    if (obstacle.render) {
      obstacle.render();
      
      // Add warning indicator when player is near
      const distanceToPlayer = Math.abs(obstacle.x - player.x);
      if (distanceToPlayer < 200) {
        const alpha = Math.max(0.1, 1 - (distanceToPlayer / 200));
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.3})`;
        ctx.fillRect(obstacle.x - 5, obstacle.y - 5, obstacle.width + 10, obstacle.height + 10);
      }
    }
  });
  
  // Draw ground
  ctx.fillStyle = "#333";
  ctx.fillRect(ground.x, ground.y, ground.w, ground.h);
  // Draw enhanced crystals and collectibles
  crystals.forEach((c, index) => {
    if (!c.collected) {
      // Enhanced crystal animation
      const time = Date.now() * 0.005;
      const bobOffset = Math.sin(time + index * 0.5) * 3;
      const scaleOffset = 1 + Math.sin(time * 2 + index) * 0.1;
      
      ctx.save();
      ctx.translate(c.x + 15, c.y + 15 + bobOffset);
      ctx.scale(scaleOffset, scaleOffset);
      
      // Use enhanced crystal sprite or fallback
      const crystalSprite = Math.random() < 0.33 ? 
        assetManager.get('crystal_gold') : 
        Math.random() < 0.5 ? 
          assetManager.get('gem_green') : 
          assetManager.get('gem_yellow');
      
      if (crystalSprite) {
        ctx.drawImage(crystalSprite, -15, -15, 30, 30);
      } else {
        // Fallback crystal
        ctx.drawImage(crystalImg, -15, -15, 30, 30);
      }
      
      ctx.restore();
      
      // Enhanced sparkle effect
      if (Math.random() < 0.4) {
        const sparkleX = c.x + Math.random() * 30;
        const sparkleY = c.y + Math.random() * 30 + bobOffset;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`;
      ctx.fillText(symbol, 0, 4);
      
      ctx.restore();
      
      // Collection hint when player is near
      const distToPlayer = Math.abs(p.x - player.x);
      if (distToPlayer < 80) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = p.type === 'doubleJump' ? '#00FF00' : '#FF4500';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(p.x - 10, p.y - 10, p.w + 20, p.h + 20);
        ctx.restore();
      }
    }
  });

  // Draw enhanced portal with goal flag
  const portalTime = Date.now() * 0.004;
  const portalGlow = (Math.sin(portalTime) + 1) * 0.5;
  
  ctx.save();
  
  // Portal energy field
  ctx.globalAlpha = 0.2 + portalGlow * 0.3;
  ctx.fillStyle = '#00FFFF';
  ctx.fillRect(portal.x - 10, portal.y - 10, portal.w + 20, portal.h + 20);
  
  ctx.globalAlpha = 1;
  
  // Use goal flag sprite or fallback to portal
  const goalSprite = assetManager.get('flag_goal');
  if (goalSprite) {
    const flagBob = Math.sin(portalTime * 2) * 3;
    ctx.drawImage(goalSprite, portal.x, portal.y + flagBob, portal.w, portal.h);
    
    // Add wind effect to flag
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = '#32CD32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const waveY = portal.y + 10 + i * 5 + Math.sin(portalTime * 3 + i) * 2;
      ctx.moveTo(portal.x + portal.w, waveY);
      ctx.lineTo(portal.x + portal.w + 15, waveY);
    }
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.drawImage(portalImg, portal.x, portal.y, portal.w, portal.h);
  }
  
  ctx.restore();
  
  // Level completion indicator when player is near
  const distToPortal = Math.abs(portal.x - player.x);
  if (distToPortal < 100) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 FINISH!', portal.x + portal.w / 2, portal.y - 20);
    ctx.restore();
  }
      // Collection hint when player is near
      const distToPlayer = Math.abs(c.x - player.x);
      if (distToPlayer < 60) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(c.x - 5, c.y - 5, 40, 40);
        ctx.restore();
      }
    }
  });

  // Draw enhanced power-ups
  powerUps.forEach((p, index) => {
    if (!p.collected) {
      const time = Date.now() * 0.003;
      const rotationOffset = Math.sin(time + index * 0.8) * 0.2;
      const glowIntensity = (Math.sin(time * 2) + 1) * 0.5;
      
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(rotationOffset);
      
      // Enhanced glow effect
      ctx.globalAlpha = 0.3 + glowIntensity * 0.4;
      ctx.fillStyle = p.type === 'doubleJump' ? '#00FF00' : '#FF4500';
      ctx.fillRect(-p.w / 2 - 8, -p.h / 2 - 8, p.w + 16, p.h + 16);
      
      ctx.globalAlpha = 1;
      
      // Use appropriate sprite
      let powerupSprite;
      switch(p.type) {
        case 'doubleJump':
          powerupSprite = assetManager.get('mushroom_red');
          break;
        case 'fastShoot':
          powerupSprite = assetManager.get('star_powerup');
          break;
        default:
          powerupSprite = assetManager.get('mushroom_brown');
      }
      
      if (powerupSprite) {
        ctx.drawImage(powerupSprite, -p.w / 2, -p.h / 2, p.w, p.h);
      } else {
        // Fallback power-up visual
        ctx.fillStyle = "#FFD700";
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        
        // Power-up symbol
        ctx.fillStyle = "#8B4513";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        let symbol = "?";
        switch(p.type) {;
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
  // Draw enhanced player with animations
  player.draw(ctx);
  ctx.globalAlpha = 1;
  
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

async function startGame() {
  // Show loading screen while initializing
  loadingManager.showLoading();
  loadingManager.updateProgress(0, "Initializing game...");
  
  // Simulate initialization steps
  await new Promise(resolve => setTimeout(resolve, 300));
  loadingManager.updateProgress(25, "Loading sound effects...");
  
  await new Promise(resolve => setTimeout(resolve, 200));
  loadingManager.updateProgress(50, "Setting up level...");
  
  await new Promise(resolve => setTimeout(resolve, 200));
  loadingManager.updateProgress(75, "Starting engines...");
  
  await new Promise(resolve => setTimeout(resolve, 200));
  loadingManager.updateProgress(100, "Ready to play!");
  
  // Small delay to show completion
  await new Promise(resolve => setTimeout(resolve, 300));
  
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
    const settingsScreen = document.getElementById('settingsScreen');
    settingsScreen.classList.add('show');
    gameAnimations.overlayFadeIn(settingsScreen);
    
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
  gameAnimations.overlayFadeIn(screen);
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
  const tutorialScreen = document.getElementById('tutorialScreen');
  tutorialScreen.classList.add('show');
  gameAnimations.overlayFadeIn(tutorialScreen);
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
    
    // Initialize JavaScript animations
    initializeAnimations();
  } catch (error) {
    console.error('Initialization error:', error);
    alert('Game failed to initialize. Please refresh the page.');
  }
}

// Initialize JavaScript Animations (replaces CSS animations)
function initializeAnimations() {
  console.log('Initializing JavaScript animation system...');
  
  // Header title pulse animation
  const headerTitle = document.querySelector('#header h1');
  if (headerTitle) {
    animationEngine.presets.pulse(headerTitle, 3000);
  }
  
  // Score/lives info floating animation
  const infoPanel = document.getElementById('info');
  if (infoPanel) {
    animationEngine.presets.glow(infoPanel, 3000);
  }
  
  // Message floating animation
  const messageElement = document.getElementById('message');
  if (messageElement) {
    animationEngine.presets.float(messageElement, 3000);
  }
  
  // Footer glow animation
  const footer = document.querySelector('footer');
  if (footer) {
    animationEngine.presets.glow(footer, 4000);
  }
  
  // Control buttons floating animation
  const controlBtns = document.querySelectorAll('.control-btn');
  controlBtns.forEach((btn, index) => {
    setTimeout(() => {
      animationEngine.presets.float(btn, 4000);
    }, index * 200); // Staggered start
  });
  
  // Overlay buttons pulse animation
  const overlayBtns = document.querySelectorAll('.overlay button');
  overlayBtns.forEach(btn => {
    animationEngine.presets.pulse(btn, 2000);
  });
  
  // Loading spinner rotation
  const loadingSpinner = document.querySelector('.loading-spinner');
  if (loadingSpinner) {
    animationEngine.presets.spin(loadingSpinner, 1500);
  }
  
  // Progress bar shine effect
  const progressFill = document.querySelector('.progress-fill');
  if (progressFill) {
    animationEngine.animate(progressFill, {
      duration: 2000,
      infinite: true,
      easing: 'ease-in-out',
      keyframes: {
        '0%': { boxShadow: '0 0 10px rgba(255, 247, 0, 0.5)' },
        '50%': { boxShadow: '0 0 20px rgba(255, 71, 87, 0.8)' },
        '100%': { boxShadow: '0 0 10px rgba(255, 247, 0, 0.5)' }
      }
    });
  }
  
  // Level indicator floating animation
  const levelIndicator = document.querySelector('.level-indicator');
  if (levelIndicator) {
    animationEngine.presets.float(levelIndicator, 4000);
  }
  
  // Add hover animations for interactive elements
  addHoverAnimations();
  
  console.log('JavaScript animations initialized successfully!');
}

// Add hover and interaction animations
function addHoverAnimations() {
  // Enhanced button hover effects
  const buttons = document.querySelectorAll('button, .control-btn');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (!isMobile) {
        animationEngine.animate(btn, {
          duration: 200,
          easing: 'ease-out',
          keyframes: {
            'from': { transform: 'scale(1)' },
            'to': { transform: 'scale(1.05)' }
          }
        });
      }
    });
    
    btn.addEventListener('mouseleave', () => {
      if (!isMobile) {
        animationEngine.animate(btn, {
          duration: 200,
          easing: 'ease-out',
          keyframes: {
            'from': { transform: 'scale(1.05)' },
            'to': { transform: 'scale(1)' }
          }
        });
      }
    });
    
    btn.addEventListener('click', () => {
      animationEngine.animate(btn, {
        duration: 150,
        easing: 'ease-out',
        keyframes: {
          '0%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' }
        }
      });
    });
  });
  
  // Canvas hover effect
  const canvas = document.getElementById('gameCanvas');
  if (canvas) {
    canvas.addEventListener('mouseenter', () => {
      if (!isMobile) {
        animationEngine.animate(canvas, {
          duration: 300,
          easing: 'ease-out',
          keyframes: {
            'from': { transform: 'scale(1)' },
            'to': { transform: 'scale(1.001)' }
          }
        });
      }
    });
    
    canvas.addEventListener('mouseleave', () => {
      if (!isMobile) {
        animationEngine.animate(canvas, {
          duration: 300,
          easing: 'ease-out',
          keyframes: {
            'from': { transform: 'scale(1.001)' },
            'to': { transform: 'scale(1)' }
          }
        });
      }
    });
  }
}

// Animation utility functions for game events
const gameAnimations = {
  // Level update animation
  updateLevel() {
    const levelIndicator = document.querySelector('.level-indicator');
    if (levelIndicator) {
      animationEngine.animate(levelIndicator, {
        duration: 800,
        easing: 'ease-out',
        keyframes: {
          '0%': { 
            transform: 'scale(1) rotateY(0deg)',
            background: 'linear-gradient(135deg, rgba(255, 247, 0, 0.92) 0%, rgba(255, 235, 59, 0.95) 100%)'
          },
          '50%': { 
            transform: 'scale(1.15) rotateY(180deg)',
            background: 'linear-gradient(135deg, #ff4757 0%, #ff3742 50%, #ff1744 100%)',
            color: '#fff'
          },
          '100%': { 
            transform: 'scale(1) rotateY(360deg)',
            background: 'linear-gradient(135deg, rgba(255, 247, 0, 0.92) 0%, rgba(255, 235, 59, 0.95) 100%)',
            color: '#333'
          }
        }
      });
    }
  },
  
  // Power-up collection flash
  powerupFlash(element) {
    animationEngine.animate(element, {
      duration: 500,
      easing: 'ease-out',
      keyframes: {
        '0%': { backgroundColor: 'rgba(255, 247, 0, 0.8)' },
        '50%': { backgroundColor: 'rgba(255, 71, 87, 0.8)' },
        '100%': { backgroundColor: 'transparent' }
      }
    });
  },
  
  // Game over screen slide in
  gameOverSlide(element) {
    animationEngine.animate(element, {
      duration: 500,
      easing: 'ease-out',
      keyframes: {
        'from': { transform: 'translateY(-50px)', opacity: '0' },
        'to': { transform: 'translateY(0)', opacity: '1' }
      }
    });
  },
  
  // Victory screen bounce
  victoryBounce(element) {
    animationEngine.animate(element, {
      duration: 700,
      easing: 'ease-out',
      keyframes: {
        '0%': { transform: 'scale(0.5)', opacity: '0' },
        '50%': { transform: 'scale(1.2)' },
        '100%': { transform: 'scale(1)', opacity: '1' }
      }
    });
  },
  
  // Overlay fade in
  overlayFadeIn(element) {
    animationEngine.animate(element, {
      duration: 500,
      easing: 'ease-out',
      keyframes: {
        'from': { opacity: '0', transform: 'scale(0.9)' },
        'to': { opacity: '1', transform: 'scale(1)' }
      }
    });
  }
};

// Make game animations globally available
window.gameAnimations = gameAnimations;

// Start initialization when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
