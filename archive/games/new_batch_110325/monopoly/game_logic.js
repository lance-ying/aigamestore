import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  SPACE_TYPES,
  HOUSE_COST
} from './globals.js';
import { Player } from './player.js';

export function rollDice(p) {
  const die1 = Math.floor(p.random() * 6) + 1;
  const die2 = Math.floor(p.random() * 6) + 1;
  gameState.diceValues = [die1, die2];
  gameState.diceRolled = true;
  gameState.showingDice = true;
  
  // Check for doubles
  if (die1 === die2) {
    gameState.doublesCount++;
    if (gameState.doublesCount >= 3) {
      // Go to jail for rolling three doubles
      getCurrentPlayer().inJail = true;
      getCurrentPlayer().position = 10;
      gameState.doublesCount = 0;
      gameState.turnPhase = "END";
      addGameMessage("Three doubles! Go to Jail!");
      return;
    }
  }
  
  gameState.turnPhase = "MOVE";
  gameState.animationProgress = 0;
}

export function moveCurrentPlayer() {
  const player = getCurrentPlayer();
  const totalMove = gameState.diceValues[0] + gameState.diceValues[1];
  
  player.moveSpaces(totalMove);
  gameState.turnPhase = "ACTION";
  gameState.animationProgress = 0;
  
  // Log player position
  logPlayerPosition(player);
}

export function handleSpaceLanding(p) {
  const player = getCurrentPlayer();
  const space = gameState.board[player.position];
  
  gameState.selectedProperty = space;
  
  if (space.type === SPACE_TYPES.PROPERTY || 
      space.type === SPACE_TYPES.RAILROAD || 
      space.type === SPACE_TYPES.UTILITY) {
    
    if (space.owner === null) {
      // Unowned property
      if (player.isAI) {
        handleAIPropertyDecision(player, space);
      } else {
        gameState.actionPrompt = `Buy ${space.name} for $${space.price}? (Z: Yes, Shift: No)`;
        gameState.pendingAction = "BUY_PROPERTY";
      }
    } else if (space.owner !== player && !space.mortgaged) {
      // Pay rent
      const rent = calculateRent(space);
      player.payRent(rent, space.owner);
      addGameMessage(`${player.name} paid $${rent} rent to ${space.owner.name}`);
      gameState.turnPhase = "END";
    } else {
      gameState.turnPhase = "END";
    }
    
  } else if (space.type === SPACE_TYPES.CHANCE) {
    handleChanceCard(p, player);
  } else if (space.type === SPACE_TYPES.COMMUNITY_CHEST) {
    handleCommunityChestCard(p, player);
  } else if (space.type === SPACE_TYPES.TAX) {
    player.pay(space.amount);
    addGameMessage(`${player.name} paid $${space.amount} in taxes`);
    gameState.turnPhase = "END";
  } else if (space.type === SPACE_TYPES.GO_TO_JAIL) {
    player.inJail = true;
    player.position = 10;
    addGameMessage(`${player.name} sent to Jail!`);
    gameState.turnPhase = "END";
  } else {
    gameState.turnPhase = "END";
  }
}

export function calculateRent(space) {
  if (space.type === SPACE_TYPES.PROPERTY) {
    const owner = space.owner;
    const hasMonopoly = owner.hasMonopoly(space.group);
    
    if (space.houses === 0 && hasMonopoly) {
      return space.rent[0] * 2;
    } else {
      return space.rent[space.houses];
    }
  } else if (space.type === SPACE_TYPES.RAILROAD) {
    const railroadsOwned = space.owner.properties.filter(p => p.type === SPACE_TYPES.RAILROAD).length;
    return 25 * Math.pow(2, railroadsOwned - 1);
  } else if (space.type === SPACE_TYPES.UTILITY) {
    const utilitiesOwned = space.owner.properties.filter(p => p.type === SPACE_TYPES.UTILITY).length;
    const multiplier = utilitiesOwned === 2 ? 10 : 4;
    return (gameState.diceValues[0] + gameState.diceValues[1]) * multiplier;
  }
  return 0;
}

export function handleChanceCard(p, player) {
  const card = gameState.chanceCards[Math.floor(p.random() * gameState.chanceCards.length)];
  addGameMessage(`Chance: ${card.text}`);
  executeCardAction(card, player);
  gameState.turnPhase = "END";
}

