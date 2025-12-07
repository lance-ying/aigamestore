import { 
  GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, 
  BLOCK_PREVIEW_X, BLOCK_PREVIEW_Y, PREVIEW_SIZE, 
  BLOCK_COLORS, gameState, LEVELS
} from './globals.js';
import { canPlaceBlock, getBlockDimensions } from './utils.js';

/* ------------------------------- Helpers ------------------------------- */

// Always apply colors with explicit RGBA to avoid dimming/alpha surprises.
function fillColor(p, colorIndex, alpha = 255) {
  const c = BLOCK_COLORS[colorIndex] || [255, 255, 255];
  p.fill(c[0], c[1], c[2], alpha);
}

// Trim empty rows/cols around a 0/1 shape so centering is perfect.
function trimShape(shape) {
  const rows = shape.length;
  const cols = rows ? shape[0].length : 0;
  if (!rows || !cols) return { shape, top: 0, left: 0, rows, cols };

  let top = 0, bottom = rows - 1, left = 0, right = cols - 1;

  // find top
  while (top <= bottom && shape[top].every(v => v === 0)) top++;
  // find bottom
  while (bottom >= top && shape[bottom].every(v => v === 0)) bottom--;
  // find left
  while (left <= right && shape.every(row => row[left] === 0)) left++;
  // find right
  while (right >= left && shape.every(row => row[right] === 0)) right--;

  if (top > bottom || left > right) {
    // all zeros; return as-is
    return { shape, top: 0, left: 0, rows, cols };
  }

  const trimmed = [];
  for (let r = top; r <= bottom; r++) {
    trimmed.push(shape[r].slice(left, right + 1));
  }
  return { shape: trimmed, top, left, rows: trimmed.length, cols: trimmed[0].length };
}

/* ------------------------------ Grid Drawing ------------------------------ */

export function drawGrid(p) {
  p.push();
  
  // Get current level background color
  const level = LEVELS[gameState.level.currentIndex] || LEVELS[0];
  const bgColor = level.bgColor;
  
  // Draw grid background container
  p.stroke(100);
  p.strokeWeight(1);
  p.fill(bgColor[0], bgColor[1], bgColor[2]);
  p.rect(
    GRID_OFFSET_X - 1,
    GRID_OFFSET_Y - 1,
    GRID_SIZE * CELL_SIZE + 2,
    GRID_SIZE * CELL_SIZE + 2
  );
  
  // Grid cells
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = GRID_OFFSET_X + col * CELL_SIZE;
      const y = GRID_OFFSET_Y + row * CELL_SIZE;

      // cell background
      p.noStroke();
      if (gameState.grid[row][col] === 0) {
        // Slightly darker version of level bg for empty cells
        p.fill(bgColor[0] * 0.7, bgColor[1] * 0.7, bgColor[2] * 0.7);
      } else {
        const colorIndex = gameState.grid[row][col] - 1;
        fillColor(p, colorIndex, 255);
      }
      p.rect(x, y, CELL_SIZE, CELL_SIZE);

      // cell border
      p.stroke(bgColor[0] + 30, bgColor[1] + 30, bgColor[2] + 30);
      p.strokeWeight(1);
      p.noFill();
      p.rect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  // Animations (drawn over grid)
  for (let i = gameState.animations.length - 1; i >= 0; i--) {
    const anim = gameState.animations[i];
    const t = Math.min(1, anim.frame / Math.max(1, anim.duration));

    for (const cell of anim.cells) {
      const x = GRID_OFFSET_X + cell.x * CELL_SIZE;
      const y = GRID_OFFSET_Y + cell.y * CELL_SIZE;

      if (anim.type === 'place') {
        // refined bounce-in + fade in
        let scale;
        const bounciness = 0.2;
        if (t < 0.5) {
          scale = p.map(t, 0, 0.5, 0.2, 1.0 + bounciness);
        } else {
          scale = p.map(t, 0.5, 1.0, 1.0 + bounciness, 1.0);
        }
        scale = p.constrain(scale, 0.2, 1.0 + bounciness);

        const alpha = Math.floor(255 * t);

        p.push();
        p.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        p.scale(scale);
        p.noStroke();
        fillColor(p, cell.colorIndex, alpha);
        p.rect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        p.pop();

      } else if (anim.type === 'clear') {
        // shrink + rotate + fade out + slight lift
        const scale = 1 - t;
        const alpha = Math.floor(255 * (1 - t));
        const rotation = t * p.PI / 4;

        p.push();
        p.translate(x + CELL_SIZE / 2, y + CELL_SIZE / 2 - t * 10);
        p.rotate(rotation);
        p.scale(scale);
        p.noStroke();
        fillColor(p, cell.colorIndex, alpha);
        p.rect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
        p.pop();
      }
    }

    anim.frame++;
    if (anim.frame >= anim.duration) {
      gameState.animations.splice(i, 1);
    }
  }

  p.pop();
}

