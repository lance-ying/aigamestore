// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { loadPuzzle, checkWinCondition, updatePuzzleLogic, getCurrentPuzzle } from './puzzle.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed, processTestingInput } from './input.js';

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
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.highScore = 0;
    
    // Load first puzzle
    loadPuzzle(0);
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Process automated testing input if needed
    if (gameState.controlMode !== "HUMAN") {
      processTestingInput(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        drawPlayingScreen(p);
        
        // Update puzzle logic
        if (!gameState.showTransition) {
          updatePuzzleLogic(p);
          
          // Check win condition
          if (!gameState.puzzleSolved && checkWinCondition(p)) {
            onPuzzleSolved(p);
          }
        }
        
        // Update transition
        if (gameState.showTransition) {
          gameState.transitionTimer++;
          if (gameState.transitionTimer >= gameState.transitionDuration) {
            gameState.showTransition = false;
            gameState.transitionTimer = 0;
            
            // Load next puzzle or end game
            const nextIndex = gameState.currentPuzzleIndex + 1;
            const loaded = loadPuzzle(nextIndex);
            
            if (!loaded) {
              // Game complete!
              gameState.gamePhase = "GAME_OVER_WIN";
              if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
              }
              p.logs.game_info.push({
                data: { phase: "GAME_OVER_WIN", finalScore: gameState.score },
                framecount: p.frameCount,
                timestamp: Date.now()
              });
            }
          }
        }
        break;
        
      case "PAUSED":
        drawPausedScreen(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: CANVAS_WIDTH / 2,
        screen_y: CANVAS_HEIGHT / 2,
        game_x: CANVAS_WIDTH / 2,
        game_y: CANVAS_HEIGHT / 2,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
  
  function onPuzzleSolved(p) {
    gameState.puzzleSolved = true;
    
    // Calculate score
    let points = 100;
    if (gameState.hintUsedCount === 0) {
      points += 50; // No hint bonus
    }
    
    gameState.score += points;
    
    // Show transition
    const puzzle = getCurrentPuzzle();
    gameState.transitionMessage = `Puzzle ${gameState.currentPuzzleIndex + 1} Complete!`;
    gameState.showTransition = true;
    gameState.transitionTimer = 0;
    
    p.logs.game_info.push({
      data: { 
        event: "puzzle_solved", 
        puzzleId: puzzle.id,
        pointsEarned: points,
        totalScore: gameState.score 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Set control mode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};