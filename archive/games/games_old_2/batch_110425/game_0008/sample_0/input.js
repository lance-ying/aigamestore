// input.js - Input handling for player controls

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SCROLL_SPEED, UNIT_COMMANDO, UNIT_SNIPER, UNIT_HEAVY, DEPLOY_COST, UPGRADE_COST, TURRET_COST, MAX_TURRETS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MAP_WIDTH, MAP_HEIGHT } from './globals.js';
import { Unit, Turret } from './entities.js';
import { activateHeroAbility } from './heroAbilities.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }

  if (keyCode === 27) { // ESC
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
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase !== PHASE_PLAYING) return;

  gameState.keysPressed[keyCode] = true;

  if (keyCode === 32) { // SPACE - deploy unit
    deployUnit(p);
  }

  if (keyCode === 16) { // SHIFT - cycle unit type
    cycleUnitType();
  }

  if (keyCode === 90) { // Z - hero ability
    activateHeroAbility(p);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  gameState.keysPressed[keyCode] = false;
}

export function updateInputs() {
  if (gameState.gamePhase !== PHASE_PLAYING) return;

  // Arrow key scrolling
  if (gameState.keysPressed[37]) { // LEFT
    gameState.cameraX = Math.max(0, gameState.cameraX - SCROLL_SPEED);
  }
  if (gameState.keysPressed[39]) { // RIGHT
    gameState.cameraX = Math.min(MAP_WIDTH - CANVAS_WIDTH, gameState.cameraX + SCROLL_SPEED);
  }
  if (gameState.keysPressed[38]) { // UP
    gameState.cameraY = Math.max(0, gameState.cameraY - SCROLL_SPEED);
  }
  if (gameState.keysPressed[40]) { // DOWN
    gameState.cameraY = Math.min(MAP_HEIGHT - CANVAS_HEIGHT, gameState.cameraY + SCROLL_SPEED);
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Clear all entities
  gameState.units = [];
  gameState.enemies = [];
  gameState.turrets = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Reset game state
  gameState.gamePhase = PHASE_START;
  gameState.energy = 100;
  gameState.score = 0;
  gameState.wave = 0;
  gameState.enemiesKilled = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.cursorX = CANVAS_WIDTH / 2;
  gameState.cursorY = CANVAS_HEIGHT / 2;
  gameState.heroAbilityCooldown = 0;
  gameState.missionObjectives.capturedPoints = 0;
  gameState.keysPressed = {};
  
  // Reset capture points
  for (const point of gameState.capturePoints) {
    point.captured = false;
    point.captureProgress = 0;
  }
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function deployUnit(p) {
  if (gameState.energy < DEPLOY_COST) return;
  
  const worldX = gameState.cameraX + gameState.cursorX;
  const worldY = gameState.cameraY + gameState.cursorY;
  
  // Check if position is valid (not too close to other units)
  let validPosition = true;
  for (const unit of gameState.units) {
    const dist = Math.hypot(unit.x - worldX, unit.y - worldY);
    if (dist < 40) {
      validPosition = false;
      break;
    }
  }
  
  if (!validPosition) return;
  
  gameState.energy -= DEPLOY_COST;
  const unit = new Unit(worldX, worldY, gameState.selectedUnitType);
  gameState.units.push(unit);
  gameState.entities.push(unit);
  
  p.logs.game_info.push({
    data: { action: "DEPLOY_UNIT", type: gameState.selectedUnitType, x: worldX, y: worldY },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function cycleUnitType() {
  const types = [UNIT_COMMANDO, UNIT_SNIPER, UNIT_HEAVY];
  const currentIndex = types.indexOf(gameState.selectedUnitType);
  gameState.selectedUnitType = types[(currentIndex + 1) % types.length];
}