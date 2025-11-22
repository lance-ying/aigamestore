// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  JELLY_HEIGHTS,
  getGameState 
} from './globals.js';

import { Player, Obstacle, Diamond } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { updateAutomation } from './automation.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0; // No gravity for this game
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup collision handling
    setupCollisionHandling();
    
    // Create ground (visual only)
    const groundY = CANVAS_HEIGHT - 20;
    gameState.ground = Bodies.rectangle(
      CANVAS_WIDTH / 2, groundY + 10,
      CANVAS_WIDTH * 10, 20,
      { label: 'ground', isStatic: true }
    );
    World.add(gameState.world, gameState.ground);
  };
  
  p.draw = function() {
    // Update physics
    Engine.update(gameState.engine, 1000 / 60);
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      startGame(p);
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 87 || p.keyCode === 38) { // W or UP
        gameState.keys.up = true;
        if (gameState.player) {
          gameState.player.setHeight("TALL");
        }
      }
      if (p.keyCode === 83 || p.keyCode === 40) { // S or DOWN
        gameState.keys.down = true;
        if (gameState.player) {
          gameState.player.setHeight("FLAT");
        }
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 87 || p.keyCode === 38) { // W or UP
        gameState.keys.up = false;
        if (!gameState.keys.down && gameState.player) {
          gameState.player.setHeight("MEDIUM");
        }
      }
      if (p.keyCode === 83 || p.keyCode === 40) { // S or DOWN
        gameState.keys.down = false;
        if (!gameState.keys.up && gameState.player) {
          gameState.player.setHeight("MEDIUM");
        }
      }
    }
    
    return false;
  };
});

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Create player
  gameState.player = new Player(p, 150, CANVAS_HEIGHT - 100);
  gameState.entities = [gameState.player];
  
  // Reset game variables
  gameState.score = 0;
  gameState.consecutivePasses = 0;
  gameState.jellyFeverActive = false;
  gameState.jellyFeverTimer = 0;
  gameState.obstacleTimer = 0;
  gameState.cameraX = 0;
  gameState.distanceTraveled = 0;
  gameState.currentSpeed = gameState.baseSpeed;
  gameState.obstacles = [];
  gameState.diamonds = [];
}

