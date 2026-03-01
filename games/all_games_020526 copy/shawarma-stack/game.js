// game.js - Main game file

import { gameState, GAME_PHASES, INGREDIENTS, LEVEL_CONFIG } from './globals.js';
import { Customer } from './customer.js';
import { WrapRenderer } from './wrap.js';
import { UIRenderer } from './ui.js';
import { GameLogic } from './gameLogic.js';

const p5 = window.p5;

class Particle {
  constructor(p, x, y, color, type = 'normal') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-2, 2);
    this.vy = p.random(-4, -1);
    this.life = 1.0;
    this.color = color;
    this.size = p.random(4, 8);
    this.type = type;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life -= 0.02;
  }
  
  draw() {
    this.p.push();
    this.p.noStroke();
    this.p.fill(...this.color, this.life * 255);
    
    if (this.type === 'star') {
      this.drawStar(this.x, this.y, this.size, this.size * 0.5, 5);
    } else {
      this.p.ellipse(this.x, this.y, this.size);
    }
    
    this.p.pop();
  }
  
  drawStar(x, y, radius1, radius2, npoints) {
    const p = this.p;
    let angle = p.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
      let sx = x + p.cos(a) * radius1;
      let sy = y + p.sin(a) * radius1;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius2;
      sy = y + p.sin(a + halfAngle) * radius2;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }
  
  isDead() {
    return this.life <= 0;
  }
}

let gameInstance = new p5(p => {
  let wrapRenderer;
  let uiRenderer;
  let gameLogic;
  
  // TAP-BASED CONTROL COOLDOWNS (prevents held keys from triggering multiple actions)
  let lastIngredientTapTime = 0;
  let lastServeTapTime = 0;
  const TAP_COOLDOWN = 150; // milliseconds between taps
  
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('shawarmaStackHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved);
      }
    }
    
    // Initialize renderers and logic
    wrapRenderer = new WrapRenderer(p);
    uiRenderer = new UIRenderer(p);
    gameLogic = new GameLogic(p);
    
    // Log initial state
    p.logs.game_info.push({
      event: "game_start",
      data: { gamePhase: gameState.gamePhase, controlMode: "TAP_BASED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(60, 50, 70);
    
    // Update automated controller (REMOVED)
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      uiRenderer.drawStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      drawPlaying();
      gameLogic.update();
      updateParticles();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlaying();
      updateParticles();
      // Visual pause overlay removed per human feedback
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      uiRenderer.drawGameOver(true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      uiRenderer.drawGameOver(false);
    }
  };
  
  function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      gameState.particles[i].draw();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
  }
  
  function drawPlaying() {
    // Background with gradient
    for (let i = 0; i < 150; i++) {
      let inter = p.map(i, 0, 150, 0, 1);
      let c = p.lerpColor(p.color(80, 70, 60), p.color(100, 90, 80), inter);
      p.stroke(c);
      p.line(0, i, 600, i);
    }
    
    // Counter with gradient
    for (let i = 150; i < 400; i++) {
      let inter = p.map(i, 150, 400, 0, 1);
      let c = p.lerpColor(p.color(139, 119, 101), p.color(110, 90, 80), inter);
      p.stroke(c);
      p.line(0, i, 600, i);
    }
    
    // Draw HUD
    uiRenderer.drawHUD();
    
    // Draw customers
    gameState.customerQueue.forEach(customer => {
      customer.draw();
    });
    
    // Draw current wrap
    wrapRenderer.draw(gameState.currentWrap, 300, 230);
    
    // Draw ingredient bins
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    const availableIngredients = config.availableIngredients;
    wrapRenderer.drawIngredientBins(availableIngredients, -1);
    
    // Draw serve button
    uiRenderer.drawServeButton();
  }
  
  p.keyPressed = function() {
    const currentTime = p.millis();
    
    // Log input (TAP EVENT)
    p.logs.inputs.push({
      input_type: "keyPressed_TAP",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase changes (single tap actions)
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameLogic.initLevel(1);
        p.logs.game_info.push({
          event: "game_started",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          event: "game_paused",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          event: "game_resumed",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        resetGame();
      }
    } else if (p.keyCode === 16) { // SHIFT (quick pause)
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    
    // Handle gameplay inputs - TAP-BASED WITH COOLDOWN
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      
      // INGREDIENT ADDITION - Single tap with cooldown
      if (currentTime - lastIngredientTapTime >= TAP_COOLDOWN) {
        for (const [key, ingredient] of Object.entries(INGREDIENTS)) {
          if (p.keyCode === ingredient.keyCode) {
            const config = LEVEL_CONFIG[gameState.currentLevel - 1];
            if (config.availableIngredients.includes(key)) {
              gameLogic.addIngredient(key);
              lastIngredientTapTime = currentTime;
              
              // Log tap action
              p.logs.inputs.push({
                input_type: "ingredient_tap",
                data: { ingredient: key, cooldown_enforced: true },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
              break; // Only one ingredient per tap
            }
          }
        }
      }
      
      // SERVE ORDER - Single tap with cooldown
      if (p.keyCode === 32) { // SPACE
        if (currentTime - lastServeTapTime >= TAP_COOLDOWN) {
          gameLogic.serveOrder();
          lastServeTapTime = currentTime;
          
          // Log serve tap
          p.logs.inputs.push({
            input_type: "serve_tap",
            data: { cooldown_enforced: true },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  };
  
  function resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.reputation = 1.0;
    gameState.currentLevel = 1;
    gameState.customersServed = 0;
    gameState.totalCustomersThisLevel = 0;
    gameState.currentWrap = [];
    gameState.customerQueue = [];
    gameState.particles = [];
    
    // Reset tap cooldowns
    lastIngredientTapTime = 0;
    lastServeTapTime = 0;
    
    p.logs.game_info.push({
      event: "game_reset",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Expose particle creation
  window.createParticles = function(x, y, color, count = 10, type = 'normal') {
    for (let i = 0; i < count; i++) {
      gameState.particles.push(new Particle(p, x, y, color, type));
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } 
  // Removed TEST_1 and TEST_2 mode button activation
  
  gameInstance.logs.game_info.push({
    event: "control_mode_changed",
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};