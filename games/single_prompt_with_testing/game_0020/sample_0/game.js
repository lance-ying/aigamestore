// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { generateLevel } from './levels.js';
import { renderBackground, renderStartScreen, renderPauseOverlay, renderGameOverScreen, renderUI, renderLevelTransition } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelData = null;
  let transitionTimer = 0;
  let showTransition = false;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(20, 20, 25);
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      if (showTransition) {
        renderLevelTransition(p, gameState.level);
        transitionTimer--;
        if (transitionTimer <= 0) {
          showTransition = false;
        }
        return;
      }
      
      updateGame();
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame();
      renderUI(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGame();
      renderGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
    }
  };

  function updateGame() {
    gameState.timeInLevel++;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      gameState.keys = {
        left: action.left || false,
        right: action.right || false,
        up: action.up || false,
        down: action.down || false,
        space: action.space || false,
        shift: action.shift || false,
        z: action.z || false
      };
    }
    
    // Update player
    if (gameState.player && gameState.player.alive) {
      const prevX = gameState.player.x;
      const prevY = gameState.player.y;
      
      gameState.player.update(gameState.keys, gameState.obstacles, gameState.interactables);
      
      // Log player position changes
      if (prevX !== gameState.player.x || prevY !== gameState.player.y) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Update camera to follow player
      updateCamera();
    }
    
    // Update interactable objects
    for (let obj of gameState.interactables) {
      if (obj.type === 'box') {
        obj.update(gameState.obstacles);
      } else if (obj.type === 'door') {
        obj.update();
      } else if (obj.type === 'switch' && gameState.keys.z && obj.checkPlayerNear(gameState.player)) {
        if (!obj.activated) {
          obj.activate();
          // Open corresponding door
          for (let door of gameState.interactables) {
            if (door.type === 'door' && door.switchId === obj.id) {
              door.setOpen(true);
            }
          }
        }
      }
    }
    
    // Update exit portal
    if (levelData.exitPortal) {
      levelData.exitPortal.update();
      
      // Check if player reached exit
      if (levelData.exitPortal.checkCollision(gameState.player)) {
        gameState.score += 1000;
        nextLevel();
      }
    }
    
    // Update and check hazards
    for (let hazard of gameState.hazards) {
      if (hazard.type === 'surveillance') {
        if (hazard.update(gameState.player)) {
          gameState.deathReason = "Detected by surveillance";
          gameOver(false);
        }
      } else if (hazard.checkCollision(gameState.player)) {
        if (hazard.type === 'spike') {
          gameState.deathReason = "Impaled on spikes";
        } else if (hazard.type === 'pit') {
          gameState.deathReason = "Fell into darkness";
        }
        gameOver(false);
      }
    }
    
    // Add obstacles as collidable entities for exit portal
    const allObstacles = [...gameState.obstacles];
    for (let door of gameState.interactables) {
      if (door.type === 'door' && door.isBlocking && door.isBlocking()) {
        allObstacles.push(door);
      }
    }
    gameState.obstacles = allObstacles.filter(o => o.type === 'platform' || o.type === 'door');
  }

  function updateCamera() {
    const player = gameState.player;
    const targetX = player.x - CANVAS_WIDTH / 2;
    gameState.cameraX = p.constrain(targetX, 0, levelData.levelWidth - CANVAS_WIDTH);
  }

  function renderGame() {
    renderBackground(p, gameState.cameraX);
    
    // Render all entities
    for (let obs of gameState.obstacles) {
      obs.render(p, gameState.cameraX);
    }
    
    for (let hazard of gameState.hazards) {
      hazard.render(p, gameState.cameraX);
    }
    
    for (let obj of gameState.interactables) {
      obj.render(p, gameState.cameraX);
    }
    
    if (levelData.exitPortal) {
      levelData.exitPortal.render(p, gameState.cameraX);
    }
    
    if (gameState.player && gameState.player.alive) {
      gameState.player.render(p, gameState.cameraX);
    }
  }

  function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.level = 1;
    gameState.score = 0;
    gameState.timeInLevel = 0;
    initLevel(1);
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function initLevel(levelNum) {
    gameState.levelComplete = false;
    gameState.timeInLevel = 0;
    gameState.cameraX = 0;
    
    levelData = generateLevel(levelNum);
    
    gameState.obstacles = levelData.obstacles;
    gameState.interactables = levelData.interactables;
    gameState.hazards = levelData.hazards;
    
    // Create player
    gameState.player = new Player(50, CANVAS_HEIGHT - 100);
    
    // Populate entities array
    gameState.entities = [
      gameState.player,
      ...gameState.obstacles,
      ...gameState.interactables,
      ...gameState.hazards
    ];
    
    if (levelData.exitPortal) {
      gameState.entities.push(levelData.exitPortal);
    }
    
    showTransition = true;
    transitionTimer = 60;
  }

  function nextLevel() {
    if (gameState.level < gameState.maxLevel) {
      gameState.level++;
      gameState.score += 500;
      initLevel(gameState.level);
      
      p.logs.game_info.push({
        data: { event: "level_complete", level: gameState.level - 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameOver(true);
    }
  }

  function gameOver(win) {
    gameState.gamePhase = win ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    
    if (win) {
      gameState.score += 2000;
    }
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, win: win, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame() {
    gameState.gamePhase = "START";
    gameState.level = 1;
    gameState.score = 0;
    gameState.player = null;
    gameState.entities = [];
    gameState.obstacles = [];
    gameState.interactables = [];
    gameState.hazards = [];
    gameState.cameraX = 0;
    gameState.levelComplete = false;
    gameState.deathReason = "";
    gameState.timeInLevel = 0;
    gameState.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      shift: false,
      z: false
    };
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
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
    
    // Game controls (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === "PLAYING") {
      if (p.keyCode === 37) gameState.keys.left = true;
      if (p.keyCode === 39) gameState.keys.right = true;
      if (p.keyCode === 38) gameState.keys.up = true;
      if (p.keyCode === 40) gameState.keys.down = true;
      if (p.keyCode === 32) gameState.keys.space = true;
      if (p.keyCode === 16) gameState.keys.shift = true;
      if (p.keyCode === 90) gameState.keys.z = true;
    }
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode === "HUMAN") {
      if (p.keyCode === 37) gameState.keys.left = false;
      if (p.keyCode === 39) gameState.keys.right = false;
      if (p.keyCode === 38) gameState.keys.up = false;
      if (p.keyCode === 40) gameState.keys.down = false;
      if (p.keyCode === 32) gameState.keys.space = false;
      if (p.keyCode === 16) gameState.keys.shift = false;
      if (p.keyCode === 90) gameState.keys.z = false;
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;