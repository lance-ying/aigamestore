// game.js - Main game logic

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { levelDefinitions } from './levels.js';
import { Target, Player } from './entities.js';
import { Camera } from './camera.js';
import { InputHandler } from './input.js';
import { Weapon } from './weapons.js';
import { renderStartScreen, renderGameOver, renderPausedIndicator, renderHUD, renderCrosshair, renderScopeOverlay } from './ui.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let camera;
  let inputHandler;
  let weapon;
  let testController;
  let currentLevel;
  let levelStartFrame;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Initialize game state
    gameState.levelDefinitions = levelDefinitions;
    gameState.player = new Player(p);
    camera = new Camera(p);
    inputHandler = new InputHandler(p);
    weapon = new Weapon(p);
    testController = new TestController(p);

    // Log initial state
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 40, 60);

    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handlePlaying();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      handlePlaying();
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, false);
    }
  };

  function handlePlaying() {
    // Initialize level if needed
    if (gameState.missionStarted && !currentLevel) {
      initializeLevel(gameState.currentLevel);
    }

    // Update game state only if not paused
    if (gameState.gamePhase === GAME_PHASES.PLAYING && currentLevel) {
      updateGameLogic();
    }

    // Render game
    renderGame();
  }

  function initializeLevel(levelNum) {
    const levelDef = levelDefinitions[levelNum - 1];
    currentLevel = levelDef;
    levelStartFrame = p.frameCount;

    gameState.entities = [];
    gameState.targetsEliminated = 0;
    gameState.targetsRequired = levelDef.targets.length;
    gameState.shotsHit = 0;
    gameState.shotsFired = 0;
    gameState.timeRemaining = levelDef.timeLimit;
    gameState.ammoInClip = levelDef.ammoClip;
    gameState.ammoReserve = levelDef.ammoReserve;
    gameState.isReloading = false;
    gameState.zoomLevel = 1;
    gameState.cameraX = 0;
    gameState.cameraY = 0;

    // Create targets
    for (let targetConfig of levelDef.targets) {
      const target = new Target(targetConfig, p);
      gameState.entities.push(target);
    }

    // Create civilians
    for (let civilianConfig of levelDef.civilians) {
      const civilian = new Target({ ...civilianConfig, type: "civilian" }, p);
      gameState.entities.push(civilian);
    }

    p.logs.game_info.push({
      data: `Level ${levelNum} started: ${levelDef.name}`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGameLogic() {
    // Update time
    const elapsedSeconds = (p.frameCount - levelStartFrame) / 60;
    gameState.timeRemaining = Math.max(0, currentLevel.timeLimit - elapsedSeconds);

    // Check time limit
    if (gameState.timeRemaining <= 0) {
      endMission(false, "Time's up!");
      return;
    }

    // Get actions from test controller or player input
    let actions = {};
    if (gameState.controlMode !== 'HUMAN') {
      actions = testController.getActions();
    } else {
      actions = {
        fire: inputHandler.keys.space,
        reload: inputHandler.keys.shift,
        zoomIn: inputHandler.keys.w,
        zoomOut: inputHandler.keys.s,
        quickScope: inputHandler.keys.z,
        panLeft: inputHandler.keys.left,
        panRight: inputHandler.keys.right,
        panUp: inputHandler.keys.up,
        panDown: inputHandler.keys.down
      };
    }

    // Handle actions
    if (actions.zoomIn && p.frameCount % 10 === 0) {
      camera.zoomIn();
    }
    if (actions.zoomOut && p.frameCount % 10 === 0) {
      camera.zoomOut();
    }
    if (actions.quickScope && p.frameCount % 20 === 0) {
      camera.toggleQuickScope();
    }

    // Camera update
    const keys = {
      left: actions.panLeft,
      right: actions.panRight,
      up: actions.panUp,
      down: actions.panDown
    };
    camera.update(keys);

    // Fire weapon
    if (actions.fire && p.frameCount % 15 === 0) {
      const result = weapon.fire(gameState.entities, gameState.cameraX, gameState.cameraY, gameState.zoomLevel);
      if (result.hit) {
        if (result.civilian) {
          endMission(false, "Civilian casualty!");
        } else {
          result.target.kill();
          gameState.targetsEliminated++;
          
          let points = 100;
          if (result.headshot) {
            points = 150;
          }
          gameState.score += points;

          // Check win condition
          const hostileTargets = gameState.entities.filter(e => e.type === "hostile");
          const aliveHostiles = hostileTargets.filter(e => e.alive).length;
          
          if (aliveHostiles === 0) {
            endMission(true);
          }
        }
      }
    }

    // Reload
    if (actions.reload) {
      weapon.reload();
    }

    // Update weapon
    weapon.update();

    // Update entities
    for (let entity of gameState.entities) {
      entity.update();
    }

    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: 300,
        screen_y: 200,
        game_x: gameState.cameraX + 300,
        game_y: gameState.cameraY + 200,
        framecount: p.frameCount
      });
    }
  }

  function endMission(won, message = "") {
    if (won) {
      // Calculate bonuses
      const timeBonus = Math.floor(gameState.timeRemaining * 5);
      const accuracy = gameState.shotsFired > 0 ? 
        (gameState.shotsHit / gameState.shotsFired) : 0;
      const accuracyBonus = Math.floor(accuracy * 100);
      
      gameState.score += timeBonus + accuracyBonus;

      // Check if there are more levels
      if (gameState.currentLevel < gameState.totalLevels) {
        gameState.currentLevel++;
        gameState.missionStarted = false;
        currentLevel = null;
        p.logs.game_info.push({
          data: `Mission complete! Moving to level ${gameState.currentLevel}`,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: "All missions complete!",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: `Mission failed: ${message}`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function renderGame() {
    // Background
    if (currentLevel) {
      const bgColor = currentLevel.bgColor;
      if (currentLevel.darkMode) {
        p.background(...bgColor);
      } else {
        p.background(...bgColor);
      }

      // Draw simple environment elements
      renderEnvironment();

      // Draw entities
      for (let entity of gameState.entities) {
        entity.render(gameState.cameraX, gameState.cameraY, gameState.zoomLevel);
      }

      // Scope overlay
      renderScopeOverlay(p, gameState.zoomLevel);

      // Crosshair
      const recoilOffset = weapon.getRecoilOffset();
      renderCrosshair(p, recoilOffset);

      // HUD
      renderHUD(p);

      // Dark overlay for night levels
      if (currentLevel.darkMode) {
        p.push();
        p.noStroke();
        p.fill(0, 0, 0, 150);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Spotlight effect around crosshair
        const gradient = p.drawingContext.createRadialGradient(300, 200, 50, 300, 200, 150);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        p.drawingContext.fillStyle = gradient;
        p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.pop();
      }
    }
  }

  function renderEnvironment() {
    // Draw simple buildings/environment
    p.push();
    p.noStroke();
    
    const zoom = gameState.zoomLevel;
    const camX = gameState.cameraX;
    const camY = gameState.cameraY;

    // Buildings
    for (let i = 0; i < 5; i++) {
      const x = (100 + i * 100 - camX) * zoom + 300;
      const y = (250 - camY) * zoom + 200;
      const w = 80 * zoom;
      const h = 150 * zoom;
      
      p.fill(80, 80, 100);
      p.rect(x - w/2, y - h, w, h);
      
      // Windows
      p.fill(200, 200, 150);
      for (let j = 0; j < 3; j++) {
        for (let k = 0; k < 3; k++) {
          p.rect(x - w/2 + 15 + k * 20, y - h + 20 + j * 40, 10, 15);
        }
      }
    }

    // Ground
    p.fill(60, 80, 60);
    p.rect(0, (250 - camY) * zoom + 200, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.pop();
  }

  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.keyCode, p.key);
  };

  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.keyCode);
  };

  // Control mode setter
  window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    testController.setMode(mode);
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (mode === 'HUMAN') {
      document.getElementById('humanModeBtn').classList.add('active');
    } else if (mode === 'TEST_1') {
      document.getElementById('test_1_ModeBtn').classList.add('active');
    } else if (mode === 'TEST_2') {
      document.getElementById('test_2_ModeBtn').classList.add('active');
    }
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;