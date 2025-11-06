// game.js - Main game loop and p5.js instance

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_LOSE } from './globals.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, getAutomatedInput } from './input.js';
import { updateSpawning, cleanupDeadEnemies } from './spawner.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const automatedInput = getAutomatedInput(p);
      if (automatedInput && automatedInput.keyCode !== 0) {
        simulateKeyPress(automatedInput.keyCode, p);
      }
    }

    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };

  function updateGame(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player info
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Check for game over
      if (gameState.player.health <= 0) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { 
            phase: PHASE_GAME_OVER_LOSE,
            finalScore: gameState.score,
            survivalTime: gameState.survivalTime
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Update enemies
    gameState.enemies.forEach(enemy => enemy.update(p));

    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
      particle.update();
      return !particle.isDead();
    });

    // Spawning
    updateSpawning(p);

    // Cleanup
    cleanupDeadEnemies();
  }

  function simulateKeyPress(keyCode, p) {
    p.keyCode = keyCode;
    
    // Map keyCode to key
    const keyMap = {
      37: 'ArrowLeft',
      39: 'ArrowRight',
      32: ' ',
      38: 'ArrowUp',
      40: 'ArrowDown',
      27: 'Escape'
    };
    
    p.key = keyMap[keyCode] || '';
    handleKeyPressed(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

export default gameInstance;