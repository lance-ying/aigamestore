// game_logic.js - Core game logic and mechanics

import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  STATE_MAIN_MENU, STATE_CREATING_GAME, STATE_ALLOCATING_POINTS, STATE_DEVELOPING,
  STATE_REVIEWING, STATE_RESEARCH_MENU,
  WIN_MONEY_THRESHOLD, LOSE_MONEY_THRESHOLD, LOSE_REPUTATION_THRESHOLD
} from './globals.js';
import { Game, Particle } from './entities.js';

export function updateGame(p) {
  gameState.frameCount++;
  
  // Update time
  if (gameState.frameCount % 60 === 0 && gameState.playingState !== STATE_DEVELOPING) {
    gameState.week++;
    if (gameState.week > 52) {
      gameState.week = 1;
      gameState.year++;
    }
  }
  
  // Check win/lose conditions
  checkGameOverConditions();
  
  // Update based on playing state
  switch (gameState.playingState) {
    case STATE_DEVELOPING:
      updateDevelopment(p);
      break;
    case STATE_REVIEWING:
      updateReview();
      break;
  }
  
  // Update particles
  if (gameState.entities) {
    gameState.entities = gameState.entities.filter(entity => {
      if (entity.update && entity !== gameState.player) {
        return entity.update();
      }
      return true;
    });
  }
}

function checkGameOverConditions() {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Win condition
  if (gameState.money >= WIN_MONEY_THRESHOLD && gameState.reputation > 30) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    createWinParticles();
    logGameInfo("GAME_OVER_WIN");
  }
  
  // Lose conditions
  if (gameState.money <= LOSE_MONEY_THRESHOLD || gameState.reputation <= LOSE_REPUTATION_THRESHOLD) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    logGameInfo("GAME_OVER_LOSE");
  }
}

function updateDevelopment(p) {
  const speed = gameState.fastForward ? 5 : 1;
  gameState.developmentProgress += speed;
  
  if (gameState.developmentProgress >= gameState.developmentDuration) {
    // Development complete
    finishDevelopment();
  }
}

function finishDevelopment() {
  const game = gameState.gameInDevelopment;
  
  // Calculate score and revenue
  game.calculateScore();
  game.calculateRevenue();
  
  // Apply costs
  gameState.money -= game.developmentCost;
  gameState.money += game.revenue;
  
  // Update reputation
  if (game.score >= 70) {
    gameState.reputation += 5;
    gameState.reviewText = "A masterpiece! Critics love it!";
  } else if (game.score >= 50) {
    gameState.reputation += 2;
    gameState.reviewText = "A solid game with good potential.";
  } else if (game.score >= 30) {
    gameState.reputation -= 1;
    gameState.reviewText = "Mixed reviews. Some good ideas.";
  } else {
    gameState.reputation -= 3;
    gameState.reviewText = "Critics are disappointed.";
  }
  
  // Cap reputation
  gameState.reputation = Math.max(0, Math.min(100, gameState.reputation));
  
  // Save completed game
  gameState.currentGame = game;
  gameState.completedGames.push(game);
  gameState.gamesCreated++;
  
  // Move to review state
  gameState.playingState = STATE_REVIEWING;
  gameState.reviewTimer = 0;
  gameState.gameInDevelopment = null;
  
  logGameInfo("game_complete", { score: game.score, revenue: game.revenue });
}

function updateReview() {
  gameState.reviewTimer++;
}

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.playingState = STATE_MAIN_MENU;
  logGameInfo("game_start");
}

export function pauseGame() {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    logGameInfo("game_paused");
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    logGameInfo("game_resumed");
  }
}

export function restartGame() {
  // Reset to initial state
  gameState.money = 1000;
  gameState.reputation = 50;
  gameState.gamePhase = PHASE_START;
  gameState.playingState = STATE_MAIN_MENU;
  gameState.menuSelection = 0;
  gameState.gamesCreated = 0;
  gameState.completedGames = [];
  gameState.year = 1980;
  gameState.week = 1;
  gameState.currentGame = null;
  gameState.gameInDevelopment = null;
  gameState.developmentProgress = 0;
  gameState.entities = gameState.entities.filter(e => e === gameState.player);
  
  // Reset technologies
  gameState.technologies = gameState.technologies.map(t => ({ ...t, researched: false }));
  gameState.gameTypes = gameState.gameTypes.map((t, i) => ({ ...t, unlocked: i < 2 }));
  
  logGameInfo("game_restart");
}