/* --------------------------- Current Block Drawing -------------------------- */

export function drawCurrentBlock(p) {
  if (gameState.gamePhase !== "PLAYING") return;

  const { currentBlock, selectedBlockIndex, availableBlocks, grid } = gameState;
  const block = availableBlocks[selectedBlockIndex];
  if (!block) return;

  const shape = block.shape;
  const colorIndex = block.colorIndex;

  p.push();
  p.noStroke();

  const canPlace = canPlaceBlock(grid, block, currentBlock.x, currentBlock.y);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] === 1) {
        const x = GRID_OFFSET_X + (currentBlock.x + col) * CELL_SIZE;
        const y = GRID_OFFSET_Y + (currentBlock.y + row) * CELL_SIZE;

        if (canPlace) {
          // Increased opacity to 255 to make it "properly colorful" and not dimmed
          fillColor(p, colorIndex, 255); 
          // Add a subtle stroke to distinguish it from placed blocks if needed
          p.stroke(255, 255, 255, 100);
          p.strokeWeight(1);
        } else {
          p.fill(255, 0, 0, 180);        // red for invalid
        }
        p.rect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  p.pop();
}

/* ---------------------------- Block Previews UI ---------------------------- */

export function drawBlockPreviews(p) {
  if (gameState.gamePhase !== "PLAYING") return;

  // Compute a SAFE anchor so previews never overlap the grid.
  const SAFE_PREVIEW_X = Math.max(
    BLOCK_PREVIEW_X,
    GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + 24 // 24px margin to the right of grid
  );
  const SAFE_PREVIEW_Y = BLOCK_PREVIEW_Y;

  // Slightly smaller than grid cells so previews are compact.
  // Cap so they don't get huge on large CELL_SIZE configs.
  const PREVIEW_CELL = Math.max(6, Math.min(14, Math.floor(CELL_SIZE * 0.45)));

  // Fixed slot so nothing jumps when shapes change.
  // 5x5 fits most polyominoes; bump if you have bigger shapes.
  const SLOT_COLS = 5;
  const SLOT_ROWS = 5;

  const panelPadding = 8;
  const slotInnerW = SLOT_COLS * PREVIEW_CELL;
  const slotInnerH = SLOT_ROWS * PREVIEW_CELL;
  const slotW = slotInnerW + panelPadding * 2;
  const slotH = slotInnerH + panelPadding * 2;

  const slotGap = 12; // vertical gap between slots

  p.push();
  p.textSize(16);
  p.fill(255);
  p.textAlign(p.LEFT);
  p.text("Available Blocks:", SAFE_PREVIEW_X, SAFE_PREVIEW_Y - 20);

  for (let i = 0; i < gameState.availableBlocks.length; i++) {
    const block = gameState.availableBlocks[i];
    if (!block) continue;

    // slot origin
    const x0 = SAFE_PREVIEW_X;
    const y0 = SAFE_PREVIEW_Y + i * (slotH + slotGap);

    // panel
    p.noStroke();
    p.fill(30);
    p.rect(x0, y0, slotW, slotH, 6);

    // selection highlight (fixed-size frame, no jitter)
    if (i === gameState.selectedBlockIndex) {
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.noFill();
      p.rect(x0, y0, slotW, slotH, 6);
    }

    // tight bounding box for centering
    const { shape } = block;
    const trimmed = trimShape(shape);
    const rows = trimmed.rows;
    const cols = trimmed.cols;

    // pixel size of block inside this slot
    const blockW = cols * PREVIEW_CELL;
    const blockH = rows * PREVIEW_CELL;

    // center within inner slot
    const innerX = x0 + panelPadding;
    const innerY = y0 + panelPadding;
    const offsetX = innerX + (slotInnerW - blockW) / 2;
    const offsetY = innerY + (slotInnerH - blockH) / 2;

    // draw trimmed shape, fully opaque
    p.noStroke();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (trimmed.shape[r][c] === 1) {
          fillColor(p, block.colorIndex, 255);
          p.rect(
            offsetX + c * PREVIEW_CELL,
            offsetY + r * PREVIEW_CELL,
            PREVIEW_CELL,
            PREVIEW_CELL
          );
        }
      }
    }
  }

  p.pop();
}

