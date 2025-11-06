// game.js - Main game loop
import { 
  gameState, 
  resetGameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT 
} from './globals.js';
import { generateRandomTile } from './tiles.js';
import { spawnEnemy, updateEnemies } from './enemies.js';
import { updateTowers } from './towers.js';
import { 
  renderStartScreen, 
  renderGameplay, 
  renderPauseScreen, 
  renderGameOverScreen 
} from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    resetGameState();
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    p.logs.game_info.push({
      data: { phase: 'START', event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      updateGame(p);
      renderGameplay(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      renderPauseScreen(p);
    } else if (gameState.gamePhase.startsWith('GAME_OVER')) {
      renderGameOverScreen(p);
    }
    
    // Automated testing
    if (gameState.controlMode !== 'HUMAN' && 
        gameState.gamePhase === 'PLAYING') {
      const action = get_automated_testing_action(gameState);
      processAutomatedInput(p, action);
    }
  };
  
  p.keyPressed = function() {
    if (p.keyCode === 13 || p.keyCode === 27 || p.keyCode === 82) {
      handleKeyPressed(p, p.key, p.keyCode);
      return false;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };
});

function updateGame(p) {
  // Generate coins from gardens
  gameState.framesSinceLastCoin++;
  if (gameState.framesSinceLastCoin >= 60) {
    gameState.framesSinceLastCoin = 0;
    let gardenCount = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (gameState.grid[y][x].type === 'GARDEN') {
          gardenCount++;
        }
      }
    }
    gameState.coins += gardenCount;
    gameState.coinsPerSecond = gardenCount;
  }
  
  // Wave spawning
  if (gameState.waveInProgress) {
    if (gameState.enemiesSpawned < gameState.enemiesToSpawn) {
      gameState.spawnTimer++;
      if (gameState.spawnTimer >= 90) {
        spawnEnemy(gameState.wave);
        gameState.enemiesSpawned++;
        gameState.spawnTimer = 0;
      }
    }
    
    // Check wave completion
    if (gameState.enemiesSpawned >= gameState.enemiesToSpawn && 
        gameState.enemies.length === 0) {
      gameState.waveInProgress = false;
      
      if (gameState.wave >= gameState.maxWaves) {
        gameState.gamePhase = 'GAME_OVER_WIN';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_WIN', event: 'victory' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.currentTile = generateRandomTile(p);
      }
    }
  }
  
  // Update enemies
  updateEnemies();
  
  // Update towers
  updateTowers(p, p.frameCount);
  
  // Check lose condition
  if (gameState.escapedEnemies >= gameState.maxEscapedEnemies) {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    gameState.waveInProgress = false;
    
    p.logs.game_info.push({
      data: { phase: 'GAME_OVER_LOSE', event: 'defeat' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.cursorX * 40 + 50,
      screen_y: gameState.cursorY * 40 + 50,
      game_x: gameState.cursorX,
      game_y: gameState.cursorY,
      framecount: p.frameCount
    });
  }
}

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
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
};