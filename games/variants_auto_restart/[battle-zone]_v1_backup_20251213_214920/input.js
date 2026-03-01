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

export function handleKeyPress(p, keyCode) {
  if (gameState.controlMode === "HUMAN") {
    switch (keyCode) {
      case KEY.UP:
        keys.up = true;
        break;
      case KEY.DOWN:
        keys.down = true;
        break;
      case KEY.LEFT:
        keys.left = true;
        break;
      case KEY.RIGHT:
        keys.right = true;
        break;
      case KEY.Z:
        keys.shoot = true;
        break;
      case KEY.SPACE:
        keys.sprint = true;
        break;
      case KEY.SHIFT:
        keys.crouch = true;
        break;
      case KEY.KEY_1:
        if (gameState.player) gameState.player.switchWeapon("pistol");
        break;
      case KEY.KEY_2:
        if (gameState.player) gameState.player.switchWeapon("rifle");
        break;
      case KEY.KEY_3:
        if (gameState.player) gameState.player.switchWeapon("shotgun");
        break;
      case KEY.KEY_4:
        if (gameState.player) gameState.player.switchWeapon("sniper");
        break;
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
      case KEY.SPACE:
        keys.sprint = false;
        break;
      case KEY.SHIFT:
        keys.crouch = false;
        break;
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