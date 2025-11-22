// ai.js
import { gameState, PLAYERS } from './globals.js';
import { movePiece, dropPiece, getValidDropSquares, checkWinCondition } from './board.js';

export function executeAIMove(p) {
  if (gameState.controlMode === 'TEST_1') {
    executeTest1(p);
  } else if (gameState.controlMode === 'TEST_2') {
    executeTest2(p);
  }
}

function executeTest1(p) {
  // Test basic movement and turn alternation
  const moves = [
    // Player 1 moves chick forward
    { player: PLAYERS.PLAYER1, from: [2, 1], to: [1, 1] },
    // Player 2 moves chick forward
    { player: PLAYERS.PLAYER2, from: [1, 1], to: [2, 1] },
    // Player 1 moves elephant
    { player: PLAYERS.PLAYER1, from: [3, 0], to: [2, 1] },
    // Player 2 moves elephant
    { player: PLAYERS.PLAYER2, from: [0, 2], to: [1, 1] },
    // Player 1 moves giraffe
    { player: PLAYERS.PLAYER1, from: [3, 2], to: [2, 2] },
  ];

  if (p.frameCount % 30 === 0 && gameState.testSequenceIndex < moves.length) {
    const move = moves[gameState.testSequenceIndex];
    
    if (gameState.currentPlayer === move.player) {
      const [fromRow, fromCol] = move.from;
      const [toRow, toCol] = move.to;
      const piece = gameState.board[fromRow][fromCol];
      
      if (piece && piece.player === move.player) {
        movePiece(piece, toRow, toCol, gameState.board);
        
        p.logs.player_info.push({
          screen_x: toCol * 80 + 150,
          screen_y: toRow * 80 + 50,
          game_x: toCol,
          game_y: toRow,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        const winner = checkWinCondition(gameState.board);
        if (winner) {
          gameState.winner = winner;
          gameState.gamePhase = 'GAME_OVER_WIN';
        } else {
          gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER1 
            ? PLAYERS.PLAYER2 
            : PLAYERS.PLAYER1;
        }
        
        gameState.testSequenceIndex++;
      }
    }
  }
}

function executeTest2(p) {
  // Test win by moving Lion to opponent's back row
  const moves = [
    // Create a path for Player 1's Lion to advance
    { player: PLAYERS.PLAYER1, from: [2, 1], to: [1, 1] }, // Chick forward
    { player: PLAYERS.PLAYER2, from: [1, 1], to: [2, 1] }, // Move away
    { player: PLAYERS.PLAYER1, from: [3, 1], to: [2, 1] }, // Lion forward
    { player: PLAYERS.PLAYER2, from: [0, 0], to: [1, 0] }, // Giraffe moves
    { player: PLAYERS.PLAYER1, from: [2, 1], to: [1, 1] }, // Lion forward
    { player: PLAYERS.PLAYER2, from: [1, 0], to: [2, 0] }, // Giraffe moves
    { player: PLAYERS.PLAYER1, from: [1, 1], to: [0, 1] }, // Lion to back row - WIN
  ];

  if (p.frameCount % 30 === 0 && gameState.testSequenceIndex < moves.length) {
    const move = moves[gameState.testSequenceIndex];
    
    if (gameState.currentPlayer === move.player) {
      const [fromRow, fromCol] = move.from;
      const [toRow, toCol] = move.to;
      const piece = gameState.board[fromRow][fromCol];
      
      if (piece && piece.player === move.player) {
        movePiece(piece, toRow, toCol, gameState.board);
        
        p.logs.player_info.push({
          screen_x: toCol * 80 + 150,
          screen_y: toRow * 80 + 50,
          game_x: toCol,
          game_y: toRow,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        const winner = checkWinCondition(gameState.board);
        if (winner) {
          gameState.winner = winner;
          gameState.gamePhase = 'GAME_OVER_WIN';
          
          p.logs.game_info.push({
            data: { gamePhase: 'GAME_OVER_WIN', winner: winner },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          gameState.currentPlayer = gameState.currentPlayer === PLAYERS.PLAYER1 
            ? PLAYERS.PLAYER2 
            : PLAYERS.PLAYER1;
        }
        
        gameState.testSequenceIndex++;
      }
    }
  }
}