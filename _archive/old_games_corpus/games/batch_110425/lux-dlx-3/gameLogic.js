// gameLogic.js
import { gameState, GAME_PHASES, TURN_PHASES, getGameState } from './globals.js';
import { Player } from './territory.js';
import { generateMap, initializeTerritories } from './mapGenerator.js';
import { executeCombat } from './combat.js';
import { AIController } from './ai.js';
import { PLAYER_COLORS } from './globals.js';

export function initGame(p) {
  // Create players
  const humanPlayer = new Player(0, "Player", PLAYER_COLORS.HUMAN, false);
  const aiPlayer = new Player(1, "AI", PLAYER_COLORS.AI, true);
  
  gameState.players = [humanPlayer, aiPlayer];
  gameState.currentPlayerIndex = 0;
  
  // Generate map
  gameState.territories = generateMap();
  initializeTerritories(gameState.territories, gameState.players, p);
  
  // Initialize game state
  gameState.turnPhase = TURN_PHASES.REINFORCEMENT;
  gameState.selectedTerritory = null;
  gameState.attackingTerritory = null;
  gameState.reinforcementsToPlace = 0;
  gameState.cards = [];
  gameState.combatLog = [];
  gameState.turnNumber = 1;
  gameState.navigationIndex = 0;
  gameState.hoveredTerritoryIndex = 0;
  gameState.score = 0;
  gameState.aiThinking = false;
  gameState.aiDelay = 0;
  
  // Set initial player
  gameState.player = humanPlayer;
  gameState.entities = [humanPlayer, aiPlayer, ...gameState.territories];
  
  // Start reinforcement phase
  startReinforcementPhase(p);
}

export function startReinforcementPhase(p) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  gameState.reinforcementsToPlace = currentPlayer.calculateReinforcements(gameState.territories);
  gameState.turnPhase = TURN_PHASES.DEPLOYMENT;
  gameState.selectedTerritory = null;
  gameState.attackingTerritory = null;
  
  // Find first owned territory for navigation
  const ownedIndex = gameState.territories.findIndex(t => t.owner === currentPlayer);
  gameState.navigationIndex = ownedIndex >= 0 ? ownedIndex : 0;
  
  // Add combat log
  addCombatLog(`${currentPlayer.name} receives ${gameState.reinforcementsToPlace} reinforcements`);
}

export function deployArmy(p) {
  if (gameState.reinforcementsToPlace <= 0) return;
  
  const territory = gameState.territories[gameState.navigationIndex];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (territory.owner === currentPlayer) {
    territory.armies++;
    gameState.reinforcementsToPlace--;
    
    if (gameState.reinforcementsToPlace === 0) {
      gameState.turnPhase = TURN_PHASES.ATTACK;
      addCombatLog("Deployment complete. Attack phase begins.");
    }
  }
}

export function handleAttackSelection(p) {
  const territory = gameState.territories[gameState.navigationIndex];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (!gameState.attackingTerritory) {
    // Select attacking territory
    if (territory.owner === currentPlayer && territory.armies >= 3) {
      gameState.attackingTerritory = territory;
      addCombatLog(`Selected ${territory.name} to attack from`);
    }
  } else {
    // Select defending territory and execute attack
    if (territory.owner !== currentPlayer && 
        gameState.attackingTerritory.isAdjacentTo(territory.id)) {
      executeAttack(gameState.attackingTerritory, territory, p);
      gameState.attackingTerritory = null;
    } else {
      // Cancel selection
      gameState.attackingTerritory = null;
    }
  }
}

export function executeAttack(attacker, defender, p) {
  const result = executeCombat(attacker, defender, p);
  
  const logMsg = `${attacker.name} [${result.attackRolls.join(',')}] vs ${defender.name} [${result.defenderRolls.join(',')}]: ` +
                 `Attacker -${result.attackerLosses}, Defender -${result.defenderLosses}`;
  addCombatLog(logMsg);
  
  if (result.conquered) {
    addCombatLog(`${attacker.owner.name} conquered ${defender.name}!`);
    gameState.score += 10;
    
    // Check win condition
    checkWinCondition(p);
  }
}

export function endAttackPhase() {
  gameState.turnPhase = TURN_PHASES.FORTIFY;
  gameState.attackingTerritory = null;
  gameState.selectedTerritory = null;
  addCombatLog("Attack phase ended. Fortify phase begins.");
}

