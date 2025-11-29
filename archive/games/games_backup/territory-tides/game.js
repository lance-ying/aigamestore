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
  gameState.floatingTexts = [];
  gameState.particles = [];
  gameState.territoryFlashes = [];
  
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
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('gameContainer');
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
      drawParticles(p);
      drawFloatingTexts(p);
    }
    
    drawUI(p);
    
    if (gameState.combatResults) {
      gameState.combatAnimationFrames++;
    }
    
    // Update phase transition animation
    if (gameState.phaseTransitionAnimation > 0) {
      gameState.phaseTransitionAnimation--;
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

function drawParticles(p) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    
    p.push();
    p.noStroke();
    const alpha = 255 * (1 - particle.age / particle.maxAge);
    p.fill(...particle.color, alpha);
    p.circle(particle.x, particle.y, particle.size);
    p.pop();
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.2; // gravity
    particle.age++;
    
    if (particle.age >= particle.maxAge) {
      gameState.particles.splice(i, 1);
    }
  }
}

function drawFloatingTexts(p) {
  for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
    const text = gameState.floatingTexts[i];
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.strokeWeight(3);
    p.stroke(0);
    const alpha = 255 * (1 - text.age / text.maxAge);
    p.fill(...text.color, alpha);
    p.text(text.text, text.x, text.y);
    p.pop();
    
    text.y -= 1.5;
    text.age++;
    
    if (text.age >= text.maxAge) {
      gameState.floatingTexts.splice(i, 1);
    }
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

export function createFloatingText(text, x, y, color = [255, 255, 255]) {
  gameState.floatingTexts.push({
    text: text,
    x: x,
    y: y,
    color: color,
    age: 0,
    maxAge: 60
  });
}

export function createParticles(x, y, count, color = [255, 255, 255]) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    gameState.particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: Math.random() * 4 + 2,
      color: color,
      age: 0,
      maxAge: 40
    });
  }
}

window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode
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