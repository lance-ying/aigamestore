// gameplay.js - Gameplay mechanics

import { gameState } from './globals.js';
import { checkWinCondition } from './game_logic.js';

let hotspotIndex = 0;

export function handleGameplayInput(keyCode) {
  // Close case file
  if (keyCode === 90) { // Z
    gameState.showCaseFile = !gameState.showCaseFile;
    return;
  }

  // If case file is open, only Z works
  if (gameState.showCaseFile) {
    return;
  }

  // If dialogue is active
  if (gameState.dialogueState) {
    handleDialogueInput(keyCode);
    return;
  }

  // If puzzle is active
  if (gameState.puzzleActive !== null) {
    handlePuzzleInput(keyCode);
    return;
  }

  const currentLoc = gameState.locations[gameState.currentLocation];
  const hotspots = currentLoc.hotspots;

  // Arrow keys to cycle through hotspots
  if (keyCode === 37 || keyCode === 38) { // LEFT or UP
    hotspotIndex = (hotspotIndex - 1 + hotspots.length) % hotspots.length;
    gameState.selectedHotspot = hotspots[hotspotIndex];
  } else if (keyCode === 39 || keyCode === 40) { // RIGHT or DOWN
    hotspotIndex = (hotspotIndex + 1) % hotspots.length;
    gameState.selectedHotspot = hotspots[hotspotIndex];
  } else if (keyCode === 32) { // SPACE - interact
    if (gameState.selectedHotspot) {
      interactWithHotspot(gameState.selectedHotspot);
    } else if (hotspots.length > 0) {
      gameState.selectedHotspot = hotspots[0];
      hotspotIndex = 0;
    }
  }
}

function interactWithHotspot(hotspot) {
  if (hotspot.type === 'clue' && !hotspot.isInteracted) {
    collectClue(hotspot.clueId);
    hotspot.isInteracted = true;
  } else if (hotspot.type === 'suspect') {
    startDialogue(hotspot.clueId);
  } else if (hotspot.type === 'puzzle') {
    startPuzzle(hotspot.clueId);
  } else if (hotspot.type === 'exit') {
    changeLocation(hotspot.clueId);
  }
}

function collectClue(clueId) {
  const clue = gameState.clues[clueId];
  if (!clue.collected) {
    clue.collected = true;
    gameState.collectedClues.push(clueId);
    gameState.requiredCluesCollected++;
    gameState.score += 100;
    checkWinCondition();
  }
}

function startDialogue(suspectId) {
  const suspect = gameState.suspects[suspectId];
  if (!suspect.interrogated) {
    gameState.dialogueState = {
      suspectId: suspectId,
      currentNode: 0,
      finished: false
    };
  }
}

function handleDialogueInput(keyCode) {
  const suspect = gameState.suspects[gameState.dialogueState.suspectId];
  const currentNode = suspect.dialogue[gameState.dialogueState.currentNode];
  
  if (keyCode === 32) { // SPACE - continue dialogue
    if (currentNode.next === -1) {
      // End dialogue
      if (!suspect.interrogated) {
        suspect.interrogated = true;
        gameState.interrogatedSuspects.push(gameState.dialogueState.suspectId);
        gameState.requiredSuspectsInterrogated++;
        gameState.score += 150;
        checkWinCondition();
      }
      gameState.dialogueState = null;
    } else {
      gameState.dialogueState.currentNode = currentNode.next;
    }
  }
}

function startPuzzle(puzzleId) {
  const puzzle = gameState.puzzles[puzzleId];
  if (!puzzle.solved) {
    gameState.puzzleActive = {
      puzzleId: puzzleId,
      currentInput: [],
      cursorPos: 0
    };
  }
}

function handlePuzzleInput(keyCode) {
  const puzzle = gameState.puzzles[gameState.puzzleActive.puzzleId];
  
  // Arrow keys to change numbers
  if (keyCode === 37) { // LEFT
    gameState.puzzleActive.cursorPos = Math.max(0, gameState.puzzleActive.cursorPos - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.puzzleActive.cursorPos = Math.min(puzzle.solution.length - 1, gameState.puzzleActive.cursorPos + 1);
  } else if (keyCode === 38) { // UP
    if (!gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos]) {
      gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] = 0;
    }
    gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] = 
      (gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] + 1) % 10;
  } else if (keyCode === 40) { // DOWN
    if (!gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos]) {
      gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] = 0;
    }
    gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] = 
      (gameState.puzzleActive.currentInput[gameState.puzzleActive.cursorPos] - 1 + 10) % 10;
  } else if (keyCode === 32) { // SPACE - check solution
    checkPuzzleSolution();
  }
}

function checkPuzzleSolution() {
  const puzzle = gameState.puzzles[gameState.puzzleActive.puzzleId];
  const correct = puzzle.solution.every((val, idx) => 
    val === gameState.puzzleActive.currentInput[idx]
  );
  
  if (correct) {
    puzzle.solved = true;
    gameState.solvedPuzzles.push(gameState.puzzleActive.puzzleId);
    gameState.requiredPuzzlesSolved++;
    gameState.score += 200;
    gameState.puzzleActive = null;
    checkWinCondition();
  }
}

function changeLocation(newLocationId) {
  if (newLocationId >= 0 && newLocationId < gameState.locations.length) {
    gameState.currentLocation = newLocationId;
    gameState.locations[newLocationId].visited = true;
    gameState.selectedHotspot = null;
    hotspotIndex = 0;
  }
}

export function updateGameplay(frameCount) {
  const currentLoc = gameState.locations[gameState.currentLocation];
  
  // Update hotspots
  currentLoc.hotspots.forEach(hotspot => {
    hotspot.update(frameCount);
  });
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) entity.update();
  });
}