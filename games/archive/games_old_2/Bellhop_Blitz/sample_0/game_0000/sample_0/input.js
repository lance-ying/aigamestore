// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER, PHASE_LEVEL_COMPLETE, PHASE_WIN_GAME, getCurrentLevelConfig } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      nextLevel(p);
    }
  } else if (keyCode === 82) { // R
    restartGame(p);
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      gameState.upgrades.showMenu = false;
      logGameInfo(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      gameState.upgrades.showMenu = false;
      logGameInfo(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === 'HUMAN') {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const player = gameState.player;
  if (!player) return;

  // Movement
  if (keyCode === 37 || keyCode === 65) { // Left
    player.moveTo(player.gridX - 1, player.gridY, gameState.walls);
  } else if (keyCode === 38 || keyCode === 87) { // Up
    player.moveTo(player.gridX, player.gridY - 1, gameState.walls);
  } else if (keyCode === 39 || keyCode === 68) { // Right
    player.moveTo(player.gridX + 1, player.gridY, gameState.walls);
  } else if (keyCode === 40 || keyCode === 83) { // Down
    player.moveTo(player.gridX, player.gridY + 1, gameState.walls);
  }

  // Interact
  if (keyCode === 32) { // Space
    const interactable = player.getNearbyInteractable();
    if (interactable) {
      const duration = interactable.type === 'clean' ? 
        3000 / gameState.upgrades.playerCleanSpeed :
        interactable.type === 'checkin' ?
        2500 / gameState.upgrades.playerCheckinSpeed : 1500;
      player.startTask(interactable.type, interactable.target, duration);
    }
  }

  // Upgrade menu
  if (keyCode === 16) { // Shift
    gameState.gamePhase = PHASE_PAUSED;
    gameState.upgrades.showMenu = !gameState.upgrades.showMenu;
    logGameInfo(p);
  }

  // Purchase upgrades (1-4)
  if (gameState.upgrades.showMenu && keyCode >= 49 && keyCode <= 52) {
    purchaseUpgrade(p, keyCode - 49);
  }
}

function purchaseUpgrade(p, index) {
  const config = getCurrentLevelConfig();
  if (index >= config.upgrades.length) return;

  const upg = config.upgrades[index];
  if (!gameState.upgrades.purchased) {
    gameState.upgrades.purchased = {};
  }

  if (gameState.upgrades.purchased[upg.id]) return;
  if (gameState.currentMoney < upg.cost) return;

  gameState.currentMoney -= upg.cost;
  gameState.upgrades.purchased[upg.id] = true;

  // Apply upgrade
  if (upg.type === 'playerSpeed') {
    gameState.upgrades.playerSpeed += 0.5;
  } else if (upg.type === 'cleanSpeed') {
    gameState.upgrades.playerCleanSpeed += 0.2;
    gameState.upgrades.staffCleanSpeed += 0.2;
  } else if (upg.type === 'checkinSpeed') {
    gameState.upgrades.playerCheckinSpeed += 0.2;
    gameState.upgrades.staffCheckinSpeed += 0.2;
  } else if (upg.type === 'roomCapacity') {
    gameState.upgrades.roomCapacity += parseInt(upg.name.match(/\d+/)[0]);
  } else if (upg.type === 'staffCleaner') {
    spawnStaff(p, 'CLEANER');
  } else if (upg.type === 'staffReceptionist') {
    spawnStaff(p, 'RECEPTIONIST');
  } else if (upg.type === 'allStaffSpeed') {
    gameState.upgrades.staffCleanSpeed += 0.3;
    gameState.upgrades.staffCheckinSpeed += 0.3;
  }
}

function spawnStaff(p, type) {
  const { Staff } = require('./staff.js');
  const config = getCurrentLevelConfig();
  const staffRoom = config.staffRoom || { x: 22, y: 1 };
  const staff = new Staff(
    type,
    (staffRoom.x + 1) * 20 + 10,
    (staffRoom.y + 1) * 20 + 10
  );
  gameState.staff.push(staff);
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.currentMoney = 0;
  gameState.totalRevenueEarned = 0;
  gameState.unhappyGuestCount = 0;
  gameState.upgrades = {
    playerSpeed: 1,
    playerCleanSpeed: 1,
    playerCheckinSpeed: 1,
    roomCapacity: 0,
    staffCleanSpeed: 1,
    staffCheckinSpeed: 1,
    showMenu: false,
    purchased: {}
  };
  
  initializeLevel(p);
  logGameInfo(p);
}

function initializeLevel(p) {
  const config = getCurrentLevelConfig();
  
  // Clear entities
  gameState.rooms = [];
  gameState.guests = [];
  gameState.staff = [];
  gameState.floatingTexts = [];
  
  // Create walls
  gameState.walls = [];
  for (let y = 0; y < 20; y++) {
    gameState.walls[y] = [];
    for (let x = 0; x < 30; x++) {
      gameState.walls[y][x] = false;
    }
  }

  // Create rooms
  const { Room } = require('./room.js');
  for (const roomData of config.rooms) {
    const room = new Room(roomData.x, roomData.y, roomData.w, roomData.h);
    gameState.rooms.push(room);
    
    // Mark room areas as non-walkable
    for (let dy = 0; dy < roomData.h; dy++) {
      for (let dx = 0; dx < roomData.w; dx++) {
        const gx = roomData.x + dx;
        const gy = roomData.y + dy;
        if (gx < 30 && gy < 20) {
          gameState.walls[gy][gx] = true;
        }
      }
    }
  }

  // Create player
  const { Player } = require('./player.js');
  gameState.player = new Player(100, 200);
  
  // Initialize timing
  gameState.levelStartTime = Date.now();
  gameState.lastGuestSpawnTime = Date.now();
  
  logPlayerInfo(p);
}

function nextLevel(p) {
  if (gameState.currentLevel >= 4) {
    gameState.gamePhase = PHASE_WIN_GAME;
    logGameInfo(p);
    return;
  }

  // Add time bonus
  const config = getCurrentLevelConfig();
  const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const remaining = Math.max(0, config.timeLimit - elapsed);
  gameState.score += remaining * 5;

  gameState.currentLevel++;
  gameState.totalRevenueEarned = 0;
  gameState.unhappyGuestCount = 0;
  gameState.upgrades.purchased = {};
  
  initializeLevel(p);
  gameState.gamePhase = PHASE_PLAYING;
  logGameInfo(p);
}

function restartGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLevel = 1;
  
  // Save high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('bellhopBlitzHighScore', gameState.highScore);
    }
  }
  
  logGameInfo(p);
}

function logGameInfo(p) {
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (!gameState.player) return;
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p.frameCount
  });
}

export { startGame, restartGame, nextLevel, initializeLevel };