// game.js - Main game loop and p5.js setup

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, FARM_WIDTH, FARM_HEIGHT, MAX_ENERGY, DAY_LENGTH, EVENING_START, NIGHT_START } from './globals.js';
import { Player, FarmTile, Farmhouse } from './entities.js';
import { setupInput, handleInput } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Initialize farm tiles
    initializeFarm();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup input handlers
    setupInput(p);
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Background - exactly once
    p.background(20, 20, 30);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action) {
            simulateKeyPress(p, action.keyCode);
          }
        }
        
        // Handle input
        handleInput(p);
        
        // Update game
        updateGame(p);
        
        // Render game
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
});

function initializeFarm() {
  gameState.tiles = [];
  
  for (let y = 0; y < FARM_HEIGHT; y++) {
    gameState.tiles[y] = [];
    for (let x = 0; x < FARM_WIDTH; x++) {
      gameState.tiles[y][x] = new FarmTile(x, y);
    }
  }
  
  // Create farmhouse
  gameState.farmhouse = new Farmhouse(20, 20);
  
  // Create player
  if (!gameState.player) {
    gameState.player = new Player(50, 100);
  }
}

function updateGame(p) {
  // Update time of day
  gameState.timeOfDay++;
  
  // Check for day end
  if (gameState.timeOfDay >= DAY_LENGTH) {
    endDay();
  }
  
  // Regenerate energy slowly during the day
  if (gameState.timeOfDay < NIGHT_START && gameState.energy < MAX_ENERGY) {
    gameState.energy = Math.min(MAX_ENERGY, gameState.energy + 0.05);
  }
  
  // Check if player is in farmhouse and standing still to sleep
  if (gameState.farmhouse && gameState.farmhouse.isPlayerInside() && gameState.timeOfDay > EVENING_START) {
    const player = gameState.player;
    if (player && Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1) {
      gameState.sleepTimer = (gameState.sleepTimer || 0) + 1;
      if (gameState.sleepTimer > 60) { // 1 second of standing still
        endDay();
      }
    } else {
      gameState.sleepTimer = 0;
    }
  }
  
  // Update message timer
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
  
  // Update entities
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update tiles
  gameState.tiles.forEach(row => {
    row.forEach(tile => tile.update());
  });
  
  // Update crops
  gameState.crops.forEach(crop => crop.update(p));
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check win condition (high level or lots of gold)
  if (gameState.farmingLevel >= 5 || gameState.gold >= 1000) {
    gameState.gamePhase = "GAME_OVER_WIN";
    if (gameInstance.logs) {
      gameInstance.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", reason: "High level or gold achieved" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function endDay() {
  gameState.dayCount++;
  gameState.timeOfDay = 0;
  gameState.energy = MAX_ENERGY;
  gameState.sleepTimer = 0;
  
  // Show day complete message
  if (gameState.player) {
    gameState.player.setMessage(`Day ${gameState.dayCount - 1} Complete! Good morning!`);
  }
  
  // Log day change
  if (gameInstance.logs) {
    gameInstance.logs.game_info.push({
      data: { event: "new_day", dayCount: gameState.dayCount },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function renderGame(p) {
  // Render sky based on time of day
  renderSky(p);
  
  // Render farmhouse
  if (gameState.farmhouse) {
    gameState.farmhouse.render(p);
  }
  
  // Render farm tiles
  gameState.tiles.forEach(row => {
    row.forEach(tile => tile.render(p));
  });
  
  // Render crops
  gameState.crops.forEach(crop => crop.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  gameState.particles.forEach(particle => particle.render(p));
}

function renderSky(p) {
  let topColor, bottomColor;
  
  if (gameState.timeOfDay < EVENING_START) {
    // Day
    topColor = p.color(135, 206, 235);
    bottomColor = p.color(176, 224, 230);
  } else if (gameState.timeOfDay < NIGHT_START) {
    // Evening
    topColor = p.color(255, 140, 100);
    bottomColor = p.color(255, 180, 140);
  } else {
    // Night
    topColor = p.color(25, 25, 60);
    bottomColor = p.color(40, 40, 80);
  }
  
  // Draw gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(topColor, bottomColor, inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Draw sun/moon
  if (gameState.timeOfDay < NIGHT_START) {
    // Sun
    const sunProgress = gameState.timeOfDay / NIGHT_START;
    const sunY = 50 + sunProgress * 100;
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(CANVAS_WIDTH - 80, sunY, 40);
    
    // Sun rays
    p.stroke(255, 255, 150, 100);
    p.strokeWeight(2);
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + gameState.frameCount * 0.01;
      const x1 = CANVAS_WIDTH - 80 + Math.cos(angle) * 25;
      const y1 = sunY + Math.sin(angle) * 25;
      const x2 = CANVAS_WIDTH - 80 + Math.cos(angle) * 35;
      const y2 = sunY + Math.sin(angle) * 35;
      p.line(x1, y1, x2, y2);
    }
  } else {
    // Moon
    p.fill(240, 240, 255);
    p.noStroke();
    p.circle(CANVAS_WIDTH - 80, 60, 30);
    
    // Moon craters
    p.fill(220, 220, 240);
    p.circle(CANVAS_WIDTH - 85, 55, 8);
    p.circle(CANVAS_WIDTH - 75, 65, 6);
    
    // Stars
    p.fill(255, 255, 255);
    for (let i = 0; i < 20; i++) {
      const x = (i * 127 + 50) % CANVAS_WIDTH;
      const y = (i * 213 + 30) % 150;
      const twinkle = Math.sin(gameState.frameCount * 0.05 + i) * 0.5 + 0.5;
      p.circle(x, y, 2 * twinkle);
    }
  }
}

let simulatedKeys = {};

function simulateKeyPress(p, keyCode) {
  if (!simulatedKeys[keyCode]) {
    simulatedKeys[keyCode] = true;
    
    // Simulate keyPressed event
    const oldKeyCode = p.keyCode;
    p.keyCode = keyCode;
    
    // Call the key handler
    if (p._onkeydown) {
      p._onkeydown({ keyCode: keyCode });
    }
    
    p.keyCode = oldKeyCode;
    
    // Schedule key release
    setTimeout(() => {
      simulatedKeys[keyCode] = false;
      p.keyCode = keyCode;
      if (p._onkeyup) {
        p._onkeyup({ keyCode: keyCode });
      }
    }, 100);
  }
}

// Expose game instance
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  Object.keys(buttons).forEach(key => {
    if (buttons[key]) {
      if (key === mode) {
        buttons[key].classList.add('active');
      } else {
        buttons[key].classList.remove('active');
      }
    }
  });
  
  // Log mode change
  if (gameInstance.logs) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};