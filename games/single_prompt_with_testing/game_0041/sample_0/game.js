// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, resetGameState } from './globals.js';
import { Player } from './player.js';
import { generateCave } from './cave.js';
import { generateEntities } from './entities.js';
import { InputHandler } from './input.js';
import { drawStartScreen, drawPausedIndicator, drawGameOver, drawHUD, drawBackground } from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  
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
    
    inputHandler = new InputHandler();
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 20, 30);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      drawGame(p);
      drawHUD(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawGame(p);
      drawHUD(p);
      drawPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGame(p);
      drawGameOver(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
    }
  };
  
  function startGame() {
    resetGameState();
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    // Generate world
    generateCave(p);
    generateEntities(p);
    
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, 80);
    gameState.entities = [gameState.player];
    
    // Log game start
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Log initial player state
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y - gameState.cameraY,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  function updateGame(p) {
    gameState.framesSinceStart++;
    inputHandler.update(p);
    
    if (!gameState.player || !gameState.player.alive) return;
    
    // Update player
    const prevX = gameState.player.x;
    const prevY = gameState.player.y;
    
    gameState.player.update(inputHandler.keys);
    
    // Log player position changes
    if (Math.abs(prevX - gameState.player.x) > 0.1 || 
        Math.abs(prevY - gameState.player.y) > 0.1) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y - gameState.cameraY,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
    
    // Update camera
    const targetCameraY = gameState.player.y - CANVAS_HEIGHT / 2;
    gameState.cameraY += (targetCameraY - gameState.cameraY) * 0.1;
    gameState.cameraY = Math.max(0, gameState.cameraY);
    
    // Check collisions with cave
    for (let segment of gameState.caveSegments) {
      if (Math.abs(segment.y - gameState.player.y) < 100) {
        if (segment.checkCollision(gameState.player, p)) {
          gameState.player.alive = false;
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, reason: "collision" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          return;
        }
      }
    }
    
    // Check gem collection
    for (let gem of gameState.gems) {
      if (gem.checkCollection(gameState.player, p)) {
        gameState.score += gem.value * 100;
        gameState.gemsCollected++;
      }
    }
    
    // Check fuel stations
    gameState.isLanded = false;
    for (let station of gameState.fuelStations) {
      if (station.checkLanding(gameState.player, p)) {
        gameState.isLanded = true;
        gameState.player.vx *= 0.9;
        gameState.player.vy *= 0.9;
        station.refuel();
      }
    }
    
    // Check fuel depletion
    if (gameState.fuel <= 0) {
      gameState.player.alive = false;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, reason: "fuel_depleted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Check win condition - return to surface with gems
    if (gameState.gemsCollected > 0 && gameState.player.y < 120 && !gameState.returnedToSurface) {
      gameState.returnedToSurface = true;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { 
          gamePhase: gameState.gamePhase, 
          score: gameState.score,
          gemsCollected: gameState.gemsCollected 
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function drawGame(p) {
    drawBackground(p);
    
    // Draw cave segments
    for (let segment of gameState.caveSegments) {
      segment.draw(p);
    }
    
    // Draw fuel stations
    for (let station of gameState.fuelStations) {
      station.draw(p);
    }
    
    // Draw gems
    for (let gem of gameState.gems) {
      gem.draw(p);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // Draw surface indicator
    if (gameState.cameraY > 100) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.textAlign(p.CENTER);
      p.textSize(12);
      p.text("↑ SURFACE", CANVAS_WIDTH / 2, 20);
    }
  }
  
  p.keyPressed = function() {
    inputHandler.logInput(p, "keyPressed", p.key, p.keyCode);
    
    // ENTER - start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      }
    }
    
    // ESC - pause/unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PLAYING ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.START;
        resetGameState();
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };
  
  p.keyReleased = function() {
    inputHandler.logInput(p, "keyReleased", p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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