import { gameState, GAME_PHASES, getGameState } from './globals.js';
import { initializeLevel, checkWinCondition } from './gameLogic.js';
import { drawStartScreen, drawLevelIntro, drawPlayingScreen, drawGameOver, drawHighScores } from './rendering.js';
import { handleKeyPressed, processAITurn } from './input.js';
import { updateTestingMode } from './testing.js';

const p5 = window.p5;

let levelIntroTimer = 0;
const LEVEL_INTRO_DURATION = 120;

let gameInstance = new p5(p => {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_INTRO) {
      drawLevelIntro(p);
      
      if (levelIntroTimer === 0) {
        initializeLevel(gameState.currentLevel, p);
        levelIntroTimer = 1;
      }
      
      levelIntroTimer++;
      if (levelIntroTimer > LEVEL_INTRO_DURATION) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        levelIntroTimer = 0;
        
        if (p.logs) {
          p.logs.game_info.push({
            data: { phase: 'PLAYING' },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlayingScreen(p);
      
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        processAITurn(p);
        updateTestingMode(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameOver(p, true);
      
      if (p.logs && p.frameCount % 60 === 0) {
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_WIN', score: gameState.score, level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOver(p, false);
      
      if (p.logs && p.frameCount % 60 === 0) {
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_LOSE', score: gameState.score, level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_COMPLETE) {
      drawGameOver(p, true);
      
      if (p.logs && p.frameCount % 60 === 0) {
        p.logs.game_info.push({
          data: { phase: 'GAME_COMPLETE', score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.HIGH_SCORES) {
      drawHighScores(p);
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};