// game.js - Main game file

import { gameState, loadSavedData, saveData, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_SKILL_SELECTION, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player, Enemy, Projectile } from './entities.js';
import { generateSkillOptions } from './skills.js';
import { checkRoomCleared, clearRoom } from './room.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, updatePlayerMovement, handleAutomatedSkillSelection } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Load saved data
    loadSavedData();
    
    // Initialize game
    gameState.gamePhase = PHASE_START;
    
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "game_loaded" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Render
    renderGame(p);
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGameLogic(p);
    }
    
    // Handle automated testing
    handleAutomatedSkillSelection(p);
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  // Update game logic
  function updateGameLogic(p) {
    // Update level transition timer
    if (gameState.levelTransitionTimer > 0) {
      gameState.levelTransitionTimer--;
      return;
    }
    
    // Update player movement
    updatePlayerMovement(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      if (enemy.hp > 0) {
        enemy.update(p);
      } else if (enemy.hp === 0 && !enemy.counted) {
        // Enemy just died
        enemy.counted = true;
        gameState.score += enemy.scoreValue;
        gameState.roomEnemiesKilled++;
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const projectile = gameState.projectiles[i];
      projectile.update(p);
      
      if (!projectile.active) {
        gameState.projectiles.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(projectile);
        if (entityIndex >= 0) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
    
    // Check if room is cleared
    if (!gameState.roomCleared && checkRoomCleared()) {
      clearRoom();
      
      // Show skill selection
      gameState.skillOptions = generateSkillOptions(p);
      gameState.selectedSkillIndex = 0;
      gameState.gamePhase = PHASE_SKILL_SELECTION;
      
      p.logs.game_info.push({
        data: { phase: PHASE_SKILL_SELECTION, event: "room_cleared" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check if player is dead
    if (gameState.player && gameState.player.hp <= 0) {
      gameState.deathTimer = 120;
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }
      
      saveData();
      
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, event: "player_death" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;