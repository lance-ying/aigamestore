// rendering.js
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  BOARD_ROWS, 
  BOARD_COLS, 
  CELL_SIZE, 
  BOARD_OFFSET_X, 
  BOARD_OFFSET_Y,
  PIECE_TYPES,
  PLAYERS,
  gameState
} from './globals.js';

export function renderStartScreen(p) {
  p.background(245, 222, 179);
  
  // Title
  p.fill(139, 69, 19);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.textStyle(p.BOLD);
  p.text('どうぶつしょうぎ', CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.textStyle(p.NORMAL);
  p.text('Animal Shogi', CANVAS_WIDTH / 2, 120);

  // Instructions
  p.fill(101, 67, 33);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'Goal: Capture opponent\'s Lion or move your',
    'Lion to the opponent\'s back row.',
    '',
    'Controls:',
    '  Arrow Keys - Navigate cursor',
    '  SPACE - Select/Confirm',
    '  D - Toggle drop mode',
    '  ESC - Pause game',
    '',
    'Pieces:',
    '  Lion - Moves 1 square any direction',
    '  Giraffe - Moves 1 square orthogonal',
    '  Elephant - Moves 1 square diagonal',
    '  Chick - Moves 1 square forward',
    '           (promotes to Chicken)',
  ];

  let y = 160;
  for (const line of instructions) {
    p.text(line, 120, y);
    y += 18;
  }

  // Start prompt
  p.fill(178, 34, 34);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.textStyle(p.BOLD);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

export function renderGame(p) {
  p.background(245, 222, 179);

  // Draw board
  drawBoard(p);

  // Draw pieces
  drawPieces(p);

  // Draw valid moves
  drawValidMoves(p);

  // Draw cursor
  drawCursor(p);

  // Draw hands
  drawHands(p);

  // Draw UI
  drawUI(p);
}

function drawBoard(p) {
  p.stroke(139, 69, 19);
  p.strokeWeight(2);
  
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const x = BOARD_OFFSET_X + col * CELL_SIZE;
      const y = BOARD_OFFSET_Y + row * CELL_SIZE;
      
      // Promotion zones
      if (row === 0) {
        p.fill(255, 228, 196);
      } else if (row === BOARD_ROWS - 1) {
        p.fill(255, 228, 196);
      } else {
        p.fill(255, 248, 220);
      }
      
      p.rect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }
}

function drawPieces(p) {
  for (let row = 0; row < BOARD_ROWS; row++) {
    for (let col = 0; col < BOARD_COLS; col++) {
      const piece = gameState.board[row][col];
      if (piece) {
        drawPiece(p, piece, row, col);
      }
    }
  }
}

function drawPiece(p, piece, row, col) {
  const x = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
  const y = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

  p.push();
  p.translate(x, y);
  
  // Rotate player 2 pieces
  if (piece.player === PLAYERS.PLAYER2) {
    p.rotate(p.PI);
  }

  // Piece background
  const isSelected = gameState.selectedPiece === piece;
  if (isSelected) {
    p.fill(144, 238, 144);
  } else if (piece.player === PLAYERS.PLAYER1) {
    p.fill(255, 250, 205);
  } else {
    p.fill(255, 228, 225);
  }
  
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(-30, -30, 60, 60, 5);

  // Draw piece icon
  p.noStroke();
  switch (piece.type) {
    case PIECE_TYPES.LION:
      drawLion(p);
      break;
    case PIECE_TYPES.GIRAFFE:
      drawGiraffe(p);
      break;
    case PIECE_TYPES.ELEPHANT:
      drawElephant(p);
      break;
    case PIECE_TYPES.CHICK:
      drawChick(p);
      break;
    case PIECE_TYPES.CHICKEN:
      drawChicken(p);
      break;
  }

  p.pop();
}

