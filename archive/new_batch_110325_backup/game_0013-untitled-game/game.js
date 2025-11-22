// game.js - Main game file
import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_Z,
  FLOOR_CONFIGS
} from './globals.js';
import { Player } from './player.js';
import { UI } from './ui.js';
import { GameLogic } from './game_logic.js';
import { Background } from './environment.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let keys = {};
  let ui;
  let gameLogic;
  let background;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game components
    ui = new UI(p);
    gameLogic = new GameLogic(p, ui);
    background = new Background(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(30, 30, 40);
    
    const currentPhase = gameState.gamePhase;
    
    if (currentPhase === PHASE_START) {
      ui.drawStartScreen();
    } else if (currentPhase === PHASE_PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== CONTROL_HUMAN) {
        const actions = get_automated_testing_action(gameState);
        for (let action of actions) {
          keys[action] = true;
        }
        // Clear keys after a frame
        setTimeout(() => {
          for (let action of actions) {
            keys[action] = false;
          }
        }, 16);
      }
      
      // Render game
      const floorConfig = FLOOR_CONFIGS[gameState.currentFloor];
      background.draw(floorConfig);
      
      // Draw platforms
      for (let platform of gameLogic.getPlatforms()) {
        platform.draw();
      }
      
      // Draw ladders
      for (let ladder of gameLogic.getLadders()) {
        ladder.draw();
      }
      
      // Draw traps
      for (let trap of gameState.traps) {
        trap.draw();
      }
      
      // Draw items
      for (let item of gameState.items) {
        item.draw();
      }
      
      // Draw interactables
      for (let obj of gameState.interactables) {
        obj.draw();
      }
      
      // Update and draw player
      gameLogic.update(keys);
      
      if (gameState.player) {
        gameState.player.draw();
        
        // Log player info periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
      
      // Draw UI
      ui.drawHUD();
      
      // Draw inventory overlay
      if (gameState.showInventory) {
        ui.drawInventory();
      }
      
    } else if (currentPhase === PHASE_PAUSED) {
      // Render frozen game state
      const floorConfig = FLOOR_CONFIGS[gameState.currentFloor];
      background.draw(floorConfig);
      
      for (let platform of gameLogic.getPlatforms()) {
        platform.draw();
      }
      
      for (let ladder of gameLogic.getLadders()) {
        ladder.draw();
      }
      
      for (let trap of gameState.traps) {
        trap.draw();
      }
      
      for (let item of gameState.items) {
        item.draw();
      }
      
      for (let obj of gameState.interactables) {
        obj.draw();
      }
      
      if (gameState.player) {
        gameState.player.draw();
      }
      
      ui.drawHUD();
      
      if (gameState.showInventory) {
        ui.drawInventory();
      }
      
      // Pause overlay
      ui.drawPauseScreen();
      
    } else if (currentPhase === PHASE_GAME_OVER_WIN || currentPhase === PHASE_GAME_OVER_LOSE) {
      ui.drawGameOverScreen(currentPhase === PHASE_GAME_OVER_WIN);
    }
  };

  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      gameLogic.initializeGame();
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED, message: "Game paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING, message: "Game resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START, message: "Game restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Gameplay controls
    if (gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === KEY_SPACE) {
        gameLogic.handleInteraction();
      }
      
      if (p.keyCode === KEY_Z) {
        gameState.showInventory = !gameState.showInventory;
      }
    }
    
    return false;
  };

  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
}, document.body);

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};