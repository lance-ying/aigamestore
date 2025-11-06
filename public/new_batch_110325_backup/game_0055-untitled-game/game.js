// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from './globals.js';
import { Player } from './player.js';
import { WaveManager } from './wave_manager.js';
import { handleInput, handleKeyPressed } from './input_handler.js';
import { updateParticles, renderParticles, updateDrops, renderDrops } from './particles.js';
import { renderUI, renderStartScreen, renderGameOver, renderPauseIndicator } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let waveManager;
  
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
    
    // Initialize game state
    waveManager = new WaveManager(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 35, 50);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      renderPauseIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGame(p);
      renderGameOver(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame(p);
      renderGameOver(p, false);
    }
  };
  
  function updateGame(p) {
    // Initialize player if needed
    if (!gameState.player) {
      gameState.player = new Player(p, CANVAS_WIDTH / 2, GROUND_Y - 50);
      gameState.entities.push(gameState.player);
      waveManager.startWave();
    }
    
    // Handle input
    handleInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          health: gameState.player.health,
          mana: gameState.player.mana,
          level: gameState.player.level,
          framecount: p.frameCount
        });
      }
      
      // Check for game over (lose)
      if (gameState.player.health <= 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE", event: "player_defeated" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update enemies
    gameState.enemies.forEach(enemy => {
      enemy.update();
    });
    
    // Remove dead enemies
    gameState.enemies = gameState.enemies.filter(e => !e.isDead || e.deathTimer < 30);
    gameState.entities = gameState.entities.filter(e => 
      e === gameState.player || (!e.isDead || e.deathTimer < 30)
    );
    
    // Update wave manager
    waveManager.update();
    
    // Update particles
    updateParticles();
    
    // Update drops
    updateDrops(p);
    
    // Update elapsed time
    if (gameState.gameStartTime > 0) {
      gameState.elapsedTime = Date.now() - gameState.gameStartTime;
    }
  }
  
  function renderGame(p) {
    // Background
    renderBackground(p);
    
    // Render drops
    renderDrops(p);
    
    // Render particles (behind entities)
    renderParticles(p);
    
    // Render enemies
    gameState.enemies.forEach(enemy => {
      enemy.render();
    });
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // Render UI
    renderUI(p);
  }
  
  function renderBackground(p) {
    // Ground
    p.fill(60, 50, 40);
    p.noStroke();
    p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    // Ground decoration
    p.stroke(50, 40, 30);
    p.strokeWeight(2);
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      p.line(x, GROUND_Y, x + 20, GROUND_Y + 10);
    }
    
    // Background gradient
    for (let i = 0; i < GROUND_Y; i += 2) {
      const col = p.map(i, 0, GROUND_Y, 60, 40);
      p.stroke(col, col - 10, col + 10);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Stars
    p.noStroke();
    p.fill(255, 255, 200);
    const starPositions = [
      [50, 30], [120, 60], [200, 40], [280, 70], [350, 50], 
      [420, 35], [480, 65], [540, 45], [100, 100], [300, 120]
    ];
    starPositions.forEach(pos => {
      p.ellipse(pos[0], pos[1], 2, 2);
    });
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return false;
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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