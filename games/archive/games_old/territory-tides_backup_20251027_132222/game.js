import { gameState, PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { mapData } from './maps.js';
import { Territory } from './territory.js';
import { Player } from './player.js';
import { AI } from './ai.js';
import { drawUI } from './ui.js';
import { handleKeyPressed } from './input.js';

const p5 = window.p5;
let gameInstance = null;

export function initializeLevel(levelNumber) {
  const levelData = mapData[levelNumber];
  if (!levelData) return;
  
  gameState.territories = [];
  gameState.continents = levelData.continents;
  
  for (let territoryData of levelData.territories) {
    const territory = new Territory(territoryData);
    gameState.territories.push(territory);
  }
  
  gameState.players = [];
  const playerColors = [
    [100, 150, 255],
    [255, 100, 100],
    [100, 255, 100],
    [255, 255, 100]
  ];
  
  const numPlayers = Math.max(...levelData.territories.map(t => t.ownerId)) + 1;
  for (let i = 0; i < numPlayers; i++) {
    const player = new Player(
      i,
      i === 0 ? "You" : `AI ${i}`,
      playerColors[i % playerColors.length],
      i !== 0
    );
    gameState.players.push(player);
  }
  
  gameState.currentPlayerId = 0;
  gameState.currentPhase = PHASE.REINFORCE;
  gameState.selectedTerritoryId1 = null;
  gameState.selectedTerritoryId2 = null;
  gameState.highlightedTerritoryIndex = 0;
  gameState.armiesToMove = 0;
  gameState.hasFortifiedThisTurn = false;
  gameState.combatResults = null;
  gameState.combatAnimationFrames = 0;
  
  const player = gameState.players[0];
  gameState.reinforcementPool = player.calculateReinforcements(gameState.territories, gameState.continents);
}

export function executeAITurns(p) {
  const ai = new AI(p);
  
  for (let i = 1; i < gameState.players.length; i++) {
    const player = gameState.players[i];
    if (player.isAI) {
      const territoriesOwned = player.getTerritoriesOwned(gameState.territories);
      if (territoriesOwned.length > 0) {
        gameState.currentPlayerId = i;
        gameState.reinforcementPool = player.calculateReinforcements(gameState.territories, gameState.continents);
        
        ai.takeTurn(player);
      }
    }
  }
  
  gameState.currentPlayerId = 0;
  gameState.currentPhase = PHASE.REINFORCE;
  gameState.turnNumber++;
  
  const player = gameState.players[0];
  const playerTerritories = player.getTerritoriesOwned(gameState.territories);
  
  if (playerTerritories.length === 0) {
    gameState.gamePhase = "GAME_OVER";
    updateHighScore();
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER", result: "LOSE" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.reinforcementPool = player.calculateReinforcements(gameState.territories, gameState.continents);
  }
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('territoryTidesHighScore', gameState.highScore.toString());
    }
  }
}

gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('territoryTidesHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    }
    
    p.logs.game_info.push({
      data: { gamePhase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 50, 60);
    
    if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      drawTerritories(p);
    }
    
    drawUI(p);
    
    if (gameState.combatResults) {
      gameState.combatAnimationFrames++;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
});

function drawTerritories(p) {
  const validTargets = getValidTargets();
  
  for (let i = 0; i < gameState.territories.length; i++) {
    const territory = gameState.territories[i];
    const isSelected1 = territory.id === gameState.selectedTerritoryId1;
    const isSelected2 = territory.id === gameState.selectedTerritoryId2;
    const isValidTarget = validTargets.includes(territory.id);
    const isHighlighted = i === gameState.highlightedTerritoryIndex;
    
    territory.draw(p, isSelected1, isSelected2, isValidTarget, isHighlighted);
  }
}

function getValidTargets() {
  const validTargets = [];
  
  if (gameState.selectedTerritoryId1 !== null) {
    const source = gameState.territories.find(t => t.id === gameState.selectedTerritoryId1);
    if (!source) return validTargets;
    
    if (gameState.currentPhase === PHASE.ATTACK) {
      for (let adjId of source.adjacentIds) {
        const adjTerritory = gameState.territories.find(t => t.id === adjId);
        if (adjTerritory && adjTerritory.ownerId !== gameState.currentPlayerId) {
          validTargets.push(adjId);
        }
      }
    } else if (gameState.currentPhase === PHASE.FORTIFY && !gameState.hasFortifiedThisTurn) {
      for (let adjId of source.adjacentIds) {
        const adjTerritory = gameState.territories.find(t => t.id === adjId);
        if (adjTerritory && adjTerritory.ownerId === gameState.currentPlayerId) {
          validTargets.push(adjId);
        }
      }
    }
  }
  
  return validTargets;
}

window.gameInstance = gameInstance;
window.getGameState = getGameState;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    const btn = document.getElementById('humanModeBtn');
    if (btn) btn.classList.add('active');
  } else if (mode === 'TEST_1') {
    const btn = document.getElementById('test_1_ModeBtn');
    if (btn) btn.classList.add('active');
    runTest1();
  } else if (mode === 'TEST_2') {
    const btn = document.getElementById('test_2_ModeBtn');
    if (btn) btn.classList.add('active');
    runTest2();
  }
};

function runTest1() {
  if (gameState.gamePhase === "START") {
    setTimeout(() => {
      gameInstance.keyPressed = function() { this.keyCode = 13; handleKeyPressed(this, '', 13); };
      gameInstance.keyPressed();
    }, 500);
  }
}

function runTest2() {
  if (gameState.gamePhase === "START") {
    setTimeout(() => {
      gameInstance.keyPressed = function() { this.keyCode = 13; handleKeyPressed(this, '', 13); };
      gameInstance.keyPressed();
      
      setTimeout(() => {
        for (let territory of gameState.territories) {
          if (territory.ownerId !== 0) {
            territory.changeOwner(0, 1);
          }
        }
        gameState.gamePhase = "GAME_OVER";
        gameState.currentLevel = 4;
      }, 1000);
    }, 500);
  }
}