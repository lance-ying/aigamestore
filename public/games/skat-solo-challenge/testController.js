// testController.js - Automated testing controller

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

let testTimer = 0;

export function updateTestController(p) {
  testTimer++;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - play through game
    if (gameState.gamePhase === "START" && testTimer % 60 === 0) {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (gameState.gamePhase === "PLAYING") {
      if (gameState.biddingPhase && testTimer % 30 === 0) {
        if (Math.random() < 0.5) {
          handleBid();
        } else {
          handlePass();
        }
      } else if (!gameState.skatTaken && gameState.declarer === 0 && testTimer % 30 === 0) {
        handleTakeSkat();
      } else if (gameState.cardsToDiscard > 0 && testTimer % 20 === 0) {
        handleDiscardCard();
      } else if (!gameState.gameType && gameState.declarer === 0 && testTimer % 30 === 0) {
        handleGameTypeSelection();
      } else if (gameState.gameType && !gameState.roundComplete && 
                 gameState.currentPlayerIndex === 0 && testTimer % 40 === 0) {
        handlePlayCard();
      } else if (gameState.roundComplete && testTimer % 60 === 0) {
        handleRoundContinue();
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win test - always bid high and play well
    if (gameState.gamePhase === "START" && testTimer % 60 === 0) {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (gameState.gamePhase === "PLAYING") {
      if (gameState.biddingPhase && testTimer % 30 === 0) {
        handleBid(); // Always bid
      } else if (!gameState.skatTaken && gameState.declarer === 0 && testTimer % 30 === 0) {
        handleTakeSkat();
      } else if (gameState.cardsToDiscard > 0 && testTimer % 20 === 0) {
        handleDiscardCard();
      } else if (!gameState.gameType && gameState.declarer === 0 && testTimer % 30 === 0) {
        handleGameTypeSelection();
      } else if (gameState.gameType && !gameState.roundComplete && 
                 gameState.currentPlayerIndex === 0 && testTimer % 40 === 0) {
        handlePlayCard();
      } else if (gameState.roundComplete && testTimer % 60 === 0) {
        handleRoundContinue();
      }
    }
  }
}