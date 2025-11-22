// game_logic.js - Core game logic
import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, SUBPHASE_DRAW, SUBPHASE_AGENT_PLACEMENT, SUBPHASE_REVEAL, SUBPHASE_COMBAT, SUBPHASE_CLEANUP } from './globals.js';
import { Player } from './player.js';
import { createLocations } from './locations.js';
import { createMarketCards } from './cards.js';
import { AIController } from './ai.js';

export function initializeGame(p) {
  gameState.player = new Player(false);
  gameState.opponent = new Player(true);
  gameState.locations = createLocations();
  gameState.marketCards = createMarketCards();
  gameState.round = 0;
  gameState.currentPlayer = 0;
  gameState.subPhase = SUBPHASE_DRAW;
  gameState.selectedCardIndex = -1;
  gameState.selectedLocationIndex = -1;
  gameState.messageText = "";
  gameState.messageTimer = 0;
  gameState.combatResults = null;
  
  // Shuffle decks
  gameState.player.deck.shuffle(p);
  gameState.opponent.deck.shuffle(p);
  
  // Initialize AI controller
  gameState.aiController = new AIController(gameState.opponent);
  
  // Start first round
  startNewRound(p);
}

export function startNewRound(p) {
  gameState.round++;
  gameState.subPhase = SUBPHASE_DRAW;
  gameState.currentPlayer = 0;
  
  // Reset locations
  for (const loc of gameState.locations) {
    loc.reset();
  }
  
  // Draw cards
  gameState.player.drawCards(p, 5);
  gameState.opponent.drawCards(p, 5);
  
  gameState.subPhase = SUBPHASE_AGENT_PLACEMENT;
  gameState.selectedCardIndex = -1;
  gameState.selectedLocationIndex = -1;
  
  showMessage("Round " + gameState.round + " begins!", 90);
  
  // Log round start
  if (p.logs) {
    p.logs.game_info.push({
      data: { event: "round_start", round: gameState.round },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame(p) {
  // Update message timer
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
  
  // Handle sub-phases
  if (gameState.subPhase === SUBPHASE_AGENT_PLACEMENT) {
    updateAgentPlacement(p);
  } else if (gameState.subPhase === SUBPHASE_REVEAL) {
    updateRevealPhase(p);
  } else if (gameState.subPhase === SUBPHASE_COMBAT) {
    updateCombatPhase(p);
  } else if (gameState.subPhase === SUBPHASE_CLEANUP) {
    updateCleanupPhase(p);
  }
  
  // Check win condition
  checkWinCondition();
}

function updateAgentPlacement(p) {
  if (gameState.currentPlayer === 1) {
    // AI turn
    if (p.frameCount % 30 === 0) { // AI acts every 30 frames
      handleAITurn(p);
    }
  }
}

function handleAITurn(p) {
  const ai = gameState.opponent;
  
  if (ai.agentsAvailable === 0) {
    // AI has no more agents, switch to player
    if (gameState.player.agentsAvailable === 0) {
      // Both players done, move to reveal phase
      gameState.subPhase = SUBPHASE_REVEAL;
      gameState.currentPlayer = 0;
      showMessage("Reveal Phase!", 60);
    } else {
      gameState.currentPlayer = 0;
    }
    return;
  }
  
  const decision = gameState.aiController.chooseCardAndLocation(p, gameState.locations, gameState.marketCards);
  
  if (decision && decision.cardIndex >= 0 && decision.locationIndex >= 0) {
    const card = ai.hand[decision.cardIndex];
    const location = gameState.locations[decision.locationIndex];
    
    // Play card and place agent
    ai.hand.splice(decision.cardIndex, 1);
    ai.placeAgent(location);
    location.occupied = "opponent";
    
    // Apply agent effect
    applyCardEffect(p, card.agentEffect, ai);
    
    // Handle market
    if (location.type === "market") {
      const marketChoice = gameState.aiController.chooseMarketCard(p, gameState.marketCards);
      if (marketChoice >= 0) {
        const marketCard = gameState.marketCards[marketChoice];
        if (ai.buyCard(marketCard)) {
          gameState.marketCards.splice(marketChoice, 1);
        }
      }
    }
  }
  
  // Check if AI is done
  if (ai.agentsAvailable === 0) {
    if (gameState.player.agentsAvailable === 0) {
      gameState.subPhase = SUBPHASE_REVEAL;
      gameState.currentPlayer = 0;
      showMessage("Reveal Phase!", 60);
    } else {
      gameState.currentPlayer = 0;
    }
  }
}

function updateRevealPhase(p) {
  // Apply reveal effects
  for (const card of gameState.player.hand) {
    if (card.revealEffect) {
      applyCardEffect(p, card.revealEffect, gameState.player);
    }
  }
  
  for (const card of gameState.opponent.hand) {
    if (card.revealEffect) {
      applyCardEffect(p, card.revealEffect, gameState.opponent);
    }
  }
  
  // Calculate combat strength
  gameState.player.calculateCombatStrength();
  gameState.opponent.calculateCombatStrength();
  
  gameState.subPhase = SUBPHASE_COMBAT;
  showMessage("Combat Phase!", 60);
}

function updateCombatPhase(p) {
  if (p.frameCount % 60 === 0) { // Wait 1 second before resolving
    resolveCombat(p);
    gameState.subPhase = SUBPHASE_CLEANUP;
    showMessage("Round complete!", 90);
  }
}

function resolveCombat(p) {
  // Resolve each combat location
  for (const loc of gameState.locations) {
    if (!loc.isCombat) continue;
    
    let playerControl = false;
    let opponentControl = false;
    
    // Check who has agent there
    if (loc.occupied === "player") playerControl = true;
    if (loc.occupied === "opponent") opponentControl = true;
    
    // Add combat strength
    let playerStr = playerControl ? gameState.player.combatStrength : 0;
    let opponentStr = opponentControl ? gameState.opponent.combatStrength : 0;
    
    // Determine winner
    if (playerStr > opponentStr) {
      gameState.player.gainVP(loc.vpReward);
      if (loc.reward) {
        gameState.player.gainResource(loc.reward.type, loc.reward.value);
      }
    } else if (opponentStr > playerStr) {
      gameState.opponent.gainVP(loc.vpReward);
      if (loc.reward) {
        gameState.opponent.gainResource(loc.reward.type, loc.reward.value);
      }
    }
    // Tie = no one wins
  }
  
  // Log combat
  if (p.logs) {
    p.logs.game_info.push({
      data: {
        event: "combat_resolved",
        player_strength: gameState.player.combatStrength,
        opponent_strength: gameState.opponent.combatStrength
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateCleanupPhase(p) {
  if (p.frameCount % 90 === 0) { // Wait 1.5 seconds
    // End round
    gameState.player.endRound();
    gameState.opponent.endRound();
    
    // Start new round
    startNewRound(p);
  }
}

export function handlePlayerCardSelection(p, direction) {
  if (gameState.currentPlayer !== 0) return;
  if (gameState.player.hand.length === 0) return;
  
  if (direction === "left") {
    gameState.selectedCardIndex--;
    if (gameState.selectedCardIndex < 0) {
      gameState.selectedCardIndex = gameState.player.hand.length - 1;
    }
  } else if (direction === "right") {
    gameState.selectedCardIndex++;
    if (gameState.selectedCardIndex >= gameState.player.hand.length) {
      gameState.selectedCardIndex = 0;
    }
  }
  
  // Reset location selection when changing card
  gameState.selectedLocationIndex = -1;
}

export function handlePlayerLocationSelection(p, direction) {
  if (gameState.currentPlayer !== 0) return;
  if (gameState.selectedCardIndex < 0) return;
  
  const card = gameState.player.hand[gameState.selectedCardIndex];
  if (!card.agentEffect) {
    showMessage("This card has no agent effect!", 60);
    return;
  }
  
  // Find available locations
  const availableLocations = [];
  for (let i = 0; i < gameState.locations.length; i++) {
    if (!gameState.locations[i].occupied) {
      availableLocations.push(i);
    }
  }
  
  if (availableLocations.length === 0) return;
  
  if (gameState.selectedLocationIndex < 0) {
    gameState.selectedLocationIndex = availableLocations[0];
  } else {
    const currentIdx = availableLocations.indexOf(gameState.selectedLocationIndex);
    let newIdx = currentIdx;
    
    if (direction === "up") {
      newIdx = (currentIdx - 3 + availableLocations.length) % availableLocations.length;
    } else if (direction === "down") {
      newIdx = (currentIdx + 3) % availableLocations.length;
    } else if (direction === "left") {
      newIdx = (currentIdx - 1 + availableLocations.length) % availableLocations.length;
    } else if (direction === "right") {
      newIdx = (currentIdx + 1) % availableLocations.length;
    }
    
    gameState.selectedLocationIndex = availableLocations[newIdx];
  }
}

export function handlePlayerAction(p) {
  if (gameState.currentPlayer !== 0) return;
  if (gameState.subPhase !== SUBPHASE_AGENT_PLACEMENT) return;
  
  // Check if in market
  if (gameState.selectedLocationIndex >= 0) {
    const loc = gameState.locations[gameState.selectedLocationIndex];
    if (loc.type === "market" && gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < gameState.marketCards.length) {
      handleMarketPurchase(p);
      return;
    }
  }
  
  if (gameState.selectedCardIndex < 0 || gameState.selectedLocationIndex < 0) {
    showMessage("Select a card and location first!", 60);
    return;
  }
  
  const card = gameState.player.hand[gameState.selectedCardIndex];
  const location = gameState.locations[gameState.selectedLocationIndex];
  
  if (!card.agentEffect) {
    showMessage("This card has no agent effect!", 60);
    return;
  }
  
  if (location.occupied) {
    showMessage("Location already occupied!", 60);
    return;
  }
  
  if (gameState.player.agentsAvailable === 0) {
    showMessage("No agents available!", 60);
    return;
  }
  
  // Play card and place agent
  gameState.player.hand.splice(gameState.selectedCardIndex, 1);
  gameState.player.placeAgent(location);
  location.occupied = "player";
  
  // Apply agent effect
  applyCardEffect(p, card.agentEffect, gameState.player);
  
  // Handle market location
  if (location.type === "market") {
    // Enter market mode
    gameState.selectedCardIndex = 0;
  } else {
    gameState.selectedCardIndex = -1;
    gameState.selectedLocationIndex = -1;
    
    // Check if player is done
    if (gameState.player.agentsAvailable === 0) {
      gameState.currentPlayer = 1;
    }
  }
  
  // Log player info
  logPlayerInfo(p);
}

export function handleMarketPurchase(p) {
  const cardIndex = gameState.selectedCardIndex;
  if (cardIndex < 0 || cardIndex >= gameState.marketCards.length) return;
  
  const card = gameState.marketCards[cardIndex];
  if (gameState.player.buyCard(card)) {
    gameState.marketCards.splice(cardIndex, 1);
    showMessage(`Purchased ${card.name}!`, 60);
    
    // Exit market
    gameState.selectedCardIndex = -1;
    gameState.selectedLocationIndex = -1;
    
    // Check if player is done
    if (gameState.player.agentsAvailable === 0) {
      gameState.currentPlayer = 1;
    }
  } else {
    showMessage("Not enough Solari!", 60);
  }
  
  logPlayerInfo(p);
}

export function handleCancelAction(p) {
  if (gameState.selectedLocationIndex >= 0) {
    const loc = gameState.locations[gameState.selectedLocationIndex];
    if (loc.type === "market") {
      // Exit market
      gameState.selectedLocationIndex = -1;
      gameState.selectedCardIndex = -1;
      return;
    }
  }
  
  gameState.selectedLocationIndex = -1;
}

function applyCardEffect(p, effect, player) {
  if (!effect) return;
  
  if (effect.type === "resource") {
    player.gainResource(effect.resource, effect.value);
  } else if (effect.type === "influence") {
    if (effect.faction) {
      player.gainInfluence(effect.faction, effect.value);
    } else {
      // Choose faction with lowest influence
      let lowestFaction = null;
      let lowestValue = Infinity;
      for (const faction of Object.keys(player.influence)) {
        if (player.influence[faction] < lowestValue) {
          lowestValue = player.influence[faction];
          lowestFaction = faction;
        }
      }
      if (lowestFaction) {
        player.gainInfluence(lowestFaction, effect.value);
      }
    }
  } else if (effect.type === "draw") {
    player.drawCards(p, effect.value);
  }
}

function checkWinCondition() {
  if (gameState.player.victoryPoints >= 10) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  } else if (gameState.opponent.victoryPoints >= 10) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}

function showMessage(text, duration) {
  gameState.messageText = text;
  gameState.messageTimer = duration;
}

function logPlayerInfo(p) {
  if (!p.logs) return;
  
  p.logs.player_info.push({
    screen_x: gameState.player.screen_x,
    screen_y: gameState.player.screen_y,
    game_x: gameState.player.game_x,
    game_y: gameState.player.game_y,
    framecount: p.frameCount
  });
}