function drawLion(p) {
  // Lion head
  p.fill(255, 165, 0);
  p.circle(0, 0, 30);
  
  // Mane
  p.fill(255, 140, 0);
  for (let angle = 0; angle < p.TWO_PI; angle += p.PI / 4) {
    const x = p.cos(angle) * 18;
    const y = p.sin(angle) * 18;
    p.circle(x, y, 12);
  }
  
  // Face
  p.fill(255, 165, 0);
  p.circle(0, 0, 24);
  
  // Eyes
  p.fill(0);
  p.circle(-6, -3, 4);
  p.circle(6, -3, 4);
  
  // Nose
  p.fill(139, 69, 19);
  p.triangle(-3, 3, 3, 3, 0, 7);
}

function drawGiraffe(p) {
  // Body
  p.fill(255, 215, 0);
  p.ellipse(0, 5, 25, 30);
  
  // Neck
  p.rect(-5, -15, 10, 20);
  
  // Head
  p.ellipse(0, -15, 18, 18);
  
  // Spots
  p.fill(184, 134, 11);
  p.circle(-5, 0, 6);
  p.circle(5, 5, 6);
  p.circle(0, -10, 5);
  
  // Eyes
  p.fill(0);
  p.circle(-3, -15, 3);
  p.circle(3, -15, 3);
  
  // Horns
  p.stroke(184, 134, 11);
  p.strokeWeight(2);
  p.line(-4, -22, -4, -18);
  p.line(4, -22, 4, -18);
}

function drawElephant(p) {
  // Body
  p.fill(169, 169, 169);
  p.ellipse(0, 2, 35, 30);
  
  // Head
  p.ellipse(0, -8, 28, 25);
  
  // Trunk
  p.noFill();
  p.stroke(169, 169, 169);
  p.strokeWeight(6);
  p.arc(0, -8, 15, 25, 0, p.PI);
  
  // Ears
  p.noStroke();
  p.fill(169, 169, 169);
  p.ellipse(-12, -8, 15, 20);
  p.ellipse(12, -8, 15, 20);
  
  // Eyes
  p.fill(0);
  p.circle(-6, -10, 4);
  p.circle(6, -10, 4);
}

function drawChick(p) {
  // Body
  p.fill(255, 255, 0);
  p.circle(0, 2, 28);
  
  // Head
  p.circle(0, -8, 20);
  
  // Eyes
  p.fill(0);
  p.circle(-4, -10, 4);
  p.circle(4, -10, 4);
  
  // Beak
  p.fill(255, 140, 0);
  p.triangle(-3, -5, 3, -5, 0, -2);
  
  // Wings
  p.fill(255, 215, 0);
  p.ellipse(-10, 2, 12, 18);
  p.ellipse(10, 2, 12, 18);
}

function drawChicken(p) {
  // Body (larger than chick)
  p.fill(255, 200, 0);
  p.ellipse(0, 3, 32, 32);
  
  // Head
  p.circle(0, -10, 22);
  
  // Comb
  p.fill(220, 20, 60);
  p.beginShape();
  p.vertex(-3, -20);
  p.vertex(-1, -18);
  p.vertex(0, -22);
  p.vertex(1, -18);
  p.vertex(3, -20);
  p.vertex(0, -15);
  p.endShape(p.CLOSE);
  
  // Eyes
  p.fill(0);
  p.circle(-5, -11, 4);
  p.circle(5, -11, 4);
  
  // Beak
  p.fill(255, 140, 0);
  p.triangle(-4, -7, 4, -7, 0, -3);
  
  // Wings
  p.fill(255, 180, 0);
  p.ellipse(-12, 3, 14, 20);
  p.ellipse(12, 3, 14, 20);
}

function drawValidMoves(p) {
  p.fill(255, 255, 0, 100);
  p.stroke(255, 215, 0);
  p.strokeWeight(3);
  
  for (const move of gameState.validMoves) {
    const x = BOARD_OFFSET_X + move.col * CELL_SIZE;
    const y = BOARD_OFFSET_Y + move.row * CELL_SIZE;
    p.rect(x, y, CELL_SIZE, CELL_SIZE);
  }
}

