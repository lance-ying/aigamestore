// input.js - Input handling

import { gameState } from './globals.js';
import { 
  handleBid, 
  handlePass, 
  handleTakeSkat, 
  handleDiscardCard, 
  handleGameTypeSelection, 
  handlePlayCard,
  handleRoundContinue
} from './gameLogic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.noLoop();
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.loop();
    }
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Gameplay controls
  if (gameState.biddingPhase) {
    if (keyCode === 38) { // Arrow Up
      handleBid();
    } else if (keyCode === 40) { // Arrow Down
      handlePass();
    }
  } else if (!gameState.skatTaken && gameState.declarer === 0) {
    if (keyCode === 16) { // Shift
      handleTakeSkat();
    }
  } else if (gameState.cardsToDiscard > 0 && gameState.declarer === 0) {
    if (keyCode === 37) { // Arrow Left
      const hand = gameState.playerHands[0];
      gameState.selectedCardIndex = (gameState.selectedCardIndex - 1 + hand.length) % hand.length;
    } else if (keyCode === 39) { // Arrow Right
      const hand = gameState.playerHands[0];
      gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % hand.length;
    } else if (keyCode === 90) { // Z
      handleDiscardCard();
    }
  } else if (!gameState.gameType && gameState.declarer === 0) {
    if (keyCode === 37) { // Arrow Left
      gameState.selectedGameTypeIndex = (gameState.selectedGameTypeIndex - 1 + 5) % 5;
    } else if (keyCode === 39) { // Arrow Right
      gameState.selectedGameTypeIndex = (gameState.selectedGameTypeIndex + 1) % 5;
    } else if (keyCode === 32) { // Space
      handleGameTypeSelection();
    }
  } else if (gameState.gameType && !gameState.roundComplete) {
    if (keyCode === 37) { // Arrow Left
      const hand = gameState.playerHands[0];
      if (hand.length > 0) {
        gameState.selectedCardIndex = (gameState.selectedCardIndex - 1 + hand.length) % hand.length;
      }
    } else if (keyCode === 39) { // Arrow Right
      const hand = gameState.playerHands[0];
      if (hand.length > 0) {
        gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % hand.length;
      }
    } else if (keyCode === 32) { // Space
      handlePlayCard();
    }
  } else if (gameState.roundComplete) {
    if (keyCode === 32) { // Space
      handleRoundContinue();
    }
  }
}