export function handleMainMenuSelection() {
  switch (gameState.menuSelection) {
    case 0: // Create New Game
      gameState.playingState = STATE_CREATING_GAME;
      gameState.menuSelection = 0;
      break;
    case 1: // Research Technology
      gameState.playingState = STATE_RESEARCH_MENU;
      gameState.menuSelection = 0;
      break;
    case 2: // View Statistics (already handled by Shift key)
      // Could open a persistent stats view, but we use Shift for now
      break;
  }
}

export function handleGameTypeSelection() {
  const availableTypes = gameState.gameTypes.filter(gt => gt.unlocked);
  const selectedType = availableTypes[gameState.menuSelection];
  
  // Create new game template
  gameState.currentGame = {
    type: selectedType.name,
    design: 0,
    tech: 0,
    marketing: 0
  };
  
  // Reset allocation
  gameState.designPoints = 30;
  gameState.techPoints = 30;
  gameState.marketingPoints = 30;
  gameState.allocationFocus = 0;
  
  // Move to allocation state
  gameState.playingState = STATE_ALLOCATING_POINTS;
}

export function handlePointAllocation(direction) {
  const increment = 10;
  
  if (direction === 'left') {
    // Decrease current focus
    switch (gameState.allocationFocus) {
      case 0:
        if (gameState.designPoints >= increment) {
          gameState.designPoints -= increment;
        }
        break;
      case 1:
        if (gameState.techPoints >= increment) {
          gameState.techPoints -= increment;
        }
        break;
      case 2:
        if (gameState.marketingPoints >= increment) {
          gameState.marketingPoints -= increment;
        }
        break;
    }
  } else if (direction === 'right') {
    // Increase current focus
    const total = gameState.designPoints + gameState.techPoints + gameState.marketingPoints;
    if (total < gameState.totalPointsAvailable) {
      switch (gameState.allocationFocus) {
        case 0:
          gameState.designPoints = Math.min(gameState.designPoints + increment, 
            gameState.totalPointsAvailable - gameState.techPoints - gameState.marketingPoints);
          break;
        case 1:
          gameState.techPoints = Math.min(gameState.techPoints + increment,
            gameState.totalPointsAvailable - gameState.designPoints - gameState.marketingPoints);
          break;
        case 2:
          gameState.marketingPoints = Math.min(gameState.marketingPoints + increment,
            gameState.totalPointsAvailable - gameState.designPoints - gameState.techPoints);
          break;
      }
    }
  }
}

export function confirmAllocation() {
  const total = gameState.designPoints + gameState.techPoints + gameState.marketingPoints;
  
  if (total === 0) {
    return; // Can't start with no allocation
  }
  
  // Create the actual game object
  const game = new Game(
    `${gameState.currentGame.type} Game #${gameState.gamesCreated + 1}`,
    gameState.currentGame.type,
    gameState.designPoints,
    gameState.techPoints,
    gameState.marketingPoints
  );
  
  // Check if can afford
  if (gameState.money < game.developmentCost) {
    return; // Can't afford
  }
  
  gameState.gameInDevelopment = game;
  gameState.developmentProgress = 0;
  gameState.playingState = STATE_DEVELOPING;
}

export function handleResearchSelection() {
  const availableTech = gameState.technologies.filter(t => !t.researched);
  
  if (availableTech.length === 0) {
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
    return;
  }
  
  const selectedTech = availableTech[gameState.menuSelection];
  
  // Check if can afford
  if (gameState.money >= selectedTech.cost) {
    gameState.money -= selectedTech.cost;
    
    // Mark as researched
    const techIndex = gameState.technologies.findIndex(t => t.name === selectedTech.name);
    gameState.technologies[techIndex].researched = true;
    
    // Unlock game type
    const typeIndex = gameState.gameTypes.findIndex(t => t.name === selectedTech.unlocks);
    if (typeIndex !== -1) {
      gameState.gameTypes[typeIndex].unlocked = true;
    }
    
    logGameInfo("research_complete", { tech: selectedTech.name });
    
    // Return to main menu
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
  }
}

function createWinParticles() {
  // Create celebration particles
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = -20;
    const vx = (Math.random() - 0.5) * 5;
    const vy = Math.random() * 3 + 2;
    const life = Math.floor(Math.random() * 60) + 60;
    const colors = [[255, 100, 100], [100, 255, 100], [100, 100, 255], [255, 255, 100]];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    gameState.entities.push(new Particle(x, y, vx, vy, life, color));
  }
}

function logGameInfo(eventType, data = {}) {
  if (typeof window !== 'undefined' && window.gameInstance) {
    const p = window.gameInstance;
    p.logs.game_info.push({
      event: eventType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function logPlayerInfo() {
  if (typeof window !== 'undefined' && window.gameInstance && gameState.player) {
    const p = window.gameInstance;
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}