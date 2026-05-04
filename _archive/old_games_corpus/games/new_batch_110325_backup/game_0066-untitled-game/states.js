// states.js - Game state handling
import { generateClients, generateDates, generateVenues, generateMiniGame } from './generation.js';
import { PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME, STATE_DATE_RESULT, MINIGAME_DIALOGUE, MINIGAME_GIFT, MINIGAME_COMPLIMENT } from './globals.js';

export function initializeGame(p, gameState) {
  // Generate initial clients and dates
  gameState.clients = generateClients(3, 1, p);
  gameState.dates = generateDates(4, 1, p);
  gameState.venues = generateVenues();
  gameState.venues[0].unlocked = true;
  
  // Reset game state
  gameState.selectedClient = null;
  gameState.selectedDate = null;
  gameState.selectedVenue = null;
  gameState.currentCouple = null;
  gameState.loveMeter = 0;
  gameState.miniGamesCompleted = 0;
  gameState.currentMiniGame = null;
  gameState.menuSelection = 0;
  gameState.datesCompleted = 0;
  gameState.successfulDates = 0;
  gameState.unlockedVenues = 1;
  gameState.player.reputation = 0;
  
  gameState.playState = STATE_CLIENT_SELECT;
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, state: STATE_CLIENT_SELECT },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateClientSelection(p, gameState) {
  // Update menu options
  gameState.menuOptions = gameState.clients.map(c => c.name);
}

export function selectClient(p, gameState, index) {
  if (index >= 0 && index < gameState.clients.length) {
    gameState.selectedClient = gameState.clients[index];
    gameState.playState = STATE_DATE_SELECT;
    gameState.menuSelection = 0;
    
    p.logs.game_info.push({
      data: { action: "client_selected", client: gameState.selectedClient.name },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateDateSelection(p, gameState) {
  // Update menu options
  gameState.menuOptions = gameState.dates.map(d => d.name);
}

export function selectDate(p, gameState, index) {
  if (index >= 0 && index < gameState.dates.length) {
    gameState.selectedDate = gameState.dates[index];
    gameState.playState = STATE_DATE_VENUE;
    gameState.menuSelection = 0;
    
    p.logs.game_info.push({
      data: { action: "date_selected", date: gameState.selectedDate.name },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateVenueSelection(p, gameState) {
  // Update menu options
  gameState.menuOptions = gameState.venues.filter(v => v.unlocked).map(v => v.name);
}

export function selectVenue(p, gameState, index) {
  const unlockedVenues = gameState.venues.filter(v => v.unlocked);
  if (index >= 0 && index < unlockedVenues.length) {
    gameState.selectedVenue = unlockedVenues[index];
    startDate(p, gameState);
    
    p.logs.game_info.push({
      data: { action: "venue_selected", venue: gameState.selectedVenue.name },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function startDate(p, gameState) {
  gameState.loveMeter = 0;
  gameState.miniGamesCompleted = 0;
  gameState.currentCouple = {
    client: gameState.selectedClient,
    date: gameState.selectedDate,
    compatibility: gameState.selectedClient.getCompatibility(gameState.selectedDate)
  };
  
  // Start first mini-game
  startNextMiniGame(p, gameState);
}

export function startNextMiniGame(p, gameState) {
  if (gameState.miniGamesCompleted >= 3) {
    endDate(p, gameState);
    return;
  }
  
  // Choose a random mini-game type from the venue
  const types = gameState.selectedVenue.miniGameTypes;
  const type = types[Math.floor(p.random(types.length))];
  
  gameState.currentMiniGame = generateMiniGame(type, gameState.selectedClient.preferences, p);
  gameState.playState = STATE_MINIGAME;
  gameState.menuSelection = 0;
  
  p.logs.game_info.push({
    data: { action: "minigame_started", type: type },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateMiniGame(p, gameState) {
  if (gameState.currentMiniGame) {
    gameState.currentMiniGame.update();
    
    if (gameState.currentMiniGame.completed) {
      finishMiniGame(p, gameState);
    }
  }
}

export function submitMiniGameAnswer(p, gameState, answer) {
  if (gameState.currentMiniGame && !gameState.currentMiniGame.completed) {
    gameState.currentMiniGame.submitAnswer(answer);
    finishMiniGame(p, gameState);
  }
}

export function finishMiniGame(p, gameState) {
  const miniGame = gameState.currentMiniGame;
  const compatibility = gameState.currentCouple.compatibility;
  
  if (miniGame.success) {
    const baseGain = 10;
    const compatibilityBonus = compatibility * 5;
    gameState.loveMeter += baseGain + compatibilityBonus;
  } else {
    const baseLoss = 10;
    const compatibilityPenalty = (1 - compatibility) * 5;
    gameState.loveMeter -= baseLoss + compatibilityPenalty;
  }
  
  gameState.loveMeter = Math.max(0, Math.min(100, gameState.loveMeter));
  gameState.miniGamesCompleted++;
  
  p.logs.game_info.push({
    data: {
      action: "minigame_completed",
      success: miniGame.success,
      loveMeter: gameState.loveMeter
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Short delay before next mini-game
  setTimeout(() => {
    startNextMiniGame(p, gameState);
  }, 100);
}

export function endDate(p, gameState) {
  gameState.playState = STATE_DATE_RESULT;
  gameState.datesCompleted++;
  
  const success = gameState.loveMeter >= 60;
  
  if (success) {
    gameState.successfulDates++;
    const reputationGain = Math.floor(30 + gameState.loveMeter / 2);
    gameState.player.reputation += reputationGain;
    
    // Unlock venues
    for (let venue of gameState.venues) {
      if (!venue.unlocked && gameState.player.reputation >= venue.unlockCost) {
        venue.unlocked = true;
        gameState.unlockedVenues++;
      }
    }
  } else {
    gameState.player.reputation -= 10;
    gameState.player.reputation = Math.max(0, gameState.player.reputation);
  }
  
  p.logs.game_info.push({
    data: {
      action: "date_ended",
      success: success,
      loveMeter: gameState.loveMeter,
      reputation: gameState.player.reputation
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check win/lose conditions
  if (gameState.player.reputation >= gameState.targetReputation) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  } else if (gameState.player.reputation <= 0 && gameState.datesCompleted >= 3) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}

export function returnToClientSelect(p, gameState) {
  // Generate new clients and dates
  const difficulty = 1 + Math.floor(gameState.datesCompleted / 3);
  gameState.clients = generateClients(3, difficulty, p);
  gameState.dates = generateDates(4, difficulty, p);
  
  gameState.selectedClient = null;
  gameState.selectedDate = null;
  gameState.selectedVenue = null;
  gameState.currentCouple = null;
  gameState.currentMiniGame = null;
  gameState.menuSelection = 0;
  gameState.playState = STATE_CLIENT_SELECT;
  
  p.logs.game_info.push({
    data: { action: "returned_to_client_select" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}