// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
         TOTAL_EVIDENCE } from './globals.js';
import { Player } from './player.js';
import { generateWorld, updateCamera, renderWorld } from './world.js';
import { renderStartScreen, renderGameOverScreen, renderHUD } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.frameCount = 0;

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, mode: gameState.controlMode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    gameState.frameCount++;

    // Single background call to prevent flickering
    p.background(20, 15, 25);

    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Update game if not paused
      if (gameState.gamePhase === PHASE_PLAYING) {
        updateGame(p);
      }

      // Render game
      renderWorld(p);
      
      // Render evidence
      for (const evidence of gameState.evidence) {
        evidence.render(p, gameState.camera);
      }

      // Render spirits
      for (const spirit of gameState.spirits) {
        spirit.render(p, gameState.camera);
      }

      // Render player
      if (gameState.player) {
        gameState.player.render(p, gameState.camera);
      }

      // Render HUD
      renderHUD(p);

    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Render final game state
      renderWorld(p);
      
      for (const evidence of gameState.evidence) {
        evidence.render(p, gameState.camera);
      }

      for (const spirit of gameState.spirits) {
        spirit.render(p, gameState.camera);
      }

      if (gameState.player) {
        gameState.player.render(p, gameState.camera);
      }

      renderGameOverScreen(p);
    }
  };

  function updateGame(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player info every 10 frames
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.camera.x,
          screen_y: gameState.player.y - gameState.camera.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }

    // Update spirits
    for (const spirit of gameState.spirits) {
      spirit.update(p);

      // Check collision with player
      if (gameState.player && spirit.checkCollisionWithPlayer(gameState.player)) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_LOSE, reason: "caught_by_spirit" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Update evidence
    for (const evidence of gameState.evidence) {
      evidence.update(p);
    }

    // Update camera
    updateCamera(p);

    // Check win condition
    if (gameState.evidenceCollected >= TOTAL_EVIDENCE) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, evidence: gameState.evidenceCollected },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
      }
    } else if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === "HUMAN") {
      // Handle gameplay keys
      if (p.keyCode === 90) { // Z - Flashlight
        if (gameState.player && gameState.player.battery > 0) {
          gameState.player.flashlightOn = !gameState.player.flashlightOn;
        }
      } else if (p.keyCode === 32) { // SPACE - Collect evidence
        if (gameState.player) {
          for (const evidence of gameState.evidence) {
            if (!evidence.collected && evidence.canCollect(gameState.player)) {
              evidence.collect();
              p.logs.game_info.push({
                data: { action: "evidence_collected", total: gameState.evidenceCollected },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
              break;
            }
          }
        }
      }
    }

    return false; // Prevent default
  };

  function startGame(p) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.score = 0;
    gameState.evidenceCollected = 0;
    gameState.frameCount = 0;

    // Create player
    gameState.player = new Player(100, 100);
    gameState.entities = [gameState.player];

    // Generate world
    generateWorld(p);

    // Initialize camera
    gameState.camera.x = gameState.player.x - p.width / 2;
    gameState.camera.y = gameState.player.y - p.height / 2;

    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetGame(p) {
    gameState.gamePhase = PHASE_START;
    gameState.player = null;
    gameState.spirits = [];
    gameState.evidence = [];
    gameState.walls = [];
    gameState.entities = [];
    gameState.score = 0;
    gameState.evidenceCollected = 0;

    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "game_reset" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
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

  gameInstance.logs.game_info.push({
    data: { control_mode_changed: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};