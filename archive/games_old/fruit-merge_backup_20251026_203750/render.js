// render.js - Rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  CONTAINER_WIDTH,
  CONTAINER_X,
  CONTAINER_Y,
  FRUIT_TYPES,
  DANGER_LINE_Y,
  DANGER_LINE_GRACE_FRAMES
} from './globals.js';
import { Fruit } from './entities.js';

export function render() {
  const ctx = gameState.ctx;
  
  // Clear canvas
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
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
  
  // Title with subtle shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  ctx.fillStyle = '#FF6B6B';
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Fruit Merge', CANVAS_WIDTH / 2, 80);
  ctx.restore();
  
  // Subtitle
  ctx.fillStyle = '#666';
  ctx.font = 'italic 20px Arial, sans-serif';
  ctx.fillText('Match & Merge to Win', CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = '#FFB6C1';
  ctx.lineWidth = 3;
  const boxX = CANVAS_WIDTH / 2 - 250;
  const boxY = 160;
  const boxWidth = 500;
  const boxHeight = 150;
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  
  // Instructions
  ctx.fillStyle = '#444';
  ctx.font = '16px Arial, sans-serif';
  ctx.textAlign = 'center';
  
  const instructions = [
    'Drop identical fruits to merge them into bigger ones',
    '',
    '← → or A/D: Move  |  ↓ or S: Drop  |  SPACE: Quick drop',
    'ESC: Pause  |  Keep fruits below the danger line!',
  ];
  
  instructions.forEach((line, i) => {
    const y = 185 + i * 28;
    if (line === '') return;
    ctx.fillText(line, CANVAS_WIDTH / 2, y);
  });
  
  // Start prompt with pulsing effect
  const pulseAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.3;
  ctx.fillStyle = `rgba(255, 107, 107, ${pulseAlpha})`;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  
  // Draw sample fruits with better spacing
  const sampleY = 380;
  const startX = 75;
  const spacing = 55;
  
  for (let i = 0; i < Math.min(10, FRUIT_TYPES.length); i++) {
    const fruit = FRUIT_TYPES[i];
    const x = startX + i * spacing;
    const radius = fruit.radius * 0.45;
    
    const fruitGradient = ctx.createRadialGradient(x - 3, sampleY - 3, 0, x, sampleY, radius);
    fruitGradient.addColorStop(0, lightenColor(fruit.color, 40));
    fruitGradient.addColorStop(1, fruit.color);
    
    ctx.fillStyle = fruitGradient;
    ctx.beginPath();
    ctx.arc(x, sampleY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = darkenColor(fruit.color, 20);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, sampleY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderGameplay(ctx) {
  // Draw container
  if (gameState.container) {
    gameState.container.draw(ctx);
  }
  
  // Draw danger line
  ctx.strokeStyle = gameState.dangerFrameCount > 0 ? '#ff0000' : 'rgba(255, 0, 0, 0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(CONTAINER_X - CONTAINER_WIDTH / 2, DANGER_LINE_Y);
  ctx.lineTo(CONTAINER_X + CONTAINER_WIDTH / 2, DANGER_LINE_Y);
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
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DANGER!', CONTAINER_X, DANGER_LINE_Y - 30);
  }
  
  // Draw all fruits
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      entity.draw(ctx);
    }
  });
  
  // Draw current fruit preview
  if (gameState.currentFruit && !gameState.isDropping) {
    const fruit = FRUIT_TYPES[gameState.nextFruitType];
    
    ctx.globalAlpha = 0.7;
    const gradient = ctx.createRadialGradient(
      gameState.dropX - fruit.radius * 0.3,
      50 - fruit.radius * 0.3,
      0,
      gameState.dropX,
      50,
      fruit.radius
    );
    gradient.addColorStop(0, lightenColor(fruit.color, 40));
    gradient.addColorStop(1, fruit.color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(gameState.dropX, 50, fruit.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = darkenColor(fruit.color, 20);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    
    // Drop guide line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(gameState.dropX, 50 + fruit.radius);
    ctx.lineTo(gameState.dropX, CONTAINER_Y + gameState.container.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Draw UI
  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${gameState.score}`, 10, 30);
  
  ctx.font = '16px Arial';
  ctx.fillText(`High: ${gameState.highScore}`, 10, 55);
  
  // Next fruit preview
  ctx.textAlign = 'right';
  ctx.font = '16px Arial';
  ctx.fillText('Next:', CANVAS_WIDTH - 80, 30);
  
  const nextFruitPreview = FRUIT_TYPES[gameState.nextFruitType];
  const previewX = CANVAS_WIDTH - 40;
  const previewY = 40;
  
  const previewGradient = ctx.createRadialGradient(
    previewX - nextFruitPreview.radius * 0.2,
    previewY - nextFruitPreview.radius * 0.2,
    0,
    previewX,
    previewY,
    nextFruitPreview.radius * 0.6
  );
  previewGradient.addColorStop(0, lightenColor(nextFruitPreview.color, 40));
  previewGradient.addColorStop(1, nextFruitPreview.color);
  
  ctx.fillStyle = previewGradient;
  ctx.beginPath();
  ctx.arc(previewX, previewY, nextFruitPreview.radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = darkenColor(nextFruitPreview.color, 20);
  ctx.lineWidth = 2;
  ctx.stroke();
}

function renderPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  ctx.font = '20px Arial';
  ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (gameState.gamePhase === 'GAME_OVER_WIN') {
    ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  } else {
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  ctx.font = '32px Arial';
  ctx.fillText(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  ctx.font = '24px Arial';
  ctx.fillText(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  ctx.font = '20px Arial';
  ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
    (G > 0 ? G : 0) * 0x100 +
    (B > 0 ? B : 0))
    .toString(16).slice(1);
}