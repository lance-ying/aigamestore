// game.js - Main game file
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_Z,
  gameState
} from './globals.js';

import { Player } from './player.js';
import { createMemories } from './memoryFactory.js';
import { 
  drawStartScreen, drawGameUI, drawPausedOverlay, 
  drawGameOverScreen, drawTransitionEffect 
} from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game variables
  let keysPressed = new Set();
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initGame();
  };
  
  function initGame() {
    // Create memories
    gameState.memories = createMemories(p);
    gameState.memoryIndex = 0;
    gameState.currentMemory = gameState.memories[0];
    
    // Create player
    gameState.player = new Player(p, 50, CANVAS_HEIGHT - 120);
    gameState.entities = [gameState.player];
    
    // Reset game state
    gameState.score = 0;
    gameState.fragmentsCollected = 0;
    gameState.timeRemaining = 180;
    gameState.blinkCooldown = 0;
    gameState.transitionAlpha = 0;
    gameState.isTransitioning = false;
    gameState.reflectionMode = false;
    
    // Count total fragments
    gameState.totalFragmentsNeeded = 0;
    gameState.memories.forEach(memory => {
      gameState.totalFragmentsNeeded += memory.fragments.length;
    });
  }
  
  p.draw = function() {
    p.background(20, 20, 40);
    
    switch(gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame();
        renderGame();
        break;
        
      case PHASE_PAUSED:
        renderGame();
        drawPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
        break;
    }
  };
  
  function updateGame() {
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      keysPressed.clear();
      actions.forEach(keyCode => keysPressed.add(keyCode));
    }
    
    // Update time (slower when reflecting)
    const timeRate = gameState.reflectionMode ? 0.3 : 1.0;
    gameState.timeRemaining -= (1/60) * timeRate;
    
    if (gameState.timeRemaining <= 0) {
      setGamePhase(PHASE_GAME_OVER_LOSE);
      return;
    }
    
    // Update cooldowns
    if (gameState.blinkCooldown > 0) {
      gameState.blinkCooldown--;
    }
    
    // Handle player movement
    gameState.reflectionMode = keysPressed.has(KEY_Z);
    
    if (keysPressed.has(KEY_LEFT)) {
      gameState.player.moveLeft();
    }
    if (keysPressed.has(KEY_RIGHT)) {
      gameState.player.moveRight();
    }
    if (keysPressed.has(KEY_UP)) {
      gameState.player.jump();
    }
    
    // Update player
    gameState.player.update();
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Update current memory
    if (gameState.currentMemory) {
      gameState.currentMemory.update();
      
      // Check fragment collisions
      gameState.currentMemory.fragments.forEach(fragment => {
        if (fragment.checkCollision(gameState.player)) {
          fragment.collected = true;
          gameState.fragmentsCollected++;
          gameState.score += 100;
        }
      });
    }
    
    // Handle blink/interaction
    if (keysPressed.has(KEY_SPACE) && gameState.blinkCooldown === 0) {
      handleBlink();
      keysPressed.delete(KEY_SPACE); // Prevent repeated blinks
    }
    
    // Update transition effect
    if (gameState.isTransitioning) {
      gameState.transitionAlpha += 15;
      if (gameState.transitionAlpha >= 255) {
        // Switch to next memory
        gameState.memoryIndex++;
        
        if (gameState.memoryIndex >= gameState.memories.length) {
          // Check win condition
          if (gameState.fragmentsCollected >= gameState.totalFragmentsNeeded * 0.7) {
            setGamePhase(PHASE_GAME_OVER_WIN);
          } else {
            setGamePhase(PHASE_GAME_OVER_LOSE);
          }
          return;
        }
        
        gameState.currentMemory = gameState.memories[gameState.memoryIndex];
        gameState.transitionAlpha = 255;
        gameState.isTransitioning = false;
        
        // Reset player position
        gameState.player.x = 50;
        gameState.player.y = CANVAS_HEIGHT - 120;
      }
    } else if (gameState.transitionAlpha > 0) {
      gameState.transitionAlpha -= 15;
    }
  }
  
  function handleBlink() {
    gameState.player.blink();
    gameState.blinkCooldown = 30;
    
    // Check if all fragments collected in current memory
    const allCollected = gameState.currentMemory.fragments.every(f => f.collected);
    
    if (allCollected) {
      // Start transition to next memory
      gameState.isTransitioning = true;
      gameState.transitionAlpha = 0;
    }
  }
  
  function renderGame() {
    // Draw current memory
    if (gameState.currentMemory) {
      gameState.currentMemory.draw();
    }
    
    // Draw player
    gameState.player.draw();
    
    // Draw UI
    drawGameUI(p);
    
    // Draw transition effect
    if (gameState.transitionAlpha > 0) {
      drawTransitionEffect(p, gameState.transitionAlpha);
    }
  }
  
  function setGamePhase(newPhase) {
    gameState.gamePhase = newPhase;
    
    // Log phase change
    p.logs.game_info.push({
      data: { phase: newPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (newPhase === PHASE_PLAYING) {
      initGame();
    }
  }
  
  // Input handling
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      setGamePhase(PHASE_PLAYING);
      return;
    }
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        setGamePhase(PHASE_PAUSED);
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        setGamePhase(PHASE_PLAYING);
      }
      return;
    }
    
    if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        setGamePhase(PHASE_START);
      }
      return;
    }
    
    // Track gameplay keys for human control
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      keysPressed.add(p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode === "HUMAN") {
      keysPressed.delete(p.keyCode);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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