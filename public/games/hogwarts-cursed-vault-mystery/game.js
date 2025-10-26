import { gameState, GAME_PHASES, PLAY_SUBSTATES, getGameState } from './globals.js';
import { Player } from './player.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed } from './input.js';
import { updateGameLogic, initializeYear, handleObjectClick } from './gameLogic.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    gameState.player = new Player();
    gameState.entities = [gameState.player];
    gameState.lastEnergyRegen = Date.now();
    
    initializeYear(p);
    
    p.logs.game_info.push({
      data: { phase: "START", initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
      updateGameLogic(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.mousePressed = function() {
    if (gameState.controlMode !== "HUMAN") return;
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.playSubstate === PLAY_SUBSTATES.EXPLORATION) {
      handleObjectClick(p.mouseX, p.mouseY, p);
    }
  };
});

window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};