/* -------------------------- HUD / Other Screens --------------------------- */

export function drawGameInfo(p) {
  p.push();
  p.textSize(16);
  p.fill(255);
  p.textAlign(p.LEFT);

  // Moved HUD to the left side (was 450)
  const hudX = 20;
  let hudY = 30;

  // Level Info
  const level = LEVELS[gameState.level.currentIndex];
  if (level) {
    p.fill(255, 200, 100);
    p.text(`Level: ${level.name}`, hudX, hudY);
    hudY += 25;
    
    p.fill(255);
    p.text(`Lines: ${gameState.level.linesCleared} / ${level.linesTarget}`, hudX, hudY);
    hudY += 25;
    
    // Moves left (Blocks remaining to place)
    const movesLeft = level.maxBlocks - gameState.level.blocksPlaced;
    // Color warning if low on moves
    if (movesLeft <= 5) p.fill(255, 100, 100);
    else p.fill(255);
    p.text(`Moves Left: ${movesLeft}`, hudX, hudY);
    hudY += 35; // Gap
  }

  p.fill(255);
  p.text(`Score: ${gameState.player.score}`, hudX, hudY);
  hudY += 25;
  p.text(`High Score: ${gameState.player.highScore}`, hudX, hudY);
  hudY += 25;

  if (gameState.player.comboCount > 1) {
    p.fill(255, 255, 0);
    p.text(`Combo: x${gameState.player.comboCount}`, hudX, hudY);
  }

  p.pop();
}

export function drawStartScreen(p) {
  p.push();
  p.background(20);

  p.textSize(40);
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER);
  p.text("Block Blast!", p.width / 2, 80);

  p.textSize(16);
  p.fill(255);
  p.textAlign(p.CENTER);
  p.text("Adventure Mode", p.width / 2, 120);
  p.text("Clear TARGET lines within LIMITED moves.", p.width / 2, 150);
  p.text("Complete 6 distinct levels to win!", p.width / 2, 180);

  p.textSize(14);
  p.textAlign(p.CENTER);
  p.text("Controls:", p.width / 2, 230);
  p.text("Arrow Keys: Move block", p.width / 2, 260);
  p.text("Z: Cycle through blocks", p.width / 2, 280);
  p.text("Space: Place block", p.width / 2, 300);
  p.text("Esc: Pause game", p.width / 2, 320);

  p.textSize(20);
  p.fill(255, 255, 0);
  p.text("PRESS ENTER TO START", p.width / 2, 370);

  p.pop();
}

export function drawPauseScreen(p) {
  p.push();
  p.textSize(16);
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT);
  p.text("PAUSED", p.width - 20, 30);
  p.pop();
}

export function drawGameOverScreen(p) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, p.width, p.height);

  p.textSize(40);
  p.textAlign(p.CENTER);

  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(0, 255, 0);
    p.text("VICTORY!", p.width / 2, p.height / 2 - 40);
    p.textSize(20);
    p.fill(255);
    p.text("You completed all levels!", p.width / 2, p.height / 2);
  } else {
    p.fill(255, 0, 0);
    p.text("GAME OVER", p.width / 2, p.height / 2 - 40);
    p.textSize(20);
    p.fill(255);
    
    // Show why they lost
    const level = LEVELS[gameState.level.currentIndex];
    if (level && gameState.level.blocksPlaced >= level.maxBlocks) {
      p.text("Out of moves!", p.width / 2, p.height / 2);
    } else {
      p.text("No more moves possible!", p.width / 2, p.height / 2);
    }
  }

  p.textSize(20);
  p.fill(255);
  p.text(`Final Score: ${gameState.player.score}`, p.width / 2, p.height / 2 + 40);

  p.fill(255);
  p.text("PRESS R TO RESTART", p.width / 2, p.height / 2 + 80);

  p.pop();
}