import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { updateCamera } from './camera.js';
import { drawUI } from './ui.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { applyTestingControls, setControlMode } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 20, 30);
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      applyTestingControls(p);
      updateGame();
      renderGame();
    }
    
    drawUI(p);
  };
  
  function updateGame() {
    // Update camera
    updateCamera();
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.camera.x,
          screen_y: gameState.player.y - gameState.camera.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update();
      if (!gameState.projectiles[i].active) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (!gameState.particles[i].active) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update collectibles
    for (let collectible of gameState.collectibles) {
      if (collectible.update) {
        collectible.update();
      }
    }
    
    // Update save stations
    for (let station of gameState.saveStations) {
      station.update();
    }
    
    // Update entities (water zones, etc.)
    for (let entity of gameState.entities) {
      if (entity.update) {
        entity.update();
      }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      enemy.update();
      if (enemy.defeated) {
        gameState.enemies.splice(i, 1);
      }
    }
    
    // Update boss
    if (gameState.boss) {
      gameState.boss.update();
    }
  }
  
  function renderGame() {
    p.push();
    
    // Apply camera shake
    p.translate(gameState.camera.shakeX, gameState.camera.shakeY);
    
    // Draw background gradient
    for (let i = 0; i < CANVAS_HEIGHT; i++) {
      const inter = i / CANVAS_HEIGHT;
      p.stroke(20 + inter * 30, 20 + inter * 40, 30 + inter * 60);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Draw entities (water zones)
    for (let entity of gameState.entities) {
      if (entity.draw) {
        entity.draw();
      }
    }
    
    // Draw platforms
    for (let platform of gameState.platforms) {
      platform.draw();
    }
    
    // Draw hazards
    for (let hazard of gameState.hazards) {
      hazard.draw();
    }
    
    // Draw save stations
    for (let station of gameState.saveStations) {
      station.draw();
    }
    
    // Draw collectibles
    for (let collectible of gameState.collectibles) {
      collectible.draw();
    }
    
    // Draw projectiles
    for (let projectile of gameState.projectiles) {
      projectile.draw();
    }
    
    // Draw particles
    for (let particle of gameState.particles) {
      particle.draw();
    }
    
    // Draw enemies
    for (let enemy of gameState.enemies) {
      enemy.draw();
    }
    
    // Draw boss
    if (gameState.boss) {
      gameState.boss.draw();
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw();
    }
    
    p.pop();
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};
window.setControlMode = setControlMode;