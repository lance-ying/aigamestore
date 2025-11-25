// game_logic.js - Core game logic and turn management

import { gameState, GAME_PHASES, PLAY_PHASES, RACES, ABILITIES } from './globals.js';
import { Player } from './player.js';
import { generateRaceCombos } from './race_combo.js';
import { createHexGrid, getAdjacentTerritories, isAdjacent } from './territory.js';
import { AIController } from './ai.js';

export function initializeGame(p) {
  // Create players
  gameState.players = [
    new Player(0, false), // Human player
    new Player(1, true)   // AI player
  ];
  
  // Initialize AI controllers
  gameState.aiControllers = [
    null,
    new AIController(1)
  ];
  
  // Create hex grid
  gameState.territories = createHexGrid(2);
  
  // Calculate screen positions
  const hexSize = 35;
  const offsetX = 300;
  const offsetY = 200;
  
  gameState.territories.forEach(territory => {
    territory.calculateScreenPosition(hexSize, offsetX, offsetY);
  });
  
  // Generate race combinations
  gameState.availableRaceCombos = generateRaceCombos(6);
  
  // Set initial state
  gameState.currentRound = 1;
  gameState.currentPlayer = 0;
  gameState.playPhase = PLAY_PHASES.SELECT_RACE;
  gameState.selectedTerritory = null;
  gameState.selectedRaceCombo = null;
  gameState.tokensToPlace = 0;
  gameState.deploymentHistory = [];
  gameState.turnPhase = "SELECTING";
  
  // Player starts with selecting race
  gameState.player = gameState.players[0];
  
  // Set message
  gameState.currentMessage = "Select a race combination (Arrow Keys + Space)";
  
  // Log initialization
  p.logs.game_info.push({
    data: { phase: "GAME_INITIALIZED", round: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startPlayerTurn(p) {
  const player = gameState.players[gameState.currentPlayer];
  
  if (player.isAI) {
    gameState.playPhase = PLAY_PHASES.AI_TURN;
    gameState.turnPhase = "AI_THINKING";
  } else {
    if (player.activeRace === null) {
      gameState.playPhase = PLAY_PHASES.SELECT_RACE;
      gameState.turnPhase = "SELECTING";
      gameState.currentMessage = "Select a race combination";
    } else {
      gameState.playPhase = PLAY_PHASES.DEPLOY_TOKENS;
      gameState.turnPhase = "DEPLOYING";
      gameState.tokensToPlace = player.availableTokens;
      gameState.currentMessage = `Deploy ${gameState.tokensToPlace} tokens (Shift to decline)`;
    }
  }
  
  p.logs.game_info.push({
    data: { phase: "TURN_START", player: gameState.currentPlayer, round: gameState.currentRound },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function endPlayerTurn(p) {
  const player = gameState.players[gameState.currentPlayer];
  
  // Clear deployment history
  gameState.deploymentHistory = [];
  
  // Move to next player
  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.numPlayers;
  
  // Check if round is complete
  if (gameState.currentPlayer === 0) {
    endRound(p);
  } else {
    startPlayerTurn(p);
  }
}

export function endRound(p) {
  // Score points for all players
  gameState.players.forEach(player => {
    const points = player.scorePoints(gameState.territories);
    p.logs.game_info.push({
      data: { phase: "SCORING", player: player.index, points, totalScore: player.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  });
  
  gameState.currentRound++;
  
  // Check if game is over
  if (gameState.currentRound > gameState.maxRounds) {
    endGame(p);
  } else {
    // Refresh race combos for new round
    gameState.availableRaceCombos = generateRaceCombos(6);
    startPlayerTurn(p);
  }
  
  p.logs.game_info.push({
    data: { phase: "ROUND_END", round: gameState.currentRound - 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function endGame(p) {
  // Determine winner
  const scores = gameState.players.map(p => p.score);
  const maxScore = Math.max(...scores);
  const playerScore = gameState.players[0].score;
  
  if (playerScore === maxScore) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
  
  p.logs.game_info.push({
    data: { 
      phase: "GAME_OVER", 
      winner: gameState.gamePhase,
      scores: scores
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function selectRaceCombo(p, comboIndex) {
  const player = gameState.players[gameState.currentPlayer];
  const combo = gameState.availableRaceCombos[comboIndex];
  
  if (!combo) return false;
  
  player.selectRaceCombo(combo);
  gameState.availableRaceCombos.splice(comboIndex, 1);
  
  gameState.playPhase = PLAY_PHASES.DEPLOY_TOKENS;
  gameState.turnPhase = "DEPLOYING";
  gameState.tokensToPlace = player.availableTokens;
  gameState.currentMessage = `Deploy ${gameState.tokensToPlace} tokens`;
  
  p.logs.game_info.push({
    data: { 
      phase: "RACE_SELECTED", 
      player: gameState.currentPlayer,
      race: combo.race.name,
      ability: combo.ability.name
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

export function deployToken(p, territory) {
  const player = gameState.players[gameState.currentPlayer];
  
  // Check if valid deployment
  if (gameState.tokensToPlace <= 0) return false;
  
  const playerTerritories = gameState.territories.filter(
    t => t.owner === gameState.currentPlayer && !t.isDeclined
  );
  
  // First deployment can be anywhere
  // Subsequent deployments must be adjacent to owned territory
  if (playerTerritories.length > 0) {
    const isAdjacentToOwned = playerTerritories.some(owned => 
      isAdjacent(owned, territory)
    );
    if (!isAdjacentToOwned) {
      gameState.currentMessage = "Must deploy adjacent to your territories!";
      return false;
    }
  }
  
  // Check conquest requirements
  const cost = territory.getConquestCost();
  
  if (gameState.tokensToPlace < cost) {
    gameState.currentMessage = `Need ${cost} tokens to conquer (${gameState.tokensToPlace} available)`;
    return false;
  }
  
  // Deploy tokens
  gameState.deploymentHistory.push({
    territory: territory,
    previousOwner: territory.owner,
    previousTokens: territory.tokens,
    tokensUsed: cost
  });
  
  territory.owner = gameState.currentPlayer;
  territory.tokens = cost;
  territory.isDeclined = false;
  gameState.tokensToPlace -= cost;
  
  gameState.currentMessage = `Conquered! ${gameState.tokensToPlace} tokens remaining`;
  
  p.logs.game_info.push({
    data: { 
      phase: "TERRITORY_CONQUERED", 
      player: gameState.currentPlayer,
      territory: { q: territory.q, r: territory.r },
      tokensUsed: cost
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

export function undoLastDeployment(p) {
  if (gameState.deploymentHistory.length === 0) return false;
  
  const lastDeployment = gameState.deploymentHistory.pop();
  
  lastDeployment.territory.owner = lastDeployment.previousOwner;
  lastDeployment.territory.tokens = lastDeployment.previousTokens;
  gameState.tokensToPlace += lastDeployment.tokensUsed;
  
  gameState.currentMessage = `Undone. ${gameState.tokensToPlace} tokens remaining`;
  
  p.logs.game_info.push({
    data: { phase: "UNDO_DEPLOYMENT", player: gameState.currentPlayer },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

export function putRaceIntoDecline(p) {
  const player = gameState.players[gameState.currentPlayer];
  
  if (player.activeRace === null) return false;
  if (player.declinedRace !== null) return false; // Can only have one declined race
  
  // Mark all active territories as declined
  gameState.territories.forEach(territory => {
    if (territory.owner === gameState.currentPlayer && !territory.isDeclined) {
      territory.isDeclined = true;
      territory.tokens = 1; // Keep 1 token in declined territories
    }
  });
  
  player.putIntoDecline();
  
  gameState.currentMessage = "Race put into decline!";
  
  p.logs.game_info.push({
    data: { phase: "RACE_DECLINED", player: gameState.currentPlayer },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // End turn automatically
  endPlayerTurn(p);
  
  return true;
}

export function executeAITurn(p) {
  const player = gameState.players[gameState.currentPlayer];
  const ai = gameState.aiControllers[gameState.currentPlayer];
  
  if (!ai) {
    endPlayerTurn(p);
    return;
  }
  
  // Check if should decline
  if (player.activeRace && ai.shouldDecline(gameState.territories, player)) {
    putRaceIntoDecline(p);
    return;
  }
  
  // Select race if needed
  if (player.activeRace === null) {
    const combo = ai.selectRaceCombo(gameState.availableRaceCombos);
    const index = gameState.availableRaceCombos.indexOf(combo);
    selectRaceCombo(p, index);
    return;
  }
  
  // Deploy tokens
  if (player.availableTokens > 0) {
    const target = ai.selectTargetTerritory(gameState.territories, player);
    if (target) {
      const success = deployToken(p, target);
      if (!success) {
        // Can't deploy, end turn
        endPlayerTurn(p);
      }
    } else {
      // No valid targets, end turn
      endPlayerTurn(p);
    }
  } else {
    // No tokens left, end turn
    endPlayerTurn(p);
  }
}