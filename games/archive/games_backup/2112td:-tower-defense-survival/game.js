import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { generatePath, generateValidTowerPositions } from './pathGeneration.js';
import { handleKeyPressed, updatePlacementPreview } from './input.js';
import { startWave, updateWaveSpawning, checkWaveStart } from './waveManager.js';
import { renderStartScreen, renderPauseIndicator, renderGameOverScreen, renderUI, renderPath, renderTowerPreview, renderCommandCenter } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    gameState.path = generatePath();
    gameState.validTowerPositions = generateValidTowerPositions(gameState.path);
    
    p.logs.game_info.push({
      data: { phase: "START", initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOverScreen(p);
      return;
    }
    
    if (gameState.gamePhase === "PLAYING") {
      updateGame(p);
    }
    
    renderGame(p);
    
    if (gameState.gamePhase === "PAUSED") {
      renderPauseIndicator(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  function updateGame(p) {
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      for (const keyCode of actions) {
        handleKeyPressed(p, String.fromCharCode(keyCode), keyCode);
      }
    }
    
    gameState.framesSinceLastAction++;
    
    gameState.gameSpeed = p.keyIsDown(16) ? 2 : 1;
    
    if (checkWaveStart()) {
      startWave();
    }
    
    updateWaveSpawning(p);
    
    updatePlacementPreview(p);
    
    for (const tower of gameState.towers) {
      tower.update(gameState.enemies, gameState.projectiles, gameState.gameSpeed);
    }
    
    for (const projectile of gameState.projectiles) {
      projectile.update(gameState.gameSpeed);
    }
    
    gameState.projectiles = gameState.projectiles.filter(proj => !proj.dead);
    
    for (const enemy of gameState.enemies) {
      enemy.update(gameState.gameSpeed);
      
      if (enemy.reachedGoal && !enemy.dead) {
        gameState.commandCenterHealth -= 10;
        gameState.enemiesReachedGoal++;
        enemy.dead = true;
        
        if (gameState.commandCenterHealth <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", wave: gameState.wave },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    const deadEnemies = gameState.enemies.filter(e => e.dead && !e.reachedGoal);
    for (const enemy of deadEnemies) {
      gameState.money += enemy.reward;
      gameState.score += enemy.reward * 10;
    }
    
    gameState.enemies = gameState.enemies.filter(e => !e.dead);
  }
  
  function renderGame(p) {
    p.background(20, 30, 50);
    
    renderPath(p);
    renderCommandCenter(p);
    
    for (const tower of gameState.towers) {
      tower.render(p);
    }
    
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
    
    for (const projectile of gameState.projectiles) {
      projectile.render(p);
    }
    
    renderTowerPreview(p);
    renderUI(p);
    
    if (p.frameCount % 10 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: gameState.previewX,
        screen_y: gameState.previewY,
        game_x: gameState.previewX,
        game_y: gameState.previewY,
        framecount: p.frameCount
      });
    }
  }
});

window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const btnId = modeMap[mode];
  if (btnId) {
    document.getElementById(btnId).classList.add('active');
  }
};