function drawCursor(p) {
  if (gameState.dropMode && gameState.selectedHandIndex >= 0) {
    // In drop mode with hand piece selected
    const x = BOARD_OFFSET_X + gameState.cursorCol * CELL_SIZE;
    const y = BOARD_OFFSET_Y + gameState.cursorRow * CELL_SIZE;
    p.stroke(0, 255, 0);
    p.strokeWeight(4);
    p.noFill();
    p.rect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  } else if (!gameState.dropMode) {
    // Normal cursor on board
    const x = BOARD_OFFSET_X + gameState.cursorCol * CELL_SIZE;
    const y = BOARD_OFFSET_Y + gameState.cursorRow * CELL_SIZE;
    p.stroke(255, 0, 0);
    p.strokeWeight(3);
    p.noFill();
    p.rect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }
}

function drawHands(p) {
  // Player 1 hand (bottom right)
  drawHand(p, gameState.player1Hand, 450, 250, PLAYERS.PLAYER1);
  
  // Player 2 hand (top right)
  drawHand(p, gameState.player2Hand, 450, 50, PLAYERS.PLAYER2);
}

function drawHand(p, hand, x, y, player) {
  p.fill(101, 67, 33);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(player === PLAYERS.PLAYER1 ? 'Your Hand:' : 'Opp Hand:', x, y - 20);
  
  for (let i = 0; i < hand.length; i++) {
    const piece = hand[i];
    const px = x + (i % 2) * 35;
    const py = y + Math.floor(i / 2) * 35;
    
    // Highlight if selected
    const isSelected = gameState.dropMode && 
                      gameState.selectedHandIndex === i &&
                      gameState.currentPlayer === player;
    
    if (isSelected) {
      p.fill(144, 238, 144);
    } else {
      p.fill(255, 250, 205);
    }
    
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(px, py, 30, 30, 3);
    
    // Draw mini piece icon
    p.push();
    p.translate(px + 15, py + 15);
    p.scale(0.4);
    p.noStroke();
    
    switch (piece.type) {
      case PIECE_TYPES.LION:
        drawLion(p);
        break;
      case PIECE_TYPES.GIRAFFE:
        drawGiraffe(p);
        break;
      case PIECE_TYPES.ELEPHANT:
        drawElephant(p);
        break;
      case PIECE_TYPES.CHICK:
        drawChick(p);
        break;
    }
    
    p.pop();
  }
}

function drawUI(p) {
  // Current turn indicator
  p.fill(101, 67, 33);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  
  const turnText = gameState.currentPlayer === PLAYERS.PLAYER1 ? 'Your Turn' : 'Opponent\'s Turn';
  p.text(turnText, CANVAS_WIDTH / 2, 10);
  
  // Drop mode indicator
  if (gameState.dropMode) {
    p.fill(0, 128, 0);
    p.textSize(14);
    p.text('DROP MODE', CANVAS_WIDTH / 2, 30);
  }
  
  // Control hint
  p.fill(101, 67, 33);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(11);
  p.textStyle(p.NORMAL);
  p.text('Arrow:Move SPACE:Select D:Drop ESC:Pause', 10, CANVAS_HEIGHT - 5);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.textStyle(p.BOLD);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOver(p) {
  p.background(245, 222, 179);
  
  p.fill(139, 69, 19);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    if (gameState.winner === PLAYERS.PLAYER1) {
      p.text('YOU WIN!', CANVAS_WIDTH / 2, 150);
    } else {
      p.text('YOU LOSE!', CANVAS_WIDTH / 2, 150);
    }
  }
  
  p.fill(101, 67, 33);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  
  if (gameState.winner === PLAYERS.PLAYER1) {
    p.text('Congratulations! You captured the', CANVAS_WIDTH / 2, 220);
    p.text('opponent\'s Lion or reached the Tri zone!', CANVAS_WIDTH / 2, 245);
  } else {
    p.text('The opponent has won the game.', CANVAS_WIDTH / 2, 220);
    p.text('Better luck next time!', CANVAS_WIDTH / 2, 245);
  }
  
  p.fill(178, 34, 34);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}