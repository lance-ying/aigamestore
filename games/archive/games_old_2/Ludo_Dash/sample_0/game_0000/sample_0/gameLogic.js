// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, TURN_PHASES, PLAYERS, LEVEL_CONFIGS } from './globals.js';
import { Piece } from './piece.js';
import { generateBoardPath, generateSafeSpots, generateTrapSpots, getHomeBasePositions } from './board.js';
import { makeAIDecision } from './ai.js';

export function initializeGame(p) {
  // Load high score
  const savedHighScore = localStorage.getItem('ludoDashHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }
  
  // Generate board
  gameState.boardPath = generateBoardPath();
  
  // Initialize level 1
  initializeLevel(p);
}

export function initializeLevel(p) {
  const config = LEVEL_CONFIGS[gameState.currentLevel];
  
  // Reset state
  gameState.currentPlayer = PLAYERS.PLAYER;
  gameState.currentTurnPhase = TURN_PHASES.ROLL_DICE;
  gameState.diceValue = 0;
  gameState.rollAgain = false;
  gameState.eligiblePieces = [];
  gameState.selectedPieceIndex = 0;
  gameState.animatingPiece = null;
  gameState.animationProgress = 0;
  gameState.animationSteps = [];
  gameState.animationCurrentStep = 0;
  gameState.playerFinishedCount = 0;
  gameState.aiFinishedCount = 0;
  
  // Generate safe spots and traps
  gameState.safeSpots = generateSafeSpots(config.safeSpotCount);
  gameState.trapSpots = generateTrapSpots(config.trapCount);
  
  // Initialize pieces
  const homeBasePos = getHomeBasePositions();
  
  gameState.playerPieces = [];
  for (let i = 0; i < 4; i++) {
    const piece = new Piece(i, PLAYERS.PLAYER, homeBasePos.player[i]);
    gameState.playerPieces.push(piece);
  }
  
  gameState.aiPieces = [];
  for (let i = 0; i < 4; i++) {
    const piece = new Piece(i, PLAYERS.AI, homeBasePos.ai[i]);
    gameState.aiPieces.push(piece);
  }
  
  // Set up AI starting positions
  for (let i = 0; i < config.aiStartingPieces; i++) {
    const piece = gameState.aiPieces[i];
    const startPos = config.aiStartingPositions[i];
    
    if (startPos >= 40) {
      // In home column
      piece.inHomeBase = false;
      piece.inHomeColumn = true;
      piece.homeColumnSteps = startPos - 39;
    } else {
      // On main track
      piece.inHomeBase = false;
      piece.currentPathIndex = (gameState.aiHomeEntryIndex + startPos) % gameState.boardPath.length;
      const pos = gameState.boardPath[piece.currentPathIndex];
      piece.x = pos.x;
      piece.y = pos.y;
    }
  }
  
  // Set player reference for logging
  gameState.player = {
    x: homeBasePos.player[0].x,
    y: homeBasePos.player[0].y
  };
}

export function rollDice(p) {
  gameState.diceValue = Math.floor(p.random() * 6) + 1;
  gameState.rollAgain = (gameState.diceValue === 6);
  
  // Log the roll
  p.logs.game_info.push({
    data: { phase: "DICE_ROLLED", player: gameState.currentPlayer, value: gameState.diceValue },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Find eligible pieces
  const pieces = gameState.currentPlayer === PLAYERS.PLAYER ? 
    gameState.playerPieces : gameState.aiPieces;
  const homeEntryIndex = gameState.currentPlayer === PLAYERS.PLAYER ? 
    gameState.playerHomeEntryIndex : gameState.aiHomeEntryIndex;
  
  gameState.eligiblePieces = pieces.filter(piece => 
    piece.canMove(gameState.diceValue, homeEntryIndex)
  );
  
  if (gameState.eligiblePieces.length === 0) {
    // No valid moves, end turn
    setTimeout(() => endTurn(), 1000);
  } else if (gameState.eligiblePieces.length === 1) {
    // Auto-select the only piece
    gameState.selectedPieceIndex = 0;
    setTimeout(() => confirmMove(p), 500);
  } else {
    // Player needs to select
    if (gameState.currentPlayer === PLAYERS.PLAYER) {
      gameState.currentTurnPhase = TURN_PHASES.SELECT_PIECE;
      gameState.selectedPieceIndex = 0;
    } else {
      // AI selects
      setTimeout(() => {
        const selectedPiece = makeAIDecision();
        if (selectedPiece) {
          gameState.selectedPieceIndex = gameState.eligiblePieces.indexOf(selectedPiece);
          confirmMove(p);
        } else {
          endTurn();
        }
      }, 800);
    }
  }
}

export function confirmMove(p) {
  const piece = gameState.eligiblePieces[gameState.selectedPieceIndex];
  if (!piece) return;
  
  gameState.currentTurnPhase = TURN_PHASES.ANIMATE_MOVE;
  
  // Calculate animation path
  const homeEntryIndex = piece.owner === PLAYERS.PLAYER ? 
    gameState.playerHomeEntryIndex : gameState.aiHomeEntryIndex;
  
  gameState.animationSteps = calculateMovePath(piece, gameState.diceValue, homeEntryIndex);
  gameState.animatingPiece = piece;
  gameState.animationProgress = 0;
  gameState.animationCurrentStep = 0;
}

function calculateMovePath(piece, diceValue, homeEntryIndex) {
  const steps = [];
  
  if (piece.inHomeBase) {
    steps.push({ x: piece.homeBasePos.x, y: piece.homeBasePos.y });
    const pos = gameState.boardPath[homeEntryIndex];
    steps.push({ x: pos.x, y: pos.y });
    return steps;
  }
  
  if (piece.inHomeColumn) {
    const newSteps = piece.homeColumnSteps + diceValue;
    for (let i = piece.homeColumnSteps; i <= Math.min(newSteps, 5); i++) {
      const pos = getHomeColumnPos(piece.owner, i);
      steps.push({ x: pos.x, y: pos.y });
    }
    return steps;
  }
  
  let currentIndex = piece.currentPathIndex;
  for (let i = 0; i < diceValue; i++) {
    currentIndex = (currentIndex + 1) % gameState.boardPath.length;
    const pos = gameState.boardPath[currentIndex];
    steps.push({ x: pos.x, y: pos.y });
    
    if (currentIndex === homeEntryIndex) {
      // Entering home column
      for (let j = 1; j <= diceValue - i - 1; j++) {
        const homePos = getHomeColumnPos(piece.owner, j);
        steps.push({ x: homePos.x, y: homePos.y });
      }
      break;
    }
  }
  
  return steps;
}

function getHomeColumnPos(owner, step) {
  const centerX = 300;
  const centerY = 200;
  const squareSize = 18;
  
  if (owner === PLAYERS.PLAYER) {
    return { x: centerX, y: centerY + squareSize * 2 - (step - 1) * squareSize };
  } else {
    return { x: centerX, y: centerY - squareSize * 3 + (step - 1) * squareSize };
  }
}

export function updateAnimation(p) {
  if (!gameState.animatingPiece) return;
  
  gameState.animationProgress += 0.15;
  
  if (gameState.animationProgress >= 1) {
    gameState.animationProgress = 0;
    gameState.animationCurrentStep++;
    
    if (gameState.animationCurrentStep >= gameState.animationSteps.length) {
      // Animation complete, apply move
      finalizePieceMove(p);
      return;
    }
  }
  
  // Update piece position
  if (gameState.animationCurrentStep < gameState.animationSteps.length) {
    const prevStep = gameState.animationCurrentStep === 0 ? 
      { x: gameState.animatingPiece.x, y: gameState.animatingPiece.y } :
      gameState.animationSteps[gameState.animationCurrentStep - 1];
    const nextStep = gameState.animationSteps[gameState.animationCurrentStep];
    
    gameState.animatingPiece.x = p.lerp(prevStep.x, nextStep.x, gameState.animationProgress);
    gameState.animatingPiece.y = p.lerp(prevStep.y, nextStep.y, gameState.animationProgress);
  }
}

function finalizePieceMove(p) {
  const piece = gameState.animatingPiece;
  const homeEntryIndex = piece.owner === PLAYERS.PLAYER ? 
    gameState.playerHomeEntryIndex : gameState.aiHomeEntryIndex;
  
  const wasInHomeBase = piece.inHomeBase;
  
  piece.movePiece(gameState.diceValue, gameState.boardPath, homeEntryIndex);
  
  // Update finished count
  if (piece.isFinished) {
    if (piece.owner === PLAYERS.PLAYER) {
      gameState.playerFinishedCount++;
      gameState.currentScore += 200;
      
      p.logs.game_info.push({
        data: { event: "PLAYER_PIECE_FINISHED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameState.aiFinishedCount++;
    }
  }
  
  // Award points for leaving home base
  if (wasInHomeBase && piece.owner === PLAYERS.PLAYER) {
    gameState.currentScore += 50;
  }
  
  // Check for cuts
  if (!piece.inHomeBase && !piece.inHomeColumn && !piece.isFinished) {
    checkForCuts(p, piece);
  }
  
  // Check for trap
  if (piece.owner === PLAYERS.PLAYER && 
      !piece.inHomeBase && 
      !piece.inHomeColumn && 
      gameState.trapSpots.includes(piece.currentPathIndex)) {
    piece.isStuck = true;
    
    p.logs.game_info.push({
      data: { event: "PLAYER_PIECE_TRAPPED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check win conditions
  if (gameState.playerFinishedCount >= 4) {
    gameState.currentScore += 500;
    updateHighScore();
    
    if (gameState.currentLevel < 3) {
      gameState.currentLevel++;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel, score: gameState.currentScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.animatingPiece = null;
    return;
  }
  
  if (gameState.aiFinishedCount >= 4) {
    updateHighScore();
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, score: gameState.currentScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.animatingPiece = null;
    return;
  }
  
  // Log player position
  if (piece.owner === PLAYERS.PLAYER) {
    p.logs.player_info.push({
      screen_x: piece.x,
      screen_y: piece.y,
      game_x: piece.currentPathIndex,
      game_y: piece.homeColumnSteps,
      framecount: p.frameCount
    });
  }
  
  gameState.animatingPiece = null;
  
  // End turn or roll again
  if (gameState.rollAgain) {
    gameState.currentTurnPhase = TURN_PHASES.ROLL_DICE;
    gameState.rollAgain = false;
    
    if (gameState.currentPlayer === PLAYERS.AI) {
      setTimeout(() => rollDice(p), 500);
    }
  } else {
    endTurn();
  }
}

function checkForCuts(p, movingPiece) {
  const targetIndex = movingPiece.currentPathIndex;
  
  if (gameState.safeSpots.includes(targetIndex)) return;
  
  const opponentPieces = movingPiece.owner === PLAYERS.PLAYER ? 
    gameState.aiPieces : gameState.playerPieces;
  
  opponentPieces.forEach(opPiece => {
    if (!opPiece.inHomeBase && 
        !opPiece.inHomeColumn && 
        !opPiece.isFinished && 
        opPiece.currentPathIndex === targetIndex) {
      
      opPiece.sendHome();
      
      if (movingPiece.owner === PLAYERS.PLAYER) {
        gameState.currentScore += 100;
        
        p.logs.game_info.push({
          data: { event: "AI_PIECE_CUT" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.currentScore = Math.max(0, gameState.currentScore - 25);
        
        p.logs.game_info.push({
          data: { event: "PLAYER_PIECE_CUT" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  });
}

function endTurn() {
  // Clear stuck status for pieces
  const currentPieces = gameState.currentPlayer === PLAYERS.PLAYER ? 
    gameState.playerPieces : gameState.aiPieces;
  currentPieces.forEach(piece => {
    if (piece.isStuck) {
      piece.isStuck = false;
    }
  });
  
  // Switch players
  gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER ? 
    PLAYERS.AI : PLAYERS.PLAYER;
  gameState.currentTurnPhase = TURN_PHASES.ROLL_DICE;
  gameState.eligiblePieces = [];
  gameState.selectedPieceIndex = 0;
  
  // AI turn
  if (gameState.currentPlayer === PLAYERS.AI) {
    setTimeout(() => rollDice(window.gameInstance), 1000);
  }
}

function updateHighScore() {
  if (gameState.currentScore > gameState.highScore) {
    gameState.highScore = gameState.currentScore;
    localStorage.setItem('ludoDashHighScore', gameState.highScore.toString());
  }
}

export function resetGame(p) {
  gameState.currentLevel = 1;
  gameState.currentScore = 0;
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  initializeLevel(p);
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function advanceLevel(p) {
  initializeLevel(p);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}