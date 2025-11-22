// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, STYLES, SATISFACTION_DECAY_RATE, SATISFACTION_IDLE_THRESHOLD } from './globals.js';
import { handleKeyPressed } from './input.js';
import { drawStartScreen, drawGameUI, drawPausedOverlay, drawGameOverScreen, drawLevelCompleteOverlay, drawComboAnimation } from './ui.js';
import { AIController } from './ai.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let aiController;
  
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
    
    // Initialize AI controller
    aiController = new AIController();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Background
    if (gameState.gamePhase === "PLAYING") {
      const style = STYLES[gameState.currentStyleId];
      p.background(...style.colors.bg);
    } else {
      p.background(30, 40, 60);
    }
    
    // Handle AI input
    if (gameState.controlMode !== "HUMAN") {
      const action = aiController.getAction(p);
      if (action) {
        handleKeyPressed(p, p.key, action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      drawPlayingState(p);
    } else if (gameState.gamePhase === "PAUSED") {
      drawPlayingState(p);
      drawPausedOverlay(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p, false);
    }
  };
  
  function drawPlayingState(p) {
    // Update entities
    gameState.beatboxers.forEach(b => b.update());
    
    // Draw beatboxers
    gameState.beatboxers.forEach((b, i) => {
      b.draw(i === gameState.focusedBeatboxerIndex);
    });
    
    // Draw icons bar background
    p.fill(50, 50, 80);
    p.noStroke();
    p.rect(0, 330, CANVAS_WIDTH, 70);
    
    // Draw icons
    gameState.availableIcons.forEach((icon, i) => {
      icon.draw(i === gameState.focusedIconIndex);
    });
    
    // Draw picked up icon
    if (gameState.pickedUpIcon !== null) {
      const icon = gameState.availableIcons.find(ic => ic.id === gameState.pickedUpIcon);
      if (icon) {
        p.push();
        p.translate(p.mouseX || CANVAS_WIDTH / 2, p.mouseY || CANVAS_HEIGHT / 2);
        p.scale(0.8);
        p.fill(255, 255, 255, 150);
        p.noStroke();
        p.rect(-25, -25, 50, 50, 5);
        p.pop();
      }
    }
    
    // Draw UI
    drawGameUI(p);
    
    // Update satisfaction meter
    if (gameState.gamePhase === "PLAYING" && !gameState.showLevelComplete) {
      const timeSinceInteraction = Date.now() - gameState.lastInteractionTime;
      if (timeSinceInteraction > SATISFACTION_IDLE_THRESHOLD) {
        gameState.satisfactionMeter -= SATISFACTION_DECAY_RATE;
        
        if (gameState.satisfactionMeter <= 0) {
          gameState.satisfactionMeter = 0;
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", reason: "satisfaction_depleted" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Award points for active mix
      const activeBeatboxers = gameState.beatboxers.filter(b => 
        b.assignedIconId !== null && !b.isMuted
      );
      if (activeBeatboxers.length > 0 && p.frameCount % 60 === 0) {
        gameState.score += 5;
      }
    }
    
    // Update and draw combo animation
    if (gameState.comboAnimationActive) {
      drawComboAnimation(p);
      gameState.comboAnimationTimer++;
      if (gameState.comboAnimationTimer >= 120) {
        gameState.comboAnimationActive = false;
        gameState.comboAnimationTimer = 0;
      }
    }
    
    // Draw level complete overlay
    if (gameState.showLevelComplete) {
      drawLevelCompleteOverlay(p);
      gameState.levelCompleteTimer++;
    }
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  if (gameInstance.aiController) {
    gameInstance.aiController.setTestMode(mode);
  }
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonId = mode === "HUMAN" ? "humanModeBtn" : 
                   mode === "TEST_1" ? "test_1_ModeBtn" :
                   mode === "TEST_2" ? "test_2_ModeBtn" : null;
  
  if (buttonId) {
    const button = document.getElementById(buttonId);
    if (button) button.classList.add('active');
  }
};

export default gameInstance;