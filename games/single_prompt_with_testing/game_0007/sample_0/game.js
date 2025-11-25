// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { Boss } from './boss.js';
import { PlayerProjectile } from './projectiles.js';
import { executeAttack } from './attacks.js';
import { handlePlayerProjectileCollisions, handleBossProjectileCollisions } from './collision.js';
import { renderStartScreen, renderGameOverScreen, renderHUD, renderBackground } from './ui.js';
import { handleKeyPressed, processGameplayInput } from './input.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game variables
  let player = null;
  let boss = null;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game state
    initializeGame();
  };
  
  p.draw = function() {
    p.background(30, 40, 60);
    gameState.frameCount = p.frameCount;
    gameState.animationFrame++;
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame();
        renderGame();
        break;
        
      case PHASE_PAUSED:
        renderGame();
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGame();
        renderGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  function initializeGame() {
    // Reset game state
    gameState.player = null;
    gameState.boss = null;
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.bossProjectiles = [];
    gameState.score = 0;
    gameState.bossDefeated = false;
    gameState.playerDied = false;
    
    // Create player
    player = new Player(p, 100, gameState.groundY - 40);
    gameState.player = player;
    gameState.entities.push(player);
    
    // Create boss
    boss = new Boss(p, CANVAS_WIDTH - 150, 120);
    gameState.boss = boss;
    gameState.entities.push(boss);
    
    // Log player initial state
    p.logs.player_info.push({
      screen_x: player.x,
      screen_y: player.y,
      game_x: player.x,
      game_y: player.y,
      framecount: p.frameCount
    });
  }
  
  function updateGame() {
    // Process input
    const inputAction = processGameplayInput(p);
    
    // Handle shooting
    if (inputAction === 'shoot') {
      const angle = 0; // Shoot straight right
      const projectile = new PlayerProjectile(
        p,
        player.x + player.width,
        player.y + player.height / 2,
        angle
      );
      gameState.projectiles.push(projectile);
    }
    
    // Update player
    player.update();
    
    // Update boss
    const attackType = boss.update();
    if (attackType) {
      const newProjectiles = executeAttack(p, boss, attackType);
      gameState.bossProjectiles.push(...newProjectiles);
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update();
      if (!gameState.projectiles[i].active) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    for (let i = gameState.bossProjectiles.length - 1; i >= 0; i--) {
      gameState.bossProjectiles[i].update();
      if (!gameState.bossProjectiles[i].active) {
        gameState.bossProjectiles.splice(i, 1);
      }
    }
    
    // Check collisions
    const hits = handlePlayerProjectileCollisions(p, gameState.projectiles, boss);
    if (hits > 0) {
      gameState.score += hits * 10;
    }
    
    handleBossProjectileCollisions(p, gameState.bossProjectiles, player);
    
    // Check win/lose conditions
    if (boss.health <= 0 && !gameState.bossDefeated) {
      gameState.bossDefeated = true;
      gameState.score += 500;
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, event: "boss_defeated", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (player.health <= 0 && !gameState.playerDied) {
      gameState.playerDied = true;
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, event: "player_died", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: player.x,
        screen_y: player.y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGame() {
    // Background
    renderBackground(p);
    
    // Render boss
    if (boss) {
      boss.render();
    }
    
    // Render boss projectiles
    gameState.bossProjectiles.forEach(proj => proj.render());
    
    // Render player
    if (player) {
      player.render();
    }
    
    // Render player projectiles
    gameState.projectiles.forEach(proj => proj.render());
    
    // Render HUD
    if (player) {
      renderHUD(p, player);
    }
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' :
                    mode === 'TEST_3' ? 'test_3_ModeBtn' :
                    mode === 'TEST_4' ? 'test_4_ModeBtn' :
                    mode === 'TEST_5' ? 'test_5_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};