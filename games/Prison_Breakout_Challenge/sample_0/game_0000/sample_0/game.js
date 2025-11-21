// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, saveHighScore } from './globals.js';
import { Player } from './player.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderStart, renderPlaying, renderGameOver, renderLevelComplete } from './render.js';
import { createLevel1, createLevel2, createLevel3 } from './levels.js';
import { getTestAction } from './ai.js';

const p5 = window.p5;
let cameraX = 0;

export function initLevel(p, levelNum) {
  let levelData;
  
  if (levelNum === 1) {
    levelData = createLevel1();
  } else if (levelNum === 2) {
    levelData = createLevel2();
  } else if (levelNum === 3) {
    levelData = createLevel3();
  }
  
  gameState.platforms = levelData.platforms;
  gameState.objectives = levelData.objectives;
  gameState.guards = levelData.guards;
  gameState.entities = [...gameState.guards];
  gameState.player = new Player(levelData.playerStart.x, levelData.playerStart.y);
  gameState.entities.push(gameState.player);
  gameState.timer = 180;
  gameState.keysCollected = 0;
  gameState.objectivesCompleted = 0;
  gameState.totalObjectives = gameState.objectives.filter(o => o.type !== "EXIT").length;
  
  cameraX = 0;
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initial game state log
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle AI control
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = getTestAction(p);
      if (action && gameState.player) {
        if (action.moveLeft) gameState.player.moveLeft();
        if (action.moveRight) gameState.player.moveRight();
        if (action.jump) gameState.player.jump();
        if (action.interact) gameState.player.interact();
      }
    }
    
    if (gameState.gamePhase === "START") {
      renderStart(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      // Update game (not when paused)
      if (gameState.gamePhase === "PLAYING") {
        updateGame(p);
      }
      
      // Always render
      renderPlaying(p, cameraX);
    } else if (gameState.gamePhase === "GAME_OVER") {
      renderGameOver(p);
    } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
      renderLevelComplete(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      if (gameState.player) {
        if (p.keyCode === 90) { // Z
          gameState.player.interact();
        }
      }
    }
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

function updateGame(p) {
  // Update timer
  const currentTime = Date.now();
  const elapsedSeconds = (currentTime - gameState.levelStartTime) / 1000;
  gameState.timer = Math.max(0, 180 - elapsedSeconds);
  
  if (gameState.timer <= 0) {
    gameState.gamePhase = "GAME_OVER";
    gameState.gameOverReason = "TIMEOUT";
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      saveHighScore();
    }
    p.logs.game_info.push({
      data: { phase: "GAME_OVER", reason: "TIMEOUT" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Handle keyboard input for human mode
  if (gameState.controlMode === "HUMAN" && gameState.player) {
    if (p.keyIsDown(65) || p.keyIsDown(37)) { // A or LEFT
      gameState.player.moveLeft();
    }
    if (p.keyIsDown(68) || p.keyIsDown(39)) { // D or RIGHT
      gameState.player.moveRight();
    }
    if (p.keyIsDown(32)) { // SPACE
      gameState.player.jump();
    }
  }
  
  // Update player
  if (gameState.player) {
    const prevX = gameState.player.x;
    const prevY = gameState.player.y;
    
    gameState.player.update(p);
    
    // Log player position changes
    if (p.frameCount % 30 === 0 || Math.abs(prevX - gameState.player.x) > 5 || Math.abs(prevY - gameState.player.y) > 5) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - cameraX,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Update guards
  for (let guard of gameState.guards) {
    guard.update(p);
    
    // Check collision with player
    if (guard.checkPlayerCollision()) {
      gameState.gamePhase = "GAME_OVER";
      gameState.gameOverReason = "CAUGHT";
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore();
      }
      p.logs.game_info.push({
        data: { phase: "GAME_OVER", reason: "CAUGHT" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Update objectives
  for (let obj of gameState.objectives) {
    obj.update(p);
  }
  
  // Check exit condition
  if (gameState.player) {
    for (let obj of gameState.objectives) {
      if (obj.type === "EXIT") {
        const dist = Math.hypot(
          gameState.player.x + gameState.player.width/2 - obj.x,
          gameState.player.y + gameState.player.height/2 - obj.y
        );
        if (dist < 60 && gameState.objectivesCompleted >= gameState.totalObjectives) {
          // Level complete!
          const timeBonus = Math.floor(gameState.timer) * 10;
          gameState.score += timeBonus;
          gameState.score += 500; // Level completion bonus
          
          gameState.gamePhase = "LEVEL_COMPLETE";
          p.logs.game_info.push({
            data: { phase: "LEVEL_COMPLETE", level: gameState.level },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          return;
        }
      }
    }
  }
  
  // Update camera to follow player
  if (gameState.player) {
    const targetCameraX = gameState.player.x - CANVAS_WIDTH / 2 + gameState.player.width / 2;
    cameraX += (targetCameraX - cameraX) * 0.1;
    cameraX = Math.max(0, cameraX);
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Set control mode function
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' :
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};