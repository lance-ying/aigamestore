import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { CosmicEnd } from './cosmic_end.js';
import { TerrainGenerator } from './terrain_generator.js';
import { TimeRewind } from './time_rewind.js';
import { UI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let terrainGenerator;
  let timeRewind;
  let ui;
  let keysPressed = {};

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game systems
    terrainGenerator = new TerrainGenerator(p);
    timeRewind = new TimeRewind();
    ui = new UI(p);
    
    // Log initial game info
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    if (gameState.gamePhase === "START") {
      ui.drawStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
      updateGame();
      drawGame();
      
      if (gameState.gamePhase === "PAUSED") {
        ui.drawPaused();
      }
    } else if (gameState.gamePhase === "PAUSED") {
      drawGame();
      ui.drawPaused();
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGame();
      ui.drawGameOver(gameState.gamePhase === "GAME_OVER_WIN");
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      handleAutomatedTesting();
    }
  };

  function initGame() {
    // Initialize player
    gameState.player = new Player(p, 150, CANVAS_HEIGHT - 150);
    gameState.entities = [gameState.player];
    
    // Initialize terrain
    gameState.platforms = [];
    gameState.gems = [];
    gameState.obstacles = [];
    terrainGenerator.generateInitialTerrain(gameState.platforms, gameState.gems, gameState.obstacles);
    
    // Initialize cosmic end
    gameState.cosmicEnd = new CosmicEnd(p, -200);
    
    // Reset game state
    gameState.score = 0;
    gameState.timeEnergy = gameState.maxTimeEnergy;
    gameState.scrollOffset = 0;
    gameState.difficulty = 1.0;
    gameState.rewindActive = false;
    gameState.rewindData = [];
    gameState.distanceTraveled = 0;
    
    keysPressed = {};
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", event: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGame() {
    if (!gameState.player) return;
    
    // Update difficulty based on distance
    gameState.difficulty = 1.0 + gameState.distanceTraveled / 1000;
    
    // Update player
    gameState.player.update();
    
    // Update scroll offset
    gameState.scrollOffset += gameState.player.vx;
    gameState.distanceTraveled += gameState.player.vx;
    
    // Update cosmic end
    gameState.cosmicEnd.update(gameState.difficulty);
    
    // Update time rewind
    timeRewind.update();
    
    // Update gems
    for (let gem of gameState.gems) {
      gem.update();
      if (gem.checkCollision(gameState.player)) {
        if (!gem.collected) {
          gem.collected = true;
          gameState.score += 10;
        }
      }
    }
    
    // Check collisions with obstacles
    if (!gameState.rewindActive) {
      for (let obstacle of gameState.obstacles) {
        if (obstacle.checkCollision(gameState.player, gameState.scrollOffset)) {
          gameState.player.alive = false;
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", event: "collision_death", cause: obstacle.type },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          return;
        }
      }
      
      // Check cosmic end collision
      if (gameState.cosmicEnd.checkCollision(gameState.player, gameState.scrollOffset)) {
        gameState.player.alive = false;
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE", event: "cosmic_end_death" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
    }
    
    // Generate new terrain
    terrainGenerator.generateTerrain(gameState.platforms, gameState.gems, gameState.obstacles, gameState.difficulty);
    terrainGenerator.cleanup(gameState.platforms, gameState.gems, gameState.obstacles, gameState.scrollOffset);
    
    // Win condition: survive for a long distance
    if (gameState.distanceTraveled > 3000) {
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", event: "victory", distance: gameState.distanceTraveled },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function drawGame() {
    // Draw background
    ui.drawBackground();
    
    // Draw platforms
    for (let platform of gameState.platforms) {
      platform.draw(gameState.scrollOffset);
    }
    
    // Draw gems
    for (let gem of gameState.gems) {
      gem.draw(gameState.scrollOffset);
    }
    
    // Draw obstacles
    for (let obstacle of gameState.obstacles) {
      obstacle.draw(gameState.scrollOffset);
    }
    
    // Draw cosmic end
    if (gameState.cosmicEnd) {
      gameState.cosmicEnd.draw(gameState.scrollOffset);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw();
    }
    
    // Draw time rewind effect
    timeRewind.drawRewindEffect(p);
    
    // Draw HUD
    ui.drawHUD();
  }

  function handleAutomatedTesting() {
    const action = get_automated_testing_action(gameState);
    
    if (action) {
      if (action.keyCode === 32) { // Space
        gameState.player.dive();
      } else if (action.keyCode === 90) { // Z
        timeRewind.activateRewind();
      }
    } else {
      gameState.player.rise();
    }
  }

  p.keyPressed = function() {
    keysPressed[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        initGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { phase: "PAUSED", event: "game_paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { phase: "PLAYING", event: "game_resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { phase: "START", event: "game_restarted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === "PLAYING") {
      if (p.keyCode === 32) { // SPACE
        if (gameState.player) {
          gameState.player.dive();
        }
      } else if (p.keyCode === 90) { // Z
        timeRewind.activateRewind();
      }
    }
  };

  p.keyReleased = function() {
    keysPressed[p.keyCode] = false;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Gameplay controls (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === "PLAYING") {
      if (p.keyCode === 32) { // SPACE
        if (gameState.player) {
          gameState.player.rise();
        }
      }
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { event: "control_mode_changed", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};