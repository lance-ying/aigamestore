// puzzle.js - Puzzle logic and checking

import { gameState, PUZZLES } from './globals.js';

export function loadPuzzle(puzzleIndex) {
  if (puzzleIndex >= PUZZLES.length) {
    return false; // No more puzzles
  }
  
  const puzzle = PUZZLES[puzzleIndex];
  gameState.currentPuzzleIndex = puzzleIndex;
  gameState.currentLevel = puzzle.level;
  gameState.puzzleSolved = false;
  gameState.hintUsedCount = 0;
  gameState.showHint = false;
  gameState.selectedObjectIndex = 0;
  
  // Deep copy elements
  gameState.interactiveElements = JSON.parse(JSON.stringify(puzzle.elements));
  
  return true;
}

export function checkWinCondition(p) {
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  const elements = gameState.interactiveElements;
  
  switch (puzzle.winCondition) {
    case "tapGreen":
      const greenCircle = elements.find(e => e.id === "greenCircle");
      return greenCircle && greenCircle.tapped === true;
      
    case "dragBoxRight":
      const box = elements.find(e => e.id === "box");
      return box && box.x > 450;
      
    case "swipeAppleDown":
      const apple = elements.find(e => e.id === "apple");
      return apple && apple.y > 320;
      
    case "unlockChest":
      const key = elements.find(e => e.id === "key");
      const lock = elements.find(e => e.id === "lock");
      if (key && lock && key.pickedUp) {
        const dist = p.dist(key.x, key.y, lock.x, lock.y);
        return dist < 20;
      }
      return false;
      
    case "bloomFlower":
      const cloud = elements.find(e => e.id === "cloud");
      const flower = elements.find(e => e.id === "flower");
      return cloud && flower && cloud.raining && flower.bloomed;
      
    case "stackBoxes":
      const box1 = elements.find(e => e.id === "box1");
      const box2 = elements.find(e => e.id === "box2");
      const box3 = elements.find(e => e.id === "box3");
      const star = elements.find(e => e.id === "star");
      
      if (box1 && box2 && box3 && star) {
        // Check if any box is near the star
        const dist1 = p.dist(box1.x, box1.y, star.x, star.y);
        const dist2 = p.dist(box2.x, box2.y, star.x, star.y);
        const dist3 = p.dist(box3.x, box3.y, star.x, star.y);
        return dist1 < 80 || dist2 < 80 || dist3 < 80;
      }
      return false;
      
    case "revealSun":
      const sky = elements.find(e => e.id === "sky");
      return sky && sky.offsetY > 80;
      
    case "findHiddenButton":
      const hiddenButton = elements.find(e => e.id === "hiddenButton");
      const movableBlock = elements.find(e => e.id === "movableBlock");
      if (movableBlock && movableBlock.x > 500) {
        if (hiddenButton) hiddenButton.visible = true;
      }
      return hiddenButton && hiddenButton.tapped === true;
      
    case "arrangeColors":
      const yellowDot = elements.find(e => e.id === "yellowDot");
      const greenDot = elements.find(e => e.id === "greenDot");
      const redDot = elements.find(e => e.id === "redDot");
      
      if (yellowDot && greenDot && redDot) {
        const redCorrect = Math.abs(redDot.y - 120) < 30 && Math.abs(redDot.x - 300) < 50;
        const yellowCorrect = Math.abs(yellowDot.y - 200) < 30 && Math.abs(yellowDot.x - 300) < 50;
        const greenCorrect = Math.abs(greenDot.y - 280) < 30 && Math.abs(greenDot.x - 300) < 50;
        return redCorrect && yellowCorrect && greenCorrect;
      }
      return false;
      
    default:
      return false;
  }
}

export function getCurrentPuzzle() {
  return PUZZLES[gameState.currentPuzzleIndex];
}

export function getInteractiveElements() {
  return gameState.interactiveElements.filter(e => e.interactive);
}

export function updatePuzzleLogic(p) {
  const elements = gameState.interactiveElements;
  
  // Puzzle-specific continuous logic
  const puzzle = PUZZLES[gameState.currentPuzzleIndex];
  
  if (puzzle.winCondition === "bloomFlower") {
    const cloud = elements.find(e => e.id === "cloud");
    const flower = elements.find(e => e.id === "flower");
    
    if (cloud && cloud.raining && flower && !flower.bloomed) {
      // Gradually bloom the flower
      if (!flower.bloomProgress) flower.bloomProgress = 0;
      flower.bloomProgress += 0.5;
      if (flower.bloomProgress >= 60) {
        flower.bloomed = true;
        flower.petalSize = 30;
      }
    }
  }
  
  if (puzzle.winCondition === "swipeAppleDown") {
    const apple = elements.find(e => e.id === "apple");
    if (apple && apple.falling) {
      apple.y += 3;
      if (apple.y >= 350) {
        apple.y = 350;
        apple.falling = false;
      }
    }
  }
}