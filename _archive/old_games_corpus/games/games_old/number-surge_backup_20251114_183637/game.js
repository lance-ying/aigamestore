// game.js - Main game file

import { 
  gameState, 
  getGameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT 
} from './globals.js';
import { LEVELS, getLevelData } from './levelData.js';
import { 
  Player, 
  NumberBlock, 
  ElectricSaw, 
  Ditch 
} from './entities.js';
import { checkCollisions } from './collision.js';
import { 
  initWallBreakingPhase, 
  updateWallBreaking, 
  drawWallBreaking 
} from './wallBreaking.js';
import {
  drawStartScreen,
  drawPlayingScreen,
  drawGameOverScreen,
  drawWinLevelScreen,
  drawGameWinScreen
} from './rendering.js';
import { updateTestController } from './testController.js';

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
    gameState.gamePhase = GAME_PHASES.START;
    gameState.framesSincePhaseChange = 0;
    
    // Log setup
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    gameState.framesSincePhaseChange++;
    
    // Update test controller if in test mode
    if (gameState.controlMode !== "HUMAN") {
      updateTestController(p);
    }
    
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updatePlaying(p);
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_END_WALLS) {
      updateWallBreaking(p);
      drawWallBreaking(p);
    } else if (gameState.gamePhase === GAME_PHASES.WIN_LEVEL) {
      drawWinLevelScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER) {
      drawGameOverScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_WIN) {
      drawGameWinScreen(p);
    }
  };

  function updatePlaying(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player position periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.levelProgress,
          value: gameState.player.value,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update level progress
    const scrollSpeed = gameState.scrollSpeed;
    gameState.levelProgress += scrollSpeed;
    gameState.backgroundOffset += scrollSpeed;
    
    // Update entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      entity.update(scrollSpeed);
      
      // Remove entities that are off screen
      if (entity.y > CANVAS_HEIGHT + 100) {
        gameState.entities.splice(i, 1);
      }
      
      // Remove faded out number blocks
      if (entity.constructor.name === 'NumberBlock' && 
          !entity.alive && entity.fadeOut <= 0) {
        gameState.entities.splice(i, 1);
      }
    }
    
    // Check collisions
    checkCollisions(p);
    
    // Check if level is complete
    if (gameState.levelProgress >= gameState.levelData.trackLength) {
      // Transition to wall breaking
      gameState.gamePhase = GAME_PHASES.LEVEL_END_WALLS;
      gameState.framesSincePhaseChange = 0;
      initWallBreakingPhase(p);
    }
  }

  function startLevel(levelNumber) {
    gameState.currentLevel = levelNumber;
    gameState.levelData = getLevelData(levelNumber);
    gameState.levelProgress = 0;
    gameState.backgroundOffset = 0;
    gameState.scrollSpeed = gameState.levelData.scrollSpeed;
    gameState.entities = [];
    
    // Create player
    gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100, 5);
    
    // Load level objects
    const levelData = gameState.levelData;
    
    // Create number blocks
    for (let blockData of levelData.numberBlocks) {
      const block = new NumberBlock(p, blockData.x, blockData.y, blockData.value);
      gameState.entities.push(block);
    }
    
    // Create obstacles
    for (let obstacleData of levelData.obstacles) {
      if (obstacleData.type === "saw") {
        const saw = new ElectricSaw(
          p,
          obstacleData.x,
          obstacleData.y,
          obstacleData.radius,
          obstacleData.moveSpeed,
          obstacleData.moveRange
        );
        gameState.entities.push(saw);
      } else if (obstacleData.type === "ditch") {
        const ditch = new Ditch(
          p,
          obstacleData.x,
          obstacleData.y,
          obstacleData.width,
          obstacleData.height
        );
        gameState.entities.push(ditch);
      }
    }
    
    p.logs.game_info.push({
      data: { 
        phase: "LEVEL_START", 
        level: levelNumber,
        levelName: levelData.name 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions
    if (gameState.gamePhase === GAME_PHASES.START && p.keyCode === 13) {
      // ENTER - Start game
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.framesSincePhaseChange = 0;
      gameState.score = 0;
      startLevel(1);
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING && 
               (p.keyCode === 27 || p.keyCode === 16)) {
      // ESC or SHIFT - Pause
      gameState.gamePhase = GAME_PHASES.PAUSED;
      gameState.framesSincePhaseChange = 0;
      
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED && 
               (p.keyCode === 27 || p.keyCode === 16)) {
      // ESC or SHIFT - Unpause
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.framesSincePhaseChange = 0;
      
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.WIN_LEVEL && p.keyCode === 32) {
      // SPACE - Next level
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.framesSincePhaseChange = 0;
      startLevel(gameState.currentLevel + 1);
    } else if (p.keyCode === 82) {
      // R - Restart
      gameState.gamePhase = GAME_PHASES.START;
      gameState.framesSincePhaseChange = 0;
      gameState.currentLevel = 1;
      gameState.player = null;
      gameState.entities = [];
      
      p.logs.game_info.push({
        data: { phase: "START", action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
    
    return false;
  };

  // Store for test controller
  p._onKeyPressed = p.keyPressed;
  p._keyIsDown = {};
  
  // Override keyIsDown for test mode
  const originalKeyIsDown = p.keyIsDown.bind(p);
  p.keyIsDown = function(keyCode) {
    if (gameState.controlMode !== "HUMAN" && p._keyIsDown[keyCode]) {
      return true;
    }
    return originalKeyIsDown(keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ["HUMAN", "TEST_1", "TEST_2"];
  modes.forEach(m => {
    const btn = document.getElementById(`${m === "HUMAN" ? "human" : m.toLowerCase()}ModeBtn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
  
  console.log(`Control mode set to: ${mode}`);
};