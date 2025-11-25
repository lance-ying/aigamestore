// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, resetGameState } from './globals.js';
import { Player, Enemy } from './entities.js';
import { generateRoom } from './terrain.js';
import { CellularGrid } from './cellular_automata.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { keys, handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Initialize cellular automata grid
    gameState.cellularGrid = new CellularGrid(CANVAS_WIDTH, CANVAS_HEIGHT * 3);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
  };
  
  function updateGame(p) {
    gameState.framesSinceStart++;
    
    // Automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(action);
    }
    
    // Initialize player if needed
    if (!gameState.player) {
      gameState.player = new Player(300, 50);
      gameState.entities.push(gameState.player);
      
      // Generate initial rooms
      for (let i = 0; i < gameState.totalRooms; i++) {
        const room = generateRoom(i, p);
        gameState.terrain.push(...room.terrain);
        gameState.entities.push(...room.entities);
      }
    }
    
    // Handle player actions
    if (gameState.player) {
      gameState.player.update(p, keys);
      
      // Cast spells
      if (keys.space && gameState.spellsCollected.length > 0) {
        const currentSpell = gameState.spellsCollected[gameState.currentSpellIndex];
        gameState.player.castSpell(p, currentSpell);
        keys.space = false; // Prevent holding
      }
      
      // Switch spells
      if (keys.z) {
        if (gameState.spellsCollected.length > 1) {
          gameState.currentSpellIndex = (gameState.currentSpellIndex + 1) % gameState.spellsCollected.length;
        }
        keys.z = false; // Prevent holding
      }
      
      // Log player info
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity instanceof Enemy) {
        entity.update(p);
        if (!entity.alive) {
          gameState.entities.splice(i, 1);
        }
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update(p);
      if (!gameState.projectiles[i].alive) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].lifetime <= 0) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update pickups
    for (let i = gameState.pickups.length - 1; i >= 0; i--) {
      gameState.pickups[i].update(p);
      if (!gameState.pickups[i].alive) {
        gameState.pickups.splice(i, 1);
      }
    }
    
    // Update cellular automata (limited to visible area)
    if (gameState.cellularGrid && p.frameCount % 2 === 0) {
      gameState.cellularGrid.update();
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode, p.key);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode, p.key);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};