export function handleCommunityChestCard(p, player) {
  const card = gameState.communityChestCards[Math.floor(p.random() * gameState.communityChestCards.length)];
  addGameMessage(`Community Chest: ${card.text}`);
  executeCardAction(card, player);
  gameState.turnPhase = "END";
}

export function executeCardAction(card, player) {
  switch (card.action) {
    case "ADVANCE_TO_GO":
      player.moveTo(0);
      player.collect(200);
      break;
    case "COLLECT":
      player.collect(card.amount);
      break;
    case "PAY":
      player.pay(card.amount);
      break;
    case "MOVE_BACK":
      player.moveSpaces(-card.spaces);
      break;
    case "GO_TO_JAIL":
      player.inJail = true;
      player.position = 10;
      break;
    case "REPAIRS":
      const houses = player.properties.reduce((sum, p) => sum + (p.houses < 5 ? p.houses : 0), 0);
      const hotels = player.properties.reduce((sum, p) => sum + (p.houses === 5 ? 1 : 0), 0);
      player.pay(houses * card.house + hotels * card.hotel);
      break;
    case "ADVANCE_TO_RAILROAD":
      // Find nearest railroad
      const railroads = [5, 15, 25, 35];
      let nearest = railroads.find(r => r > player.position);
      if (!nearest) nearest = railroads[0];
      player.moveTo(nearest);
      break;
  }
}

export function handleAIPropertyDecision(player, space) {
  // Simple AI: buy if affordable
  if (player.cash >= space.price && space.price < player.cash * 0.6) {
    player.buyProperty(space);
    addGameMessage(`${player.name} bought ${space.name}`);
  }
  gameState.turnPhase = "END";
}

export function handleAITurn(p) {
  const player = getCurrentPlayer();
  
  if (gameState.turnPhase === "ROLL") {
    rollDice(p);
  } else if (gameState.turnPhase === "MOVE") {
    moveCurrentPlayer();
    setTimeout(() => handleSpaceLanding(p), 300);
  } else if (gameState.turnPhase === "END") {
    // AI considers building houses
    if (p.random() > 0.5) {
      const buildable = player.properties.filter(prop => {
        return prop.type === SPACE_TYPES.PROPERTY && 
               player.hasMonopoly(prop.group) && 
               prop.houses < 5 &&
               player.cash >= HOUSE_COST + 200;
      });
      
      if (buildable.length > 0) {
        const prop = buildable[Math.floor(p.random() * buildable.length)];
        player.buildHouse(prop);
        addGameMessage(`${player.name} built on ${prop.name}`);
      }
    }
    
    // End turn
    endTurn();
  }
}

export function endTurn() {
  // Check if player rolled doubles
  if (gameState.diceValues[0] === gameState.diceValues[1] && gameState.doublesCount > 0) {
    // Player gets another turn
    gameState.turnPhase = "ROLL";
    gameState.diceRolled = false;
    gameState.actionPrompt = "Rolled doubles! Roll again (Space)";
    return;
  }
  
  gameState.doublesCount = 0;
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  
  // Skip bankrupt players
  while (getCurrentPlayer().isBankrupt && gameState.players.filter(p => !p.isBankrupt).length > 1) {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  }
  
  gameState.turnPhase = "ROLL";
  gameState.diceRolled = false;
  gameState.selectedProperty = null;
  gameState.actionPrompt = "";
  gameState.turnCount++;
  
  checkWinCondition();
}

export function checkWinCondition() {
  const activePlayers = gameState.players.filter(p => !p.isBankrupt);
  
  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    if (winner.id === 0) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score = winner.cash;
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    }
    
    // Log game over
    gameState.p.logs.game_info.push({
      data: { phase: gameState.gamePhase, winner: winner.name, finalCash: winner.cash },
      framecount: gameState.p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function getCurrentPlayer() {
  return gameState.players[gameState.currentPlayerIndex];
}

export function addGameMessage(text) {
  gameState.messageQueue.push({
    text: text,
    timestamp: Date.now()
  });
}

export function logPlayerPosition(player) {
  if (gameState.p && player.id === 0) {
    const pos = player.getScreenPosition();
    gameState.p.logs.player_info.push({
      screen_x: pos.x,
      screen_y: pos.y,
      game_x: player.position,
      game_y: 0,
      framecount: gameState.p.frameCount
    });
  }
}