export function handleFortifySelection(p) {
  const territory = gameState.territories[gameState.navigationIndex];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  if (!gameState.selectedTerritory) {
    // Select source territory
    if (territory.owner === currentPlayer && territory.armies > 1) {
      gameState.selectedTerritory = territory;
      addCombatLog(`Selected ${territory.name} to fortify from`);
    }
  } else {
    // Select destination territory
    if (territory.owner === currentPlayer && 
        gameState.selectedTerritory.isAdjacentTo(territory.id) &&
        territory.id !== gameState.selectedTerritory.id) {
      // Move armies
      const armiesToMove = gameState.selectedTerritory.armies - 1;
      gameState.selectedTerritory.armies = 1;
      territory.armies += armiesToMove;
      addCombatLog(`Moved ${armiesToMove} armies to ${territory.name}`);
      endTurn();
    } else {
      gameState.selectedTerritory = null;
    }
  }
}

export function endTurn() {
  gameState.selectedTerritory = null;
  gameState.attackingTerritory = null;
  
  // Next player
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  if (gameState.currentPlayerIndex === 0) {
    gameState.turnNumber++;
  }
  
  // Start next turn
  const p = window.gameInstance;
  startReinforcementPhase(p);
  
  // Check if AI turn
  if (gameState.players[gameState.currentPlayerIndex].isAI) {
    gameState.aiThinking = true;
    gameState.aiDelay = 30; // Wait 30 frames before AI acts
  }
}

export function checkWinCondition(p) {
  const humanTerritories = gameState.territories.filter(t => t.owner === gameState.players[0]).length;
  const aiTerritories = gameState.territories.filter(t => t.owner === gameState.players[1]).length;
  
  if (humanTerritories === gameState.territories.length) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (aiTerritories === gameState.territories.length) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function addCombatLog(message) {
  gameState.combatLog.push(message);
  if (gameState.combatLog.length > 10) {
    gameState.combatLog.shift();
  }
}

export function navigateTerritories(direction) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  let attempts = 0;
  
  do {
    if (direction === 'left') {
      gameState.navigationIndex = (gameState.navigationIndex - 1 + gameState.territories.length) % gameState.territories.length;
    } else if (direction === 'right') {
      gameState.navigationIndex = (gameState.navigationIndex + 1) % gameState.territories.length;
    } else if (direction === 'up') {
      gameState.navigationIndex = (gameState.navigationIndex - 4 + gameState.territories.length) % gameState.territories.length;
    } else if (direction === 'down') {
      gameState.navigationIndex = (gameState.navigationIndex + 4) % gameState.territories.length;
    }
    attempts++;
  } while (attempts < gameState.territories.length && 
           gameState.turnPhase === TURN_PHASES.DEPLOYMENT &&
           gameState.territories[gameState.navigationIndex].owner !== currentPlayer);
}

export function updateAI(p) {
  if (!gameState.aiThinking) return;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.isAI) {
    gameState.aiThinking = false;
    return;
  }
  
  if (gameState.aiDelay > 0) {
    gameState.aiDelay--;
    return;
  }
  
  const ai = new AIController(currentPlayer, p);
  const decision = ai.makeDecision(gameState.territories);
  
  if (decision) {
    switch (decision.action) {
      case 'deploy':
        if (gameState.reinforcementsToPlace > 0) {
          decision.territory.armies++;
          gameState.reinforcementsToPlace--;
          gameState.aiDelay = 10;
        } else {
          gameState.turnPhase = TURN_PHASES.ATTACK;
          gameState.aiDelay = 20;
        }
        break;
        
      case 'attack':
        executeAttack(decision.from, decision.to, p);
        gameState.aiDelay = 20;
        break;
        
      case 'endAttack':
        gameState.turnPhase = TURN_PHASES.FORTIFY;
        gameState.aiDelay = 20;
        break;
        
      case 'fortify':
        const armiesToMove = decision.from.armies - 1;
        decision.from.armies = 1;
        decision.to.armies += armiesToMove;
        endTurn();
        gameState.aiThinking = false;
        break;
        
      case 'endFortify':
        endTurn();
        gameState.aiThinking = false;
        break;
    }
  } else {
    // No valid decision, end turn
    endTurn();
    gameState.aiThinking = false;
  }
}