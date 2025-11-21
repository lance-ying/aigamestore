// game.js - Main game file
import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  PHASE_WAVE_COMPLETE,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_R
} from './globals.js';

import { Player, Pumpkin } from './entities.js';
import { startWave, updateWaveSpawning, checkWaveComplete } from './wave_manager.js';
import { checkCollisions, checkZombirdLanded, checkGameOver } from './collision.js';
import { updateParticles } from './particles.js';
import { handleGameplayInput, updatePowerUps } from './input.js';
import { handleUpgradeInput } from './upgrades.js';
import { 
  drawStartScreen, 
  drawGame, 
  drawGameOverScreen,
  drawWaveCompleteScreen
} from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    // Log setup
    p.logs.game_info.push({
      data: { event: 'setup_complete' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        drawGame(p);
        break;
        
      case PHASE_PAUSED:
        drawGame(p);
        break;
        
      case PHASE_WAVE_COMPLETE:
        drawWaveCompleteScreen(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { event: 'game_paused' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (p.keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { event: 'game_resumed' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (p.keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
                                       gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
      restartGame(p);
    } else if (p.keyCode === KEY_SPACE && gameState.gamePhase === PHASE_WAVE_COMPLETE) {
      // Continue to next wave
      gameState.gamePhase = PHASE_PLAYING;
      startWave(p);
    } else if (gameState.gamePhase === PHASE_WAVE_COMPLETE) {
      // Handle upgrade purchases
      handleUpgradeInput(p, p.key);
    }
  };
  
  function initializeGame(p) {
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    gameState.entities.push(gameState.player);
    
    // Create pumpkins
    gameState.pumpkins = [];
    const pumpkinSpacing = 100;
    const startX = 100;
    for (let i = 0; i < 5; i++) {
      const pumpkin = new Pumpkin(startX + i * pumpkinSpacing, CANVAS_HEIGHT - 60);
      gameState.pumpkins.push(pumpkin);
    }
    
    gameState.gamePhase = PHASE_START;
  }
  
  function startGame(p) {
    // Reset game state
    gameState.wave = 0;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.zombirdsKilled = 0;
    gameState.zombirds = [];
    gameState.bolts = [];
    gameState.particles = [];
    gameState.entities = [gameState.player, ...gameState.pumpkins];
    
    // Reset player stats
    gameState.fireRate = 15;
    gameState.boltDamage = 1;
    gameState.lastShotFrame = -100;
    gameState.aimDirection = 0;
    
    // Reset upgrades
    gameState.upgrades = {
      fireRateLevel: 0,
      damageLevel: 0,
      multiShotUnlocked: false,
      shieldUnlocked: false
    };
    
    // Reset power-ups
    gameState.multiShotCooldown = 0;
    gameState.multiShotDuration = 0;
    gameState.shieldCooldown = 0;
    gameState.shieldDuration = 0;
    
    // Reset pumpkins
    for (const pumpkin of gameState.pumpkins) {
      pumpkin.health = pumpkin.maxHealth;
    }
    
    gameState.gamePhase = PHASE_PLAYING;
    startWave(p);
    
    p.logs.game_info.push({
      data: { event: 'game_started' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function restartGame(p) {
    initializeGame(p);
    gameState.gamePhase = PHASE_START;
    
    p.logs.game_info.push({
      data: { event: 'game_restarted' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      simulateKeys(p, actions);
    }
    
    // Handle player input
    handleGameplayInput(p);
    
    // Update power-ups
    updatePowerUps(p);
    
    // Update wave spawning
    updateWaveSpawning(p);
    
    // Update entities
    for (let i = gameState.zombirds.length - 1; i >= 0; i--) {
      const zombird = gameState.zombirds[i];
      const result = zombird.update(p);
      
      if (result === 'landed') {
        // Zombird landed - check if shield active
        if (gameState.shieldDuration === 0) {
          checkZombirdLanded(p, zombird);
        }
        gameState.zombirds.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(zombird);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
    
    // Update bolts
    for (let i = gameState.bolts.length - 1; i >= 0; i--) {
      const bolt = gameState.bolts[i];
      bolt.update(p);
      
      if (!bolt.alive) {
        gameState.bolts.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(bolt);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }
    
    // Update pumpkins
    for (const pumpkin of gameState.pumpkins) {
      pumpkin.update(p);
    }
    
    // Update particles
    updateParticles(p);
    
    // Check collisions
    checkCollisions(p);
    
    // Check game over
    checkGameOver(p);
    
    // Check wave complete
    checkWaveComplete(p);
  }
  
  function simulateKeys(p, keys) {
    // Simulate key presses for automated testing
    for (const keyCode of keys) {
      p.keyIsDown = (function(originalKeyIsDown) {
        return function(k) {
          if (keys.includes(k)) {
            return true;
          }
          return originalKeyIsDown.call(p, k);
        };
      })(p.keyIsDown);
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};