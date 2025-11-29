// input_handler.js - Handle keyboard input

import { gameState } from './globals.js';
import { shuffleArray, drawCard, canClaimRoute, claimRoute, checkDestinationCompletion, calculateLongestPath, setMessage } from './utils.js';

let p5Instance = null;

export function initInputHandler(p) {
  p5Instance = p;
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p);
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.currentAction = null;
  gameState.selectedCardIndex = -1;
  gameState.selectedRouteIndex = -1;
  gameState.menuSelection = 0;
  gameState.cardsDrawnThisTurn = 0;
  
  // Draw initial destination tickets
  gameState.destinationsDrawn = [];
  for (let i = 0; i < 3; i++) {
    if (gameState.destinationTickets.length > 0) {
      gameState.destinationsDrawn.push(gameState.destinationTickets.pop());
    }
  }
  gameState.mustKeepDestinations = 1;
  gameState.currentAction = "CHOOSE_INITIAL_DESTINATIONS";
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", action: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.trainsRemaining = 45;
  gameState.playerHand = [];
  gameState.playerDestinations = [];
  gameState.claimedRoutes = [];
  gameState.currentAction = null;
  gameState.finalRoundTriggered = false;
  gameState.gameOver = false;
  gameState.message = "";
  
  // Reset routes
  gameState.routes.forEach(route => {
    route.claimed = false;
    route.claimedBy = null;
  });
  
  // Recreate decks
  const createTrainCardDeck = (await import('./game_data.js')).createTrainCardDeck;
  const createDestinationTickets = (await import('./game_data.js')).createDestinationTickets;
  
  gameState.trainCards = shuffleArray(createTrainCardDeck(), p);
  gameState.destinationTickets = shuffleArray(createDestinationTickets(), p);
  
  // Deal face-up cards
  gameState.faceUpCards = [];
  for (let i = 0; i < 5; i++) {
    gameState.faceUpCards.push(drawCard(p));
  }
  
  // Deal initial hand
  for (let i = 0; i < 4; i++) {
    gameState.playerHand.push(drawCard(p));
  }
  
  p.logs.game_info.push({
    data: { phase: "START", action: "Game Reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleGameplayInput(p) {
  const keyCode = p.keyCode;
  
  // Handle initial destination selection
  if (gameState.currentAction === "CHOOSE_INITIAL_DESTINATIONS") {
    if (keyCode === 38 || keyCode === 40) { // UP/DOWN
      const dir = keyCode === 38 ? -1 : 1;
      gameState.menuSelection = (gameState.menuSelection + dir + gameState.destinationsDrawn.length) % gameState.destinationsDrawn.length;
    } else if (keyCode === 32) { // SPACE - toggle selection
      const dest = gameState.destinationsDrawn[gameState.menuSelection];
      dest.selected = !dest.selected;
      
      const selectedCount = gameState.destinationsDrawn.filter(d => d.selected).length;
      if (selectedCount >= gameState.mustKeepDestinations) {
        // Can confirm
      }
    } else if (keyCode === 90) { // Z - confirm selection
      const selected = gameState.destinationsDrawn.filter(d => d.selected);
      if (selected.length >= gameState.mustKeepDestinations) {
        selected.forEach(dest => {
          delete dest.selected;
          gameState.playerDestinations.push(dest);
        });
        gameState.destinationsDrawn = [];
        gameState.currentAction = null;
        setMessage("Destinations kept. Choose your action.", 120);
      } else {
        setMessage(`Must keep at least ${gameState.mustKeepDestinations} destination(s)!`, 120);
      }
    }
    return;
  }
  
  // Handle mid-turn destination selection
  if (gameState.currentAction === "SELECTING_DESTINATIONS") {
    if (keyCode === 38 || keyCode === 40) { // UP/DOWN
      const dir = keyCode === 38 ? -1 : 1;
      gameState.menuSelection = (gameState.menuSelection + dir + gameState.destinationsDrawn.length) % gameState.destinationsDrawn.length;
    } else if (keyCode === 32) { // SPACE - toggle selection
      const dest = gameState.destinationsDrawn[gameState.menuSelection];
      dest.selected = !dest.selected;
    } else if (keyCode === 90) { // Z - confirm selection
      const selected = gameState.destinationsDrawn.filter(d => d.selected);
      if (selected.length >= gameState.mustKeepDestinations) {
        selected.forEach(dest => {
          delete dest.selected;
          gameState.playerDestinations.push(dest);
        });
        gameState.destinationsDrawn = [];
        gameState.currentAction = null;
        endTurn(p);
      } else {
        setMessage(`Must keep at least ${gameState.mustKeepDestinations} destination(s)!`, 120);
      }
    } else if (keyCode === 90 && gameState.destinationsDrawn.length === 0) {
      gameState.currentAction = null;
    }
    return;
  }
  
  // Normal turn actions
  if (!gameState.currentAction) {
    // Choose action
    if (keyCode === 16) { // SHIFT - cycle actions
      const actions = ["DRAW_CARDS", "CLAIM_ROUTE", "DRAW_DESTINATIONS"];
      gameState.menuSelection = (gameState.menuSelection + 1) % actions.length;
    } else if (keyCode === 32) { // SPACE - select action
      const actions = ["DRAW_CARDS", "CLAIM_ROUTE", "DRAW_DESTINATIONS"];
      gameState.currentAction = actions[gameState.menuSelection];
      gameState.selectedCardIndex = -1;
      gameState.selectedRouteIndex = -1;
      gameState.cardsDrawnThisTurn = 0;
      
      if (gameState.currentAction === "DRAW_DESTINATIONS") {
        // Draw 3 destination tickets
        gameState.destinationsDrawn = [];
        for (let i = 0; i < 3; i++) {
          if (gameState.destinationTickets.length > 0) {
            gameState.destinationsDrawn.push(gameState.destinationTickets.pop());
          }
        }
        if (gameState.destinationsDrawn.length === 0) {
          setMessage("No more destination tickets!", 120);
          gameState.currentAction = null;
        } else {
          gameState.mustKeepDestinations = 1;
          gameState.currentAction = "SELECTING_DESTINATIONS";
          gameState.menuSelection = 0;
        }
      }
    }
  } else if (gameState.currentAction === "DRAW_CARDS") {
    // Drawing cards
    if (keyCode === 37 || keyCode === 39) { // LEFT/RIGHT
      const dir = keyCode === 37 ? -1 : 1;
      gameState.selectedCardIndex = (gameState.selectedCardIndex + dir + 7) % 7; // 5 face-up + deck + back
    } else if (keyCode === 32) { // SPACE - draw card
      if (gameState.cardsDrawnThisTurn >= 2) {
        setMessage("Already drew 2 cards this turn!", 60);
        return;
      }
      
      if (gameState.selectedCardIndex < 5) {
        // Face-up card
        const card = gameState.faceUpCards[gameState.selectedCardIndex];
        if (card === 'RAINBOW' && gameState.cardsDrawnThisTurn === 1) {
          setMessage("Cannot draw wild as 2nd card!", 60);
          return;
        }
        gameState.playerHand.push(card);
        gameState.faceUpCards[gameState.selectedCardIndex] = drawCard(p);
        
        if (card === 'RAINBOW') {
          gameState.cardsDrawnThisTurn = 2; // Wild counts as both
        } else {
          gameState.cardsDrawnThisTurn++;
        }
      } else if (gameState.selectedCardIndex === 5) {
        // Deck
        const card = drawCard(p);
        if (card) {
          gameState.playerHand.push(card);
          gameState.cardsDrawnThisTurn++;
        }
      }
      
      if (gameState.cardsDrawnThisTurn >= 2) {
        endTurn(p);
      }
    } else if (keyCode === 90) { // Z - cancel
      gameState.currentAction = null;
    }
  } else if (gameState.currentAction === "CLAIM_ROUTE") {
    // Claiming routes
    if (keyCode === 38 || keyCode === 40) { // UP/DOWN
      const dir = keyCode === 38 ? -1 : 1;
      const unclaimedRoutes = gameState.routes.filter(r => !r.claimed);
      if (unclaimedRoutes.length > 0) {
        gameState.selectedRouteIndex = (gameState.selectedRouteIndex + dir + unclaimedRoutes.length) % unclaimedRoutes.length;
      }
    } else if (keyCode === 32) { // SPACE - claim route
      const unclaimedRoutes = gameState.routes.filter(r => !r.claimed);
      if (gameState.selectedRouteIndex >= 0 && gameState.selectedRouteIndex < unclaimedRoutes.length) {
        const route = unclaimedRoutes[gameState.selectedRouteIndex];
        if (canClaimRoute(route, gameState.playerHand)) {
          claimRoute(route, gameState.playerHand);
          setMessage(`Claimed route! +${route.getPoints()} points`, 120);
          endTurn(p);
        } else {
          setMessage("Not enough cards to claim this route!", 120);
        }
      }
    } else if (keyCode === 90) { // Z - cancel
      gameState.currentAction = null;
    }
  }
}

function endTurn(p) {
  gameState.currentAction = null;
  gameState.selectedCardIndex = -1;
  gameState.selectedRouteIndex = -1;
  gameState.cardsDrawnThisTurn = 0;
  
  // Check destination completion
  gameState.playerDestinations.forEach(dest => {
    if (!dest.completed) {
      if (checkDestinationCompletion(dest, gameState.claimedRoutes, gameState.cities)) {
        dest.completed = true;
        gameState.score += dest.points;
        setMessage(`Destination completed! +${dest.points} points`, 180);
      }
    }
  });
  
  // Check end game condition
  if (gameState.trainsRemaining <= 3 && !gameState.finalRoundTriggered) {
    gameState.finalRoundTriggered = true;
    setMessage("Final round! Game will end after this turn.", 180);
  }
  
  if (gameState.finalRoundTriggered) {
    endGame(p);
  }
}

function endGame(p) {
  // Calculate final score
  let finalScore = gameState.score;
  
  // Subtract incomplete destinations
  gameState.playerDestinations.forEach(dest => {
    if (!dest.completed) {
      finalScore -= dest.points;
    }
  });
  
  // Add longest path bonus
  const longestPath = calculateLongestPath(gameState.claimedRoutes, gameState.cities);
  if (longestPath >= 6) {
    finalScore += 10;
    setMessage(`Longest path bonus! +10 points (${longestPath} trains)`, 300);
  }
  
  gameState.score = finalScore;
  
  // Determine win/lose
  if (finalScore >= 60) {
    gameState.gamePhase = "GAME_OVER_WIN";
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, score: finalScore },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}