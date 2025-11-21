// ai.js - AI logic

import { gameState } from './globals.js';
import { getAllPossibleMoves, swapGems } from './board.js';

export function calculateAIMove(p) {
  const difficulty = gameState.levelConfig.aiDifficulty;
  const possibleMoves = getAllPossibleMoves();
  
  if (possibleMoves.length === 0) return null;
  
  if (difficulty === "VERY_LOW") {
    // Random valid move
    return possibleMoves[Math.floor(p.random(possibleMoves.length))];
  } else if (difficulty === "LOW") {
    // Prefer 4+ matches
    const scoredMoves = possibleMoves.map(move => {
      swapGems(move.x1, move.y1, move.x2, move.y2);
      const score = evaluateBoard();
      swapGems(move.x1, move.y1, move.x2, move.y2);
      return { move, score };
    });
    
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  } else if (difficulty === "MEDIUM" || difficulty === "HIGH") {
    // Advanced scoring with cascade potential
    const scoredMoves = possibleMoves.map(move => {
      swapGems(move.x1, move.y1, move.x2, move.y2);
      const score = evaluateBoardAdvanced(difficulty === "HIGH");
      swapGems(move.x1, move.y1, move.x2, move.y2);
      return { move, score };
    });
    
    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0].move;
  }
  
  return possibleMoves[0];
}

function evaluateBoard() {
  let score = 0;
  const matches = findMatchesForEval();
  
  matches.forEach(match => {
    const size = match.length;
    if (size === 3) score += 10;
    else if (size === 4) score += 25;
    else score += 50;
  });
  
  return score;
}

function evaluateBoardAdvanced(isHigh) {
  let score = evaluateBoard();
  
  // Bonus for potential cascades
  const matches = findMatchesForEval();
  if (matches.length > 1) {
    score += 50 * matches.length;
  }
  
  // Bonus for 5+ matches
  matches.forEach(match => {
    if (match.length >= 5) score += 100;
  });
  
  // High difficulty: consider booster charge
  if (isHigh) {
    const hasRedCircle = matches.some(match => {
      return match.some(pos => {
        const gem = gameState.board[pos.y][pos.x];
        return gem === 7; // GEM_RED_CIRCLE
      });
    });
    if (hasRedCircle) score += 30;
  }
  
  return score;
}

function findMatchesForEval() {
  const matches = [];
  const { boardWidth, boardHeight } = gameState;
  
  // Horizontal matches
  for (let y = 0; y < boardHeight; y++) {
    let matchStart = 0;
    for (let x = 1; x < boardWidth; x++) {
      const currentGem = gameState.board[y][x];
      const prevGem = gameState.board[y][x - 1];
      
      if (currentGem === prevGem && currentGem !== -1 && currentGem !== 8) {
        // Continue
      } else {
        if (x - matchStart >= 3) {
          const match = [];
          for (let i = matchStart; i < x; i++) {
            match.push({ x: i, y: y });
          }
          matches.push(match);
        }
        matchStart = x;
      }
    }
    if (boardWidth - matchStart >= 3) {
      const match = [];
      for (let i = matchStart; i < boardWidth; i++) {
        match.push({ x: i, y: y });
      }
      matches.push(match);
    }
  }
  
  // Vertical matches
  for (let x = 0; x < boardWidth; x++) {
    let matchStart = 0;
    for (let y = 1; y < boardHeight; y++) {
      const currentGem = gameState.board[y][x];
      const prevGem = gameState.board[y - 1][x];
      
      if (currentGem === prevGem && currentGem !== -1 && currentGem !== 8) {
        // Continue
      } else {
        if (y - matchStart >= 3) {
          const match = [];
          for (let i = matchStart; i < y; i++) {
            match.push({ x: x, y: i });
          }
          matches.push(match);
        }
        matchStart = y;
      }
    }
    if (boardHeight - matchStart >= 3) {
      const match = [];
      for (let i = matchStart; i < boardHeight; i++) {
        match.push({ x: x, y: i });
      }
      matches.push(match);
    }
  }
  
  return matches;
}