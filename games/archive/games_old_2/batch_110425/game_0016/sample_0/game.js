// game.js - Main game file

import { 
  gameState, 
  initializeGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN
} from './globals.js';

import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { renderStartScreen, renderGame, renderGameOver } from './rendering.js';
import { handleKeyPressed, handleKeyReleased, processPlayerInput } from './input.js';
import { checkBulletCollisions, checkBoundaries, checkCoverCollision } from './collision.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let worldWidth = 1200;
  let worldHeight = 800;
  
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
    
    // Initialize game state
    initializeGameState();
    
    // Log initial game info
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Update game only when not paused
      if (gameState.gamePhase === PHASE_PLAYING) {
        updateGame(p);
      }
      renderGame(p, worldWidth, worldHeight);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOver(p);
    }
  };
  
  function updateGame(p) {
    // Initialize player if needed
    if (!gameState.player) {
      gameState.player = new Player(150, 150);
      const levelData = generateLevel(p, gameState.currentMission);
      worldWidth = levelData.worldWidth;
      worldHeight = levelData.worldHeight;
      
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Process input
    processPlayerInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      checkBoundaries(gameState.player, worldWidth, worldHeight);
      checkCoverCollision(gameState.player, p);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Update camera to follow player
      gameState.cameraX = gameState.player.x - CANVAS_WIDTH / 2;
      gameState.cameraY = gameState.player.y - CANVAS_HEIGHT / 2;
      
      // Clamp camera to world bounds
      gameState.cameraX = Math.max(0, Math.min(worldWidth - CANVAS_WIDTH, gameState.cameraX));
      gameState.cameraY = Math.max(0, Math.min(worldHeight - CANVAS_HEIGHT, gameState.cameraY));
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      if (enemy.health > 0) {
        enemy.update(p);
        checkBoundaries(enemy, worldWidth, worldHeight);
        checkCoverCollision(enemy, p);
        
        // Enemy firing
        if (enemy.fireCooldown === 0 && enemy.state === "combat") {
          const bullet = enemy.fire(p);
          if (bullet) {
            gameState.bullets.push(bullet);
          }
        }
      }
    }
    
    // Update bullets
    for (let bullet of gameState.bullets) {
      if (bullet.active) {
        bullet.update(p);
      }
    }
    
    // Check bullet collisions
    checkBulletCollisions(p);
    
    // Update utilities
    for (let utility of gameState.utilities) {
      if (utility.active) {
        utility.update(p);
      }
    }
    
    // Remove inactive utilities
    gameState.utilities = gameState.utilities.filter(u => u.active);
    
    // Update particles
    for (let particle of gameState.particles) {
      if (particle.active) {
        particle.update(p);
      }
    }
    
    // Remove inactive particles
    gameState.particles = gameState.particles.filter(p => p.active);
    
    // Remove dead enemies
    gameState.enemies = gameState.enemies.filter(e => e.health > 0);
    
    // Check win condition
    if (gameState.enemies.length === 0 && !gameState.missionComplete) {
      gameState.missionComplete = true;
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, message: "Mission complete" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check lose condition
    if (gameState.player && gameState.playerHealth <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, message: "Mission failed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  
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

export default gameInstance;