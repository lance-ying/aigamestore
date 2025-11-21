import { KEY, gameState, nextLevel, resetToLevel1 } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';

export const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  sprint: false,
  crouch: false
};

// Track last key press time for certain actions
const keyPressTimes = {};
const KEY_REPEAT_DELAY = 100; // milliseconds

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    handleKeyPress(p, p.keyCode);
    
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    return !(Object.values(KEY).includes(p.keyCode));
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p, p.keyCode);
    
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    return !(Object.values(KEY).includes(p.keyCode));
  };
}

function checkCollisionWithRect(circleX, circleY, circleRadius, rectX, rectY, rectWidth, rectHeight) {
  const closestX = Math.max(rectX, Math.min(circleX, rectX + rectWidth));
  const closestY = Math.max(rectY, Math.min(circleY, rectY + rectHeight));
  const distanceX = circleX - closestX;
  const distanceY = circleY - closestY;
  return (distanceX * distanceX + distanceY * distanceY) < (circleRadius * circleRadius);
}

export function canMoveTo(x, y, radius) {
  // Check level boundaries
  if (x - radius < 0 || x + radius > gameState.level.width ||
      y - radius < 0 || y + radius > gameState.level.height) {
    return false;
  }
  
  // Check obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (checkCollisionWithRect(x, y, radius, obstacle.x, obstacle.y, obstacle.width, obstacle.height)) {
      return false;
    }
  }
  
  return true;
}

export function handleKeyPress(p, keyCode) {
  const now = Date.now();
  
  if (gameState.controlMode === "HUMAN") {
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
      const player = gameState.player;
      const dashDistance = 40; // Dash distance for sprint
      
      switch (keyCode) {
        case KEY.UP:
          keys.up = true;
          player.direction = -Math.PI / 2; // Face up
          break;
        case KEY.DOWN:
          keys.down = true;
          player.direction = Math.PI / 2; // Face down
          break;
        case KEY.LEFT:
          keys.left = true;
          player.direction = Math.PI; // Face left
          break;
        case KEY.RIGHT:
          keys.right = true;
          player.direction = 0; // Face right
          break;
        case KEY.Z:
          keys.shoot = true;
          break;
        case KEY.SPACE:
          // Prevent dash spam
          if (!keyPressTimes[KEY.SPACE] || now - keyPressTimes[KEY.SPACE] > KEY_REPEAT_DELAY) {
            keyPressTimes[KEY.SPACE] = now;
            // Sprint dash in current facing direction
            const newX = player.x + Math.cos(player.direction) * dashDistance;
            const newY = player.y + Math.sin(player.direction) * dashDistance;
            if (canMoveTo(newX, newY, player.radius)) {
              player.x = newX;
              player.y = newY;
            }
          }
          break;
        case KEY.SHIFT:
          // Prevent toggle spam
          if (!keyPressTimes[KEY.SHIFT] || now - keyPressTimes[KEY.SHIFT] > KEY_REPEAT_DELAY) {
            keyPressTimes[KEY.SHIFT] = now;
            // Toggle crouch state
            player.isCrouching = !player.isCrouching;
          }
          break;
        case KEY.KEY_1:
          player.switchWeapon("pistol");
          break;
        case KEY.KEY_2:
          player.switchWeapon("rifle");
          break;
        case KEY.KEY_3:
          player.switchWeapon("shotgun");
          break;
        case KEY.KEY_4:
          player.switchWeapon("sniper");
          break;
      }
    }
    
    // Handle game state transitions
    switch (keyCode) {
      case KEY.ENTER:
        if (gameState.gamePhase === "START") {
          startGame(p);
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
          // Progress to next level
          nextLevel();
          generateLevel(p);
          gameState.player = new Player(gameState.level.width / 2, gameState.level.height / 2);
          gameState.gamePhase = "PLAYING";
          
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": { "level": gameState.currentLevel },
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
      case KEY.ESC:
        if (gameState.gamePhase === "PLAYING") {
          pauseGame(p);
        } else if (gameState.gamePhase === "PAUSED") {
          resumeGame(p);
        }
        break;
      case KEY.R:
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
          resetToStart(p);
        }
        break;
    }
  }
}

export function handleKeyRelease(p, keyCode) {
  if (gameState.controlMode === "HUMAN") {
    switch (keyCode) {
      case KEY.UP:
        keys.up = false;
        break;
      case KEY.DOWN:
        keys.down = false;
        break;
      case KEY.LEFT:
        keys.left = false;
        break;
      case KEY.RIGHT:
        keys.right = false;
        break;
      case KEY.Z:
        keys.shoot = false;
        break;
    }
  }
}

export function handleAutomatedInputs(p) {
  if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
    const action = window.game_testing_controller(gameState);
    
    // Clear all keys first
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    keys.shoot = false;
    keys.sprint = false;
    keys.crouch = false;
    
    if (action !== null && gameState.player) {
      const player = gameState.player;
      const dashDistance = 40;
      
      switch (action) {
        case KEY.UP:
          keys.up = true;
          player.direction = -Math.PI / 2;
          break;
        case KEY.DOWN:
          keys.down = true;
          player.direction = Math.PI / 2;
          break;
        case KEY.LEFT:
          keys.left = true;
          player.direction = Math.PI;
          break;
        case KEY.RIGHT:
          keys.right = true;
          player.direction = 0;
          break;
        case KEY.Z:
          keys.shoot = true;
          break;
        case KEY.SPACE:
          {
            const newX = player.x + Math.cos(player.direction) * dashDistance;
            const newY = player.y + Math.sin(player.direction) * dashDistance;
            if (canMoveTo(newX, newY, player.radius)) {
              player.x = newX;
              player.y = newY;
            }
          }
          break;
        case KEY.SHIFT:
          player.isCrouching = !player.isCrouching;
          break;
      }
    }
  }
}

export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function resetToStart(p) {
  resetToLevel1();
  gameState.gamePhase = "START";
  
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}