function updateGame(p) {
  if (!gameState.player) return;
  
  // Update automation
  updateAutomation(p);
  
  // Update Jelly Fever
  if (gameState.jellyFeverActive) {
    gameState.jellyFeverTimer--;
    if (gameState.jellyFeverTimer <= 0) {
      gameState.jellyFeverActive = false;
      gameState.currentSpeed = gameState.baseSpeed;
    }
  }
  
  // Update camera (scroll world)
  gameState.cameraX += gameState.currentSpeed;
  gameState.distanceTraveled += gameState.currentSpeed;
  
  // Update player
  gameState.player.update();
  
  // Spawn obstacles
  gameState.obstacleTimer++;
  if (gameState.obstacleTimer >= gameState.obstacleInterval) {
    gameState.obstacleTimer = 0;
    spawnObstacle(p);
    
    // Occasionally spawn diamond
    if (p.random() < 0.4) {
      spawnDiamond(p);
    }
    
    // Increase difficulty
    if (gameState.obstacleInterval > 60) {
      gameState.obstacleInterval -= 0.5;
    }
  }
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obs = gameState.obstacles[i];
    obs.update();
    
    // Remove off-screen obstacles
    if (obs.x < gameState.cameraX - 100) {
      obs.destroy();
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Update diamonds
  for (let i = gameState.diamonds.length - 1; i >= 0; i--) {
    const diamond = gameState.diamonds[i];
    diamond.update();
    
    // Remove collected or off-screen diamonds
    if (diamond.collected || diamond.x < gameState.cameraX - 100) {
      diamond.destroy();
      gameState.diamonds.splice(i, 1);
    }
  }
  
  // Check win condition (survive long enough)
  if (gameState.distanceTraveled > 5000) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function spawnObstacle(p) {
  const gapTypes = ["TOP", "MIDDLE", "BOTTOM"];
  const gapType = p.random(gapTypes);
  const x = gameState.cameraX + CANVAS_WIDTH + 50;
  
  const obstacle = new Obstacle(p, x, gapType);
  gameState.obstacles.push(obstacle);
}

function spawnDiamond(p) {
  const x = gameState.cameraX + CANVAS_WIDTH + 50;
  const y = p.random(60, CANVAS_HEIGHT - 60);
  
  const diamond = new Diamond(p, x, y);
  gameState.diamonds.push(diamond);
}

function renderGame(p) {
  // Sky background with parallax
  const skyOffset = (gameState.cameraX * 0.3) % CANVAS_WIDTH;
  p.background(135, 206, 235);
  
  // Draw clouds (parallax background)
  p.fill(255, 255, 255, 150);
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const cloudX = (i * 200 - skyOffset) % (CANVAS_WIDTH + 200);
    p.ellipse(cloudX, 50 + i * 20, 80, 40);
    p.ellipse(cloudX + 40, 50 + i * 20, 60, 30);
  }
  
  // Draw ground
  p.fill(100, 200, 100);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
  
  // Draw track pattern on ground
  p.stroke(80, 160, 80);
  p.strokeWeight(2);
  for (let i = 0; i < 10; i++) {
    const lineX = (i * 60 - (gameState.cameraX % 60)) % CANVAS_WIDTH;
    p.line(lineX, CANVAS_HEIGHT - 20, lineX, CANVAS_HEIGHT);
  }
  
  // Draw obstacles
  for (let obs of gameState.obstacles) {
    obs.render();
  }
  
  // Draw diamonds
  for (let diamond of gameState.diamonds) {
    diamond.render();
  }
  
  // Draw player
  if (gameState.player) {
    gameState.player.render();
  }
  
  // Draw UI
  drawUI(p);
}

function drawUI(p) {
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Diamonds
  p.fill(255, 255, 100);
  p.text(`💎 ${gameState.diamondCount}`, 10, 30);
  
  // Distance
  p.fill(255);
  const distance = Math.floor(gameState.distanceTraveled / 10);
  p.text(`Distance: ${distance}m`, 10, 50);
  
  // Consecutive passes
  if (gameState.consecutivePasses > 0) {
    p.fill(100, 255, 100);
    p.text(`Streak: ${gameState.consecutivePasses}`, 10, 70);
  }
  
  // Jelly Fever indicator
  if (gameState.jellyFeverActive) {
    p.push();
    p.fill(255, 200, 100);
    p.textSize(24);
    p.textAlign(p.CENTER, p.TOP);
    const pulse = p.sin(p.frameCount * 0.3) * 5;
    p.text("JELLY FEVER!", CANVAS_WIDTH / 2, 10 + pulse);
    
    // Timer bar
    const barWidth = 200;
    const barHeight = 10;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 40;
    
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    p.noStroke();
    p.fill(255, 200, 100);
    const fillWidth = (gameState.jellyFeverTimer / 300) * barWidth;
    p.rect(barX, barY, fillWidth, barHeight);
    
    p.pop();
  }
  
  // Height indicator
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(255);
  p.text("Height:", CANVAS_WIDTH - 70, 10);
  
  const indicatorX = CANVAS_WIDTH - 40;
  const indicatorY = 30;
  const indicatorSize = 50;
  
  // Draw height states
  const states = ["TALL", "MEDIUM", "FLAT"];
  const heights = [JELLY_HEIGHTS.TALL, JELLY_HEIGHTS.MEDIUM, JELLY_HEIGHTS.FLAT];
  
  for (let i = 0; i < 3; i++) {
    const y = indicatorY + i * 20;
    const h = heights[i] * 0.2;
    
    if (gameState.player && gameState.player.heightState === states[i]) {
      p.fill(100, 200, 255);
    } else {
      p.fill(100, 100, 100, 100);
    }
    p.noStroke();
    p.rect(indicatorX - 15, y - h / 2, 30, h, 2);
  }
  
  p.pop();
}

function renderStartScreen(p) {
  p.background(30, 30, 60);
  
  // Animated background
  for (let i = 0; i < 20; i++) {
    const x = (i * 50 + p.frameCount * 2) % (CANVAS_WIDTH + 100);
    const y = 50 + i * 20;
    p.fill(100, 150, 255, 50);
    p.noStroke();
    p.ellipse(x, y, 30, 30);
  }
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  const titlePulse = p.sin(p.frameCount * 0.05) * 5;
  p.text("JELLY SHIFT", CANVAS_WIDTH / 2, 80 + titlePulse);
  
  // Description
  p.textSize(14);
  p.fill(200, 200, 255);
  p.text("Navigate through obstacles by shifting", CANVAS_WIDTH / 2, 140);
  p.text("your jelly's height!", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text("Controls:", CANVAS_WIDTH / 2, 200);
  
  p.textSize(12);
  p.fill(255);
  p.text("W / UP ARROW - Shift to TALL", CANVAS_WIDTH / 2, 225);
  p.text("S / DOWN ARROW - Shift to FLAT", CANVAS_WIDTH / 2, 245);
  p.text("Release keys for MEDIUM height", CANVAS_WIDTH / 2, 265);
  
  p.textSize(14);
  p.fill(100, 255, 100);
  p.text("Pass 3 obstacles in a row for JELLY FEVER!", CANVAS_WIDTH / 2, 295);
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 255, 150 + p.sin(p.frameCount * 0.1) * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  p.text(`Diamonds: ${gameState.diamondCount}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.textSize(18);
  const distance = Math.floor(gameState.distanceTraveled / 10);
  p.text(`Distance: ${distance}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.textSize(16);
  p.fill(255, 255, 255, 150 + p.sin(p.frameCount * 0.1) * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

function resetGame(p) {
  // Clear entities
  if (gameState.player && gameState.player.body) {
    World.remove(gameState.world, gameState.player.body);
  }
  
  for (let obs of gameState.obstacles) {
    obs.destroy();
  }
  
  for (let diamond of gameState.diamonds) {
    diamond.destroy();
  }
  
  gameState.player = null;
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.diamonds = [];
  gameState.score = 0;
  gameState.consecutivePasses = 0;
  gameState.jellyFeverActive = false;
  gameState.jellyFeverTimer = 0;
  gameState.obstacleTimer = 0;
  gameState.cameraX = 0;
  gameState.distanceTraveled = 0;
  gameState.currentSpeed = gameState.baseSpeed;
  gameState.obstacleInterval = 120;
  gameState.keys = { up: false, down: false };
  
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

window.gameInstance = gameInstance;