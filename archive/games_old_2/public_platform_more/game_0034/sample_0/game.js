// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { Player } from './player.js';
import { renderScene, renderUI } from './scene_renderer.js';
import { handleKeyPressed } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Initialize player
    gameState.player = new Player();
    gameState.entities = [gameState.player];
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 40, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.framesSinceLastInput++;
      
      if (gameState.framesSinceLastInput > 10) {
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
          handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
        }
      }
    }
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      
      case GAME_PHASES.PLAYING:
        renderScene(p, gameState.currentScene);
        renderUI(p);
        break;
      
      case GAME_PHASES.PAUSED:
        renderScene(p, gameState.currentScene);
        renderUI(p);
        renderPauseOverlay(p);
        break;
      
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
  
  function renderStartScreen(p) {
    p.background(20, 15, 30);
    
    // Animated mist
    p.fill(100, 120, 150, 30);
    p.noStroke();
    for (let i = 0; i < 5; i++) {
      const offset = (p.frameCount * 0.5 + i * 50) % 500;
      p.ellipse(300, offset - 50, 700, 150);
    }
    
    // Title
    p.fill(255, 230, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("THE LOST CITY", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.fill(180, 160, 120);
    p.textSize(16);
    p.text("A Mystery Adventure", CANVAS_WIDTH / 2, 130);
    
    // Description box
    p.fill(40, 35, 50, 200);
    p.noStroke();
    p.rect(80, 160, CANVAS_WIDTH - 160, 130, 10);
    
    p.fill(220, 220, 230);
    p.textSize(13);
    p.textAlign(p.CENTER, p.TOP);
    const desc = "Explore the mysterious Lost City shrouded in ancient mist.\nUncover secrets, solve puzzles, and restore the power crystal.\n\nFind all three celestial artifacts:\nSun Medallion, Moon Stone, and Star Gem";
    p.text(desc, CANVAS_WIDTH / 2, 175);
    
    // Controls
    p.fill(40, 35, 50, 200);
    p.rect(80, 310, CANVAS_WIDTH - 160, 50, 10);
    
    p.fill(200, 200, 210);
    p.textSize(12);
    p.text("Arrows: Navigate | Space: Interact | Z: Inventory | Shift: Journal", CANVAS_WIDTH / 2, 325);
    
    // Start prompt
    p.fill(255, 255, 150);
    p.textSize(18);
    const alpha = 150 + 105 * p.sin(p.frameCount * 0.05);
    p.fill(255, 255, 150, alpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  }
  
  function renderPauseOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  function renderGameOverScreen(p) {
    p.background(20, 20, 30);
    
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    
    // Animated background
    if (isWin) {
      p.fill(255, 215, 0, 20);
      p.noStroke();
      for (let i = 0; i < 10; i++) {
        const size = 50 + (p.frameCount * 2 + i * 30) % 500;
        p.circle(300, 200, size);
      }
    }
    
    // Title
    p.fill(...(isWin ? [255, 215, 0] : [200, 100, 100]));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(42);
    p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Message
    p.fill(220, 220, 230);
    p.textSize(16);
    if (isWin) {
      p.text("You restored the Power Crystal!", CANVAS_WIDTH / 2, 150);
      p.text("The Lost City's magic has been awakened!", CANVAS_WIDTH / 2, 180);
    } else {
      p.text("The city remains shrouded in mystery...", CANVAS_WIDTH / 2, 150);
    }
    
    // Score
    p.fill(255, 255, 150);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    
    // Statistics
    p.fill(180, 180, 190);
    p.textSize(14);
    p.text(`Artifacts Found: ${gameState.artifacts}/3`, CANVAS_WIDTH / 2, 270);
    p.text(`Scenes Explored: ${gameState.unlockedScenes.length}`, CANVAS_WIDTH / 2, 295);
    p.text(`Puzzles Solved: ${gameState.puzzlesSolved.length}`, CANVAS_WIDTH / 2, 320);
    
    // Restart prompt
    const alpha = 150 + 105 * p.sin(p.frameCount * 0.05);
    p.fill(200, 200, 255, alpha);
    p.textSize(16);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 365);
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Expose getGameState
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = mode === "HUMAN" ? "humanModeBtn" : 
                    mode === "TEST_1" ? "test_1_ModeBtn" :
                    mode === "TEST_2" ? "test_2_ModeBtn" : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add("active");
    }
  }
};