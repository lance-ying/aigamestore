// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { GravityGun } from './gravityGun.js';
import { InputHandler } from './inputHandler.js';
import { createLevel, updateCamera } from './levelManager.js';
import { drawStartScreen, drawPauseOverlay, drawGameOverScreen, drawHUD, drawBackground } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let gravityGun;
  let spacePressed = false;
  let zPressed = false;
  let upPressed = false;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    inputHandler = new InputHandler(p);
    gravityGun = new GravityGun(p);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(20, 25, 40);
    
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Update
      const keys = inputHandler.update();
      
      if (gameState.player) {
        gameState.player.update(keys);
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.getScreenX(gameState.cameraX),
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
      
      // Update all entities
      for (let platform of gameState.platforms) {
        platform.update();
      }
      
      for (let obj of gameState.movableObjects) {
        obj.update();
      }
      
      for (let enemy of gameState.enemies) {
        enemy.update();
      }
      
      for (let hazard of gameState.hazards) {
        hazard.update();
      }
      
      if (gameState.exitPortal) {
        gameState.exitPortal.update();
      }
      
      // Gravity gun logic
      if (keys.space && !spacePressed) {
        spacePressed = true;
        
        if (!gameState.grabbedObject) {
          const target = gravityGun.findTarget();
          if (target) {
            gravityGun.grab(target);
          }
        }
      } else if (!keys.space && spacePressed) {
        spacePressed = false;
        
        if (gameState.grabbedObject && gameState.player) {
          // Release and throw
          const throwDir = {
            x: gameState.player.x + (gameState.player.facingRight ? 100 : -100),
            y: gameState.player.y - 50
          };
          gravityGun.release(throwDir);
        }
      }
      
      // Pull/Push toggle
      if (keys.z && !zPressed) {
        zPressed = true;
        gameState.pullMode = !gameState.pullMode;
      } else if (!keys.z) {
        zPressed = false;
      }
      
      // Update grabbed object position
      if (gameState.grabbedObject) {
        gravityGun.updateGrabbedObject();
      }
      
      // Update camera
      updateCamera();
      
      // Check health
      if (gameState.health <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, reason: "health depleted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Increase score over time
      gameState.score += 0.1;
      
      // Render
      drawBackground(p);
      
      // Draw entities (world space)
      for (let hazard of gameState.hazards) {
        hazard.draw(p, gameState.cameraX);
      }
      
      for (let platform of gameState.platforms) {
        platform.draw(p, gameState.cameraX);
      }
      
      for (let obj of gameState.movableObjects) {
        obj.draw(gameState.cameraX);
      }
      
      for (let enemy of gameState.enemies) {
        enemy.draw(gameState.cameraX);
      }
      
      if (gameState.exitPortal) {
        gameState.exitPortal.draw(gameState.cameraX);
      }
      
      if (gameState.player) {
        gameState.player.draw(gameState.cameraX);
      }
      
      gravityGun.draw(gameState.cameraX);
      
      // Draw HUD (screen space)
      drawHUD(p);
      
    } else if (gameState.gamePhase === "PAUSED") {
      // Draw last game frame
      drawBackground(p);
      
      for (let hazard of gameState.hazards) {
        hazard.draw(p, gameState.cameraX);
      }
      
      for (let platform of gameState.platforms) {
        platform.draw(p, gameState.cameraX);
      }
      
      for (let obj of gameState.movableObjects) {
        obj.draw(gameState.cameraX);
      }
      
      for (let enemy of gameState.enemies) {
        enemy.draw(gameState.cameraX);
      }
      
      if (gameState.exitPortal) {
        gameState.exitPortal.draw(gameState.cameraX);
      }
      
      if (gameState.player) {
        gameState.player.draw(gameState.cameraX);
      }
      
      gravityGun.draw(gameState.cameraX);
      drawHUD(p);
      
      drawPauseOverlay(p);
      
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p);
    }
  };

  p.keyPressed = function() {
    inputHandler.keyPressed(p.key, p.keyCode);
    
    // Game phase transitions (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN") {
      if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
          startGame();
        }
      } else if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
          gameState.gamePhase = "PAUSED";
          p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (gameState.gamePhase === "PAUSED") {
          gameState.gamePhase = "PLAYING";
          p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
          resetGame();
        }
      }
    }
    
    // Track up key for jump
    if (p.keyCode === 38) {
      upPressed = true;
    }
  };

  p.keyReleased = function() {
    inputHandler.keyReleased(p.key, p.keyCode);
    
    if (p.keyCode === 38) {
      upPressed = false;
    }
  };

  function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.health = 100;
    gameState.cameraX = 0;
    gameState.grabbedObject = null;
    gameState.gravityGunActive = false;
    gameState.pullMode = true;
    
    // Create level
    createLevel(p, gameState.level);
    
    // Create player
    gameState.player = new Player(p, 50, 200);
    gameState.entities = [gameState.player];
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame() {
    gameState.gamePhase = "START";
    gameState.player = null;
    gameState.entities = [];
    gameState.platforms = [];
    gameState.movableObjects = [];
    gameState.enemies = [];
    gameState.hazards = [];
    gameState.exitPortal = null;
    gameState.grabbedObject = null;
    gameState.gravityGunActive = false;
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "game_reset" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                   mode === 'TEST_1' ? 'test_1_ModeBtn' :
                   mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
  
  // Auto-start if in test mode and on start screen
  if (mode !== 'HUMAN' && gameState.gamePhase === 'START') {
    setTimeout(() => {
      if (gameState.gamePhase === 'START') {
        gameState.gamePhase = "PLAYING";
        gameState.score = 0;
        gameState.health = 100;
        gameState.cameraX = 0;
        gameState.grabbedObject = null;
        gameState.gravityGunActive = false;
        gameState.pullMode = true;
        
        createLevel(gameInstance, gameState.level);
        gameState.player = new Player(gameInstance, 50, 200);
        gameState.entities = [gameState.player];
      }
    }, 100);
  }
};