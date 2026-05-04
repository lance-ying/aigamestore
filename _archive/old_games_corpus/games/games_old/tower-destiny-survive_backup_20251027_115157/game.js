// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Tower, Block } from './entities.js';
import { handleKeyPressed, updatePlayerMovement } from './input.js';
import { checkCollisions } from './collision.js';
import { renderGame } from './render.js';
import { updateWaveSpawning, checkWaveComplete } from './levels.js';
import { getTestAction, applyTestAction } from './testing.js';

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
    
    // Initialize tower
    gameState.player = new Tower(gameState.towerX, CANVAS_HEIGHT - 80);
    gameState.entities.push(gameState.player);
    
    // Load high score
    const savedHighScore = localStorage.getItem('tds_highscore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Apply test actions if in test mode
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p);
      if (action) {
        applyTestAction(p, action);
        handleKeyPressed(p);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameLogic(p);
    }
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
  };
  
  function updateGameLogic(p) {
    // Update player movement
    updatePlayerMovement(p);
    
    // Update tower
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          health: gameState.towerHealth,
          framecount: p.frameCount
        });
      }
    }
    
    // Update wave spawning
    updateWaveSpawning(p);
    
    // Update bullets
    gameState.bullets.forEach(b => b.update(p));
    
    // Update zombies
    gameState.zombies.forEach(z => z.update(p));
    
    // Update blocks
    gameState.blocks.forEach(b => b.update(p));
    
    // Update particles
    gameState.particles.forEach(part => part.update(p));
    
    // Spawn blocks randomly
    gameState.blockSpawnTimer++;
    const levelConfig = gameState.levels[gameState.currentLevel - 1];
    if (gameState.blockSpawnTimer >= levelConfig.blockFrequency) {
      const block = new Block(
        100 + Math.random() * 400,
        270 + Math.random() * 40
      );
      gameState.blocks.push(block);
      gameState.blockSpawnTimer = 0;
    }
    
    // Check collisions
    checkCollisions(p);
    
    // Check wave completion
    checkWaveComplete();
    
    // Check game over
    if (gameState.towerHealth <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('tds_highscore', gameState.highScore.toString());
      }
      
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};