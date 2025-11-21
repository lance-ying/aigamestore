// game.js - Main game file
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRID_SIZE,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER,
  PHASE_LEVEL_COMPLETE,
  getCurrentLevelConfig
} from './globals.js';
import { Player } from './player.js';
import { Room } from './room.js';
import { Guest } from './guest.js';
import { Staff } from './staff.js';
import { drawUI, drawFloatingTexts } from './ui.js';
import { handleKeyPressed } from './input.js';
import { updateTestingController } from './testing.js';

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
    p.frameRate(60);
    p.randomSeed(42);

    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('bellhopBlitzHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved);
      }
    }

    // Initialize walls array
    gameState.walls = [];
    for (let y = 0; y < 20; y++) {
      gameState.walls[y] = [];
      for (let x = 0; x < 30; x++) {
        gameState.walls[y][x] = false;
      }
    }

    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(60, 60, 80);

    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      drawGame(p);
    }

    drawUI(p);
    drawFloatingTexts(p);

    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
      updateTestingController(p);
    }
  };

  function drawGame(p) {
    // Draw floor
    p.fill(180, 180, 190);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    p.stroke(160, 160, 170);
    p.strokeWeight(0.5);
    for (let x = 0; x < CANVAS_WIDTH; x += GRID_SIZE) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += GRID_SIZE) {
      p.line(0, y, CANVAS_WIDTH, y);
    }

    // Draw reception area
    const config = getCurrentLevelConfig();
    if (config.reception) {
      p.fill(200, 220, 255);
      p.stroke(80, 100, 140);
      p.strokeWeight(2);
      p.rect(
        config.reception.x * GRID_SIZE,
        config.reception.y * GRID_SIZE,
        config.reception.w * GRID_SIZE,
        config.reception.h * GRID_SIZE
      );
      p.fill(60);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text('RECEPTION', 
        config.reception.x * GRID_SIZE + config.reception.w * GRID_SIZE / 2,
        config.reception.y * GRID_SIZE + config.reception.h * GRID_SIZE / 2
      );
    }

    // Draw cash register
    if (config.cashRegister) {
      p.fill(200, 255, 200);
      p.stroke(80, 140, 80);
      p.strokeWeight(2);
      p.rect(
        config.cashRegister.x * GRID_SIZE,
        config.cashRegister.y * GRID_SIZE,
        config.cashRegister.w * GRID_SIZE,
        config.cashRegister.h * GRID_SIZE
      );
      p.fill(60);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('$', 
        config.cashRegister.x * GRID_SIZE + config.cashRegister.w * GRID_SIZE / 2,
        config.cashRegister.y * GRID_SIZE + config.cashRegister.h * GRID_SIZE / 2
      );
    }

    // Draw staff room
    if (config.staffRoom) {
      p.fill(255, 230, 200);
      p.stroke(140, 100, 80);
      p.strokeWeight(2);
      p.rect(
        config.staffRoom.x * GRID_SIZE,
        config.staffRoom.y * GRID_SIZE,
        config.staffRoom.w * GRID_SIZE,
        config.staffRoom.h * GRID_SIZE
      );
    }

    // Draw rooms
    for (const room of gameState.rooms) {
      room.draw(p);
    }

    // Draw guests
    for (const guest of gameState.guests) {
      guest.draw(p);
    }

    // Draw staff
    for (const staff of gameState.staff) {
      staff.draw(p);
    }

    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
      
      // Draw interaction indicator
      const interactable = gameState.player.getNearbyInteractable();
      if (interactable) {
        p.push();
        p.fill(255, 220, 100);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        
        let targetX, targetY;
        if (interactable.type === 'clean') {
          targetX = interactable.target.x * GRID_SIZE + interactable.target.w * GRID_SIZE / 2;
          targetY = interactable.target.y * GRID_SIZE - 15;
        } else if (interactable.type === 'checkin') {
          targetX = interactable.target.waitX * GRID_SIZE;
          targetY = interactable.target.waitY * GRID_SIZE - 25;
        } else {
          targetX = interactable.target.x * GRID_SIZE + 2 * GRID_SIZE;
          targetY = interactable.target.y * GRID_SIZE + 1.5 * GRID_SIZE - 25;
        }
        
        p.text('!', targetX, targetY);
        p.pop();
      }
    }
  }

  function updateGame(p) {
    const config = getCurrentLevelConfig();
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player position periodically
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

    // Update guests
    for (let i = gameState.guests.length - 1; i >= 0; i--) {
      const guest = gameState.guests[i];
      guest.update(p);
      
      if (guest.status === 'PAID' || guest.status === 'LEFT_UNHAPPY') {
        gameState.guests.splice(i, 1);
      }
    }

    // Update staff
    for (const staff of gameState.staff) {
      staff.update(p, gameState.walls);
    }

    // Spawn guests
    const now = Date.now();
    if (now - gameState.lastGuestSpawnTime > config.guestSpawnInterval) {
      const reception = config.reception;
      const guest = new Guest(
        reception.x + 1,
        reception.y + reception.h + 1,
        p
      );
      gameState.guests.push(guest);
      gameState.lastGuestSpawnTime = now;
    }

    // Check win/lose conditions
    checkGameConditions(p, config);
  }

  function checkGameConditions(p, config) {
    // Lose condition: too many unhappy guests
    if (gameState.unhappyGuestCount >= 5) {
      gameState.gamePhase = PHASE_GAME_OVER;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, reason: 'unhappy_guests' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }

    // Lose condition: time expired
    const elapsed = Math.floor((now - gameState.levelStartTime) / 1000);
    if (elapsed >= config.timeLimit) {
      const allUpgradesPurchased = config.upgrades.every(upg => 
        gameState.upgrades.purchased?.[upg.id]
      );
      
      if (gameState.totalRevenueEarned < config.revenueTarget || !allUpgradesPurchased) {
        gameState.gamePhase = PHASE_GAME_OVER;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, reason: 'time_expired' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
    }

    // Win condition: revenue target and all upgrades
    if (gameState.totalRevenueEarned >= config.revenueTarget) {
      const allUpgradesPurchased = config.upgrades.every(upg => 
        gameState.upgrades.purchased?.[upg.id]
      );
      
      if (allUpgradesPurchased) {
        gameState.gamePhase = PHASE_LEVEL_COMPLETE;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
});

// Expose game instance and state
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ['HUMAN', 'TEST_1', 'TEST_2'];
  modes.forEach(m => {
    const btn = document.getElementById(`${m === 'HUMAN' ? 'humanMode' : m.toLowerCase() + '_Mode'}Btn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};

export { gameInstance };