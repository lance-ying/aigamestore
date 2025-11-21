// input.js - Input handling
import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN
} from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame();
    return;
  }
  
  if (keyCode === KEY_ESC && 
      (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause();
    return;
  }
  
  if (keyCode === KEY_R && 
      (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    returnToStart();
    return;
  }
  
  // Store key state
  gameState.keys[keyCode] = true;
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  gameState.keys[keyCode] = false;
}

export function processGameplayInput(p) {
  const player = gameState.player;
  if (!player || gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Get input based on control mode
  let input;
  if (gameState.controlMode === "HUMAN") {
    input = getHumanInput(p);
  } else {
    // Automated testing
    const testAction = window.get_automated_testing_action(gameState);
    input = testAction || getHumanInput(p);
  }
  
  // Process movement
  let dx = 0;
  let dy = 0;
  
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;
    dy /= length;
  }
  
  player.move(dx, dy);
  
  // Fire weapon
  if (input.fire) {
    fireWeapon(player);
  }
  
  // Use skill
  if (input.skill && !input.skillWasPressed) {
    player.useSkill(gameState.frameCount);
    input.skillWasPressed = true;
  }
  if (!input.skill) {
    input.skillWasPressed = false;
  }
  
  // Swap weapon
  if (input.swap && !input.swapWasPressed) {
    player.swapWeapon();
    input.swapWasPressed = true;
  }
  if (!input.swap) {
    input.swapWasPressed = false;
  }
}

function getHumanInput(p) {
  return {
    left: p.keyIsDown(KEY_LEFT),
    right: p.keyIsDown(KEY_RIGHT),
    up: p.keyIsDown(KEY_UP),
    down: p.keyIsDown(KEY_DOWN),
    fire: p.keyIsDown(KEY_SPACE),
    skill: p.keyIsDown(KEY_SHIFT),
    swap: p.keyIsDown(KEY_Z)
  };
}

function fireWeapon(player) {
  const weapon = player.getCurrentWeapon();
  const projectileData = weapon.fire(gameState.frameCount);
  
  if (projectileData.length === 0) return;
  
  const { Projectile } = require('./projectiles.js');
  
  for (const data of projectileData) {
    const angle = player.aimAngle + (data.spreadOffset || 0);
    const vx = Math.cos(angle) * data.speed;
    const vy = Math.sin(angle) * data.speed;
    
    const projectile = new Projectile(
      player.x + Math.cos(angle) * player.radius,
      player.y + Math.sin(angle) * player.radius,
      vx,
      vy,
      data.damage * player.damageMultiplier * (player.skillActive ? 1.5 : 1),
      data.size,
      data.color,
      false,
      data.element
    );
    
    gameState.projectiles.push(projectile);
  }
}

function startGame() {
  const { Player } = require('./player.js');
  const { generateNextRoom } = require('./room.js');
  
  // Reset game state
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentAct = 1;
  gameState.currentRoom = 0;
  gameState.roomsCleared = 0;
  gameState.score = 0;
  gameState.gold = 0;
  gameState.enemiesKilled = 0;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.items = [];
  gameState.positionHistory = [];
  
  // Create player
  gameState.player = new Player(100, 300);
  
  // Generate first room
  const room = generateNextRoom();
  gameState.currentRoomObj = room;
  gameState.enemies = room.enemies;
  
  // Log game start
  window.gameInstance.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_started" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function togglePause() {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    window.gameInstance.logs.game_info.push({
      data: { phase: PHASE_PAUSED, event: "game_paused" },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    window.gameInstance.logs.game_info.push({
      data: { phase: PHASE_PLAYING, event: "game_resumed" },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

function returnToStart() {
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.items = [];
  gameState.currentRoomObj = null;
  
  window.gameInstance.logs.game_info.push({
    data: { phase: PHASE_START, event: "returned_to_start" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}