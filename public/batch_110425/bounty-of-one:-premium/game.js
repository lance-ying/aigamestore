import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { updateSpawning } from './spawner.js';
import { updateProjectiles, updateExperienceOrbs, updateParticles } from './physics.js';
import { renderGame, renderStartScreen, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed, updatePlayerMovement } from './input.js';
import { generateUpgradeChoices, selectUpgrade } from './upgrades.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  // Key handling
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  // Main game update loop
  function updateGame(p) {
    // Initialize player if needed
    if (!gameState.player) {
      gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      gameState.entities.push(gameState.player);
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      
      if (action && action.action === 'upgrade' && gameState.pendingLevelUp) {
        selectUpgrade(action.upgradeIndex);
      } else if (action && action.action === 'keys') {
        // Simulate key presses
        simulateKeys(p, action.keys);
      }
    }
    
    // Pause during level up
    if (gameState.pendingLevelUp) {
      if (gameState.upgradeChoices.length === 0) {
        gameState.upgradeChoices = generateUpgradeChoices(3);
      }
      return; // Don't update game during upgrade selection
    }
    
    // Update player movement
    if (gameState.controlMode === "HUMAN") {
      updatePlayerMovement(p);
    }
    
    // Update game time
    gameState.elapsedTime++;
    
    // Spawning
    updateSpawning(p);
    
    // Update entities
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    for (const enemy of gameState.enemies) {
      enemy.update(p);
    }
    
    // Update projectiles and physics
    updateProjectiles(p);
    updateExperienceOrbs(p);
    updateParticles(p);
  }
  
  function simulateKeys(p, keys) {
    const player = gameState.player;
    if (!player || !keys) return;
    
    const speed = player.moveSpeed * player.speedMultiplier;
    let vx = 0;
    let vy = 0;
    
    for (const key of keys) {
      if (key === 37) vx -= speed; // Left
      if (key === 39) vx += speed; // Right
      if (key === 38) vy -= speed; // Up
      if (key === 40) vy += speed; // Down
      if (key === 32) player.dash(p); // Space
      if (key === 90) player.useSpecialAbility(p); // Z
    }
    
    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const mag = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / mag) * speed;
      vy = (vy / mag) * speed;
    }
    
    player.vx = vx;
    player.vy = vy;
    
    if (vx !== 0 || vy !== 0) {
      player.angle = p.atan2(vy, vx);
    }
  }
});

// Expose globally
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