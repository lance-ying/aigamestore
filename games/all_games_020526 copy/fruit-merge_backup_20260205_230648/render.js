// render.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  CONTAINER_WIDTH,
  CONTAINER_X,
  CONTAINER_Y,
  FRUIT_TYPES,
  DANGER_LINE_GRACE_FRAMES,
  LEVELS
} from './globals.js';
import { Fruit } from './entities.js';

// Font configuration
const FONT_MAIN = 'bold 24px "Comic Sans MS", "Chalkboard SE", sans-serif';
const FONT_LARGE = 'bold 56px "Comic Sans MS", "Chalkboard SE", sans-serif';
const FONT_MEDIUM = 'bold 32px "Comic Sans MS", "Chalkboard SE", sans-serif';
const FONT_SMALL = 'bold 16px "Comic Sans MS", "Chalkboard SE", sans-serif';

export function render() {
  const ctx = gameState.ctx;
  
  // Clear canvas with current level background color
  const currentLevel = LEVELS[gameState.currentLevelIndex] || LEVELS[0];
  ctx.fillStyle = currentLevel.color;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Add a subtle pattern (polka dots) for cartoon feel
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  for (let x = 0; x < CANVAS_WIDTH; x += 20) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
      if ((x + y) % 40 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  
  if (gameState.gamePhase === 'START') {
    renderStartScreen(ctx);
  } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
    renderGameplay(ctx);
    if (gameState.gamePhase === 'PAUSED') {
      renderPauseOverlay(ctx);
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    renderGameplay(ctx);
    renderGameOverScreen(ctx);
  }
}

function renderStartScreen(ctx) {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#FFE5B4');
  gradient.addColorStop(1, '#FFB6C1');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Main message: "press enter to begin"
  ctx.save();
  ctx.fillStyle = '#FF6B6B'; // Using the old title color
  ctx.font = FONT_MEDIUM; // Using a medium font size
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('press enter to begin', CANVAS_WIDTH / 2, 120); // Positioned where the subtitle was
  ctx.restore();
  
  // Instructions box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = '#FFB6C1';
  ctx.lineWidth = 4;
  const boxX = CANVAS_WIDTH / 2 - 250;
  const boxY = 160; // Keep the box at the same Y position
  const boxWidth = 500;
  const boxHeight = 80; // Adjusted height for fewer lines
  
  // Rounded rect for box
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20);
  ctx.fill();
  ctx.stroke();
  
  // Instructions
  ctx.fillStyle = '#444';
  ctx.font = '16px "Comic Sans MS", sans-serif';
  ctx.textAlign = 'center';
  
  const instructions = [
    '← → or A/D: Move  |  ↓ or S: Drop  |  SPACE: Quick drop',
    'ESC: Pause  |  Keep fruits below the danger line!',
  ];
  
  instructions.forEach((line, i) => {
    const y = boxY + 30 + i * 28; // Adjusted starting Y within the box
    ctx.fillText(line, CANVAS_WIDTH / 2, y);
  });
  
  // Draw sample fruits using the new visual helper
  const sampleY = 380;
  const startX = 75;
  const spacing = 55;
  
  for (let i = 0; i < Math.min(10, FRUIT_TYPES.length); i++) {
    const fruit = FRUIT_TYPES[i];
    const x = startX + i * spacing;
    const radius = fruit.radius * 0.45;
    
    // Use the shared visual helper
    Fruit.drawVisuals(ctx, x, sampleY, radius, fruit.color);
  }
}

function renderGameplay(ctx) {
  // Draw container
  if (gameState.container) {
    gameState.container.draw(ctx);
  }
  
  // Draw danger line (use dynamic dangerLineY)
  ctx.strokeStyle = gameState.dangerFrameCount > 0 ? '#ff0000' : 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 4;
  ctx.setLineDash([15, 10]);
  ctx.beginPath();
  ctx.moveTo(CONTAINER_X - CONTAINER_WIDTH / 2, gameState.dangerLineY);
  ctx.lineTo(CONTAINER_X + CONTAINER_WIDTH / 2, gameState.dangerLineY);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Draw danger warning
  if (gameState.dangerFrameCount > 0) {
    const progress = gameState.dangerFrameCount / DANGER_LINE_GRACE_FRAMES;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + progress * 0.4})`;
    ctx.fillRect(
      CONTAINER_X - CONTAINER_WIDTH / 2,
      CONTAINER_Y - gameState.container.height / 2,
      CONTAINER_WIDTH,
      60
    );
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText('DANGER!', CONTAINER_X, gameState.dangerLineY - 30);
    ctx.shadowBlur = 0;
  }
  
  // Draw all fruits
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      entity.draw(ctx);
    }
  });
  
  // Draw current fruit preview (the one being positioned)
  if (gameState.currentFruit && !gameState.isDropping) {
    const fruit = FRUIT_TYPES[gameState.currentFruitType];
    const previewY = 80;
    
    // Drop guide line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(gameState.dropX, previewY + fruit.radius);
    ctx.lineTo(gameState.dropX, CONTAINER_Y + gameState.container.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw the fruit visuals
    Fruit.drawVisuals(ctx, gameState.dropX, previewY, fruit.radius, fruit.color);
  }
  
  // Draw UI
  ctx.fillStyle = '#333';
  ctx.textAlign = 'left';
  
  // Score Box
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.roundRect(5, 5, 150, 120, 10);
  ctx.fill();
  
  ctx.fillStyle = '#333';
  ctx.font = FONT_MAIN;
  ctx.fillText(`Score: ${gameState.score}`, 15, 35);
  
  ctx.font = FONT_SMALL;
  ctx.fillText(`High: ${gameState.highScore}`, 15, 60);
  
  // Display Level and Target Score
  const currentLevel = LEVELS[gameState.currentLevelIndex] || LEVELS[0];
  const nextLevel = LEVELS[gameState.currentLevelIndex + 1];
  
  ctx.font = 'bold 20px "Comic Sans MS", sans-serif';
  ctx.fillStyle = '#2c3e50';
  ctx.fillText(`Level: ${currentLevel.name}`, 15, 90);
  
  if (nextLevel) {
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#555';
    ctx.fillText(`Target: ${nextLevel.threshold}`, 15, 115);
  } else {
    ctx.font = FONT_SMALL;
    ctx.fillStyle = '#555';
    ctx.fillText(`Max Level`, 15, 115);
  }
  
  // Next fruit preview box
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH - 90, 5, 85, 90, 10);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = FONT_SMALL;
  ctx.fillStyle = '#333';
  ctx.fillText('Next:', CANVAS_WIDTH - 47, 25);
  
  const nextFruitPreview = FRUIT_TYPES[gameState.nextFruitType];
  const previewX = CANVAS_WIDTH - 47;
  const previewY = 60;
  
  // Use shared visual helper for next fruit
  Fruit.drawVisuals(ctx, previewX, previewY, nextFruitPreview.radius * 0.7, nextFruitPreview.color);
}

function renderPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#fff';
  ctx.font = FONT_LARGE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  ctx.shadowBlur = 0;
  
  ctx.font = FONT_MAIN;
  ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#fff';
  ctx.font = FONT_LARGE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  ctx.font = FONT_MEDIUM;
  ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  ctx.font = FONT_MAIN;
  ctx.fillText(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart Button style
  const btnY = CANVAS_HEIGHT / 2 + 80;
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.roundRect(CANVAS_WIDTH/2 - 120, btnY, 240, 50, 25);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px "Comic Sans MS", sans-serif';
  ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, btnY + 25);
}