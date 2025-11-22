// narrative_engine.js - Handles story progression and dialogue

import { gameState } from './globals.js';
import { getNodeData, isEnding } from './story_data.js';

export function advanceDialogue(p) {
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData) {
    console.error("Invalid node:", gameState.currentNode);
    return;
  }
  
  // Check if text is fully displayed
  if (!gameState.textFullyDisplayed) {
    // Skip to full text
    gameState.textToDisplay = currentNodeData.text;
    gameState.textFullyDisplayed = true;
    return;
  }
  
  // If node has choices, don't auto-advance
  if (currentNodeData.choices && currentNodeData.choices.length > 0) {
    return;
  }
  
  // If node has next, advance to it
  if (currentNodeData.next) {
    transitionToNode(currentNodeData.next, p);
  } else if (isEnding(gameState.currentNode)) {
    // Game over
    const endingData = currentNodeData;
    if (endingData.ending) {
      gameState.player.unlockEnding(endingData.ending);
      gameState.endingsReached.add(endingData.ending);
      
      // Check for true ending condition
      if (endingData.ending === "true_ending" || shouldShowTrueEnding()) {
        gameState.gamePhase = "GAME_OVER_WIN";
      } else {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
      
      // Log game over
      p.logs.game_info.push({
        data: {
          phase: gameState.gamePhase,
          ending: endingData.ending,
          endingsUnlocked: gameState.player.getProgress()
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function selectChoice(choiceIndex, p) {
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData || !currentNodeData.choices) {
    return;
  }
  
  if (choiceIndex >= 0 && choiceIndex < currentNodeData.choices.length) {
    const choice = currentNodeData.choices[choiceIndex];
    transitionToNode(choice.next, p);
  }
}

export function transitionToNode(nodeId, p) {
  gameState.previousNode = gameState.currentNode;
  gameState.currentNode = nodeId;
  gameState.dialogueIndex = 0;
  gameState.choiceIndex = 0;
  gameState.textToDisplay = "";
  gameState.textFullyDisplayed = false;
  gameState.visitedNodes.add(nodeId);
  
  const nodeData = getNodeData(nodeId);
  if (nodeData && nodeData.effect === "glitch") {
    gameState.glitchEffect = true;
  } else {
    gameState.glitchEffect = false;
  }
  
  // Log node transition
  p.logs.game_info.push({
    data: {
      event: "node_transition",
      from: gameState.previousNode,
      to: nodeId
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateTextReveal(p) {
  const currentNodeData = getNodeData(gameState.currentNode);
  
  if (!currentNodeData || gameState.textFullyDisplayed) {
    return;
  }
  
  const fullText = currentNodeData.text;
  const currentLength = gameState.textToDisplay.length;
  
  if (currentLength < fullText.length) {
    gameState.textToDisplay += fullText.substring(currentLength, currentLength + gameState.textRevealSpeed);
    
    if (gameState.textToDisplay.length >= fullText.length) {
      gameState.textToDisplay = fullText;
      gameState.textFullyDisplayed = true;
    }
  }
}

export function shouldShowTrueEnding() {
  // Show true ending if player has seen at least 8 unique endings
  return gameState.player.getProgress() >= 8;
}

export default {
  advanceDialogue,
  selectChoice,
  transitionToNode,
  updateTextReveal,
  shouldShowTrueEnding
};