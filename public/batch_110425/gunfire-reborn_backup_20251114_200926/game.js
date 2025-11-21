// game.js - Main game file
import { 
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_SHOP,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  MAX_ACTS,
  ROOMS_PER_ACT
} from './globals.js';

import { updateCamera } from './utils.js';
import { handleKeyPressed, handleKeyReleased, processGameplayInput } from './input.js';
import { 
  drawStartScreen, 
  drawGameOverScreen,
  drawShopScreen,
  drawUI, 
  drawRoom,
  drawEntities 
} from './rendering.js';
import { generateNextRoom } from './room.js';

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
    
    // Initialize game state
    gameState.frameCount = 0;
    
    // Log setup
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "setup_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(30);
    gameState.frameCount = p.frameCount;
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        updateGameplay();
        renderGameplay();
        break;
        
      case PHASE_SHOP:
        renderGameplay();
        drawShopScreen(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
        renderGameplay();
        drawGameOverScreen(p, true);
        break;
        
      case PHASE_GAME_OVER_LOSE:
        renderGameplay();
        drawGameOverScreen(p, false);
        break;
    }
  };
  
  function updateGameplay() {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    const player = gameState.player;
    if (!player) return;
    
    // Process input
    processGameplayInput(p);
    
    // Update player
    player.update();
    
    // Update camera
    updateCamera(player.x, player.y);
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      if (enemy.alive) {
        enemy.update();
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      proj.update();
      if (!proj.alive) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update items
    for (const item of gameState.items) {
      if (!item.collected) {
        item.update();
      }
    }
    
    // Update room
    const room = gameState.currentRoomObj;
    if (room) {
      room.update();
      
      // Check exit
      if (room.checkExit(player)) {
        progressToNextRoom();
      }
    }
    
    // Check game over
    if (player.health <= 0) {
      gameOver(false);
    }
    
    // Log player info periodically
    if (gameState.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: player.getScreenPosition().x,
        screen_y: player.getScreenPosition().y,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGameplay() {
    // Draw room
    drawRoom(p, gameState.currentRoomObj);
    
    // Draw entities
    drawEntities(p);
    
    // Draw UI
    drawUI(p);
  }
  
  function progressToNextRoom() {
    gameState.currentRoom++;
    gameState.shopAvailable = false;
    
    // Check if act is complete
    if (gameState.currentRoom >= ROOMS_PER_ACT + 1) {
      gameState.currentAct++;
      gameState.currentRoom = 0;
      
      // Check if game is won
      if (gameState.currentAct > MAX_ACTS) {
        gameOver(true);
        return;
      }
    }
    
    // Generate next room
    const room = generateNextRoom();
    gameState.currentRoomObj = room;
    gameState.enemies = room.enemies;
    gameState.projectiles = [];
    gameState.items = [];
    
    // Move player to start
    gameState.player.x = 100;
    gameState.player.y = 300;
  }
  
  function gameOver(won) {
    gameState.gamePhase = won ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        event: won ? "game_won" : "game_lost",
        finalScore: gameState.score,
        act: gameState.currentAct,
        roomsCleared: gameState.roomsCleared
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose globally
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
};

export default gameInstance;