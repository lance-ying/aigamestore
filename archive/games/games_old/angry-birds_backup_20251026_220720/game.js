// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Bird } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { createLevel, resetLevel, nextLevel } from './level.js';
import { renderStartScreen, renderGameUI, renderSlingshot, renderAimingGuide, renderPausedOverlay, renderGameOver } from './ui.js';
import { updateTestAutomation } from './automation.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.6;
    world.gravity.x = 0;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup collision handling
    setupCollisionHandling(engine, p);
    
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
    
    // Create level (but don't start yet)
    createLevel(p);
  };
  
  p.draw = function() {
    // Update physics (unless paused)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle different game phases
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
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
      return false;
    }
    
    // Next level on ENTER after win (if not last level)
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      if (gameState.currentLevel < gameState.totalLevels) {
        const hasNext = nextLevel(p);
        if (hasNext) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          createNewBird(p);
          p.logs.game_info.push({
            data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      return false;
    }
    
    if (p.keyCode === 27) {
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
      return false;
    }
    
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
        return false;
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === CONTROL_MODES.HUMAN) {
      handleGameplayInput(p);
    }
    
    return false;
  };
  
  function startGame(p) {
    resetLevel(p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.gems = 0;
    
    // Create first bird
    createNewBird(p);
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function restartGame(p) {
    resetLevel(p);
    gameState.gamePhase = GAME_PHASES.START;
    gameState.testFrameCount = 0;
    gameState.testState = "init";
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function createNewBird(p) {
    const base = gameState.slingshotBase;
    
    // Get next bird type from queue
    let birdType = "RED"; // Default fallback
    if (gameState.birdQueue.length > 0) {
      birdType = gameState.birdQueue.shift();
    }
    
    const bird = new Bird(p, base.x, base.y - 30, birdType);
    gameState.currentBird = bird;
    gameState.isAiming = true;
    gameState.birdInFlight = false;
    gameState.abilityUsed = false;
  }
  
  function handleGameplayInput(p) {
    // Aiming controls
    if (gameState.isAiming) {
      if (p.keyCode === 37) { // Left arrow
        gameState.slingshotAngle = Math.max(-90, gameState.slingshotAngle - 2);
      }
      if (p.keyCode === 39) { // Right arrow
        gameState.slingshotAngle = Math.min(0, gameState.slingshotAngle + 2);
      }
      if (p.keyCode === 38) { // Up arrow
        gameState.slingshotPower = Math.min(100, gameState.slingshotPower + 2);
      }
      if (p.keyCode === 40) { // Down arrow
        gameState.slingshotPower = Math.max(10, gameState.slingshotPower - 2);
      }
      
      // Launch bird
      if (p.keyCode === 32) { // Space
        launchBird(p);
      }
    } else if (gameState.birdInFlight) {
      // Activate ability mid-flight
      if (p.keyCode === 32 && !gameState.abilityUsed) {
        gameState.currentBird.activateAbility();
        gameState.abilityUsed = true;
      }
    }
  }
  
  function launchBird(p) {
    if (!gameState.currentBird) return;
    
    const angleRad = (gameState.slingshotAngle * Math.PI) / 180;
    const power = gameState.slingshotPower;
    const vx = Math.cos(angleRad) * power * 0.15;
    const vy = Math.sin(angleRad) * power * 0.15;
    
    Body.setVelocity(gameState.currentBird.body, { x: vx, y: vy });
    
    gameState.isAiming = false;
    gameState.birdInFlight = true;
    gameState.birdsRemaining--;
    
    p.logs.player_info.push({
      screen_x: gameState.currentBird.body.position.x,
      screen_y: gameState.currentBird.body.position.y,
      game_x: gameState.currentBird.body.position.x,
      game_y: gameState.currentBird.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Run test automation if needed
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
      updateTestAutomation(p);
    }
    
    // Keep bird at slingshot position while aiming
    if (gameState.isAiming && gameState.currentBird) {
      const base = gameState.slingshotBase;
      Body.setPosition(gameState.currentBird.body, { x: base.x, y: base.y - 30 });
      Body.setVelocity(gameState.currentBird.body, { x: 0, y: 0 });
      Body.setAngularVelocity(gameState.currentBird.body, 0);
    }
    
    // Update entities
    for (let pig of gameState.pigs) {
      pig.update();
    }
    
    for (let structure of gameState.structures) {
      structure.update();
    }
    
    // Update current bird
    if (gameState.currentBird && gameState.birdInFlight) {
      const shouldReset = gameState.currentBird.update();
      
      // Check if bird has stopped moving (at rest)
      const speed = Math.sqrt(
        gameState.currentBird.body.velocity.x ** 2 +
        gameState.currentBird.body.velocity.y ** 2
      );
      
      if (shouldReset || speed < 0.5) {
        setTimeout(() => {
          handleBirdLanded(p);
        }, 1000);
        gameState.birdInFlight = false;
      }
    }
    
    // Check win condition
    const allPigsDead = gameState.pigs.every(pig => !pig.alive);
    if (allPigsDead && !gameState.levelComplete) {
      gameState.levelComplete = true;
      setTimeout(() => {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.GAME_OVER_WIN },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }, 2000);
    }
  }
  
  function handleBirdLanded(p) {
    if (gameState.levelComplete) return;
    
    // Check if more birds available
    if (gameState.birdsRemaining > 0) {
      createNewBird(p);
    } else {
      // Check lose condition
      const anyPigsAlive = gameState.pigs.some(pig => pig.alive);
      if (anyPigsAlive) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function renderGame(p) {
    // Sky background
    p.background(135, 206, 235);
    
    // Draw clouds
    for (let i = 0; i < 5; i++) {
      p.fill(255, 255, 255, 150);
      p.noStroke();
      const cloudX = ((p.frameCount * 0.2 + i * 150) % (CANVAS_WIDTH + 200)) - 100;
      p.ellipse(cloudX, 50 + i * 20, 60, 30);
      p.ellipse(cloudX + 20, 50 + i * 20, 50, 25);
      p.ellipse(cloudX - 20, 50 + i * 20, 50, 25);
    }
    
    // Ground
    p.fill(100, 200, 100);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    
    // Grass details
    p.stroke(80, 160, 80);
    p.strokeWeight(2);
    for (let i = 0; i < CANVAS_WIDTH; i += 10) {
      p.line(i, CANVAS_HEIGHT - 20, i + 3, CANVAS_HEIGHT - 25);
    }
    
    // Render slingshot
    renderSlingshot(p);
    
    // Render structures
    for (let structure of gameState.structures) {
      if (!structure.destroyed) {
        structure.render();
      }
    }
    
    // Render pigs
    for (let pig of gameState.pigs) {
      if (pig.alive) {
        pig.render();
      }
    }
    
    // Render current bird
    if (gameState.currentBird) {
      gameState.currentBird.render();
    }
    
    // Render aiming guide
    if (gameState.isAiming) {
      renderAimingGuide(p);
    }
    
    // Render UI
    renderGameUI(p);
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    gameState.testFrameCount = 0;
    gameState.testState = "init";
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonId = mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
    const button = document.getElementById(buttonId);
    if (button) button.classList.add('active');
  }
};