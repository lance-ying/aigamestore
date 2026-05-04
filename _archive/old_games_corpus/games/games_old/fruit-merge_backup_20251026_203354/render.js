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
  // Title
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.strokeText('FRUIT MERGE', CANVAS_WIDTH / 2, 80);
  ctx.fillText('FRUIT MERGE', CANVAS_WIDTH / 2, 80);
  
  // Instructions
  ctx.font = '16px Arial';
  ctx.fillStyle = '#333';
  
  const instructions = [
    'Match identical fruits to create bigger ones!',
    '',
    'Controls:',
    'Arrow Keys / A,D - Move fruit',
    'Arrow Down / S - Drop faster',
    'SPACE - Quick drop',
    'ESC - Pause',
    '',
    'Keep fruits below the red danger line!',
    '',
    'PRESS ENTER TO START'
  ];
  
  instructions.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 150 + i * 22);
  });
  
  // Draw sample fruits
  const sampleY = 350;
  const startX = 100;
  const spacing = 50;
  
  for (let i = 0; i < Math.min(10, FRUIT_TYPES.length); i++) {
    const fruit = FRUIT_TYPES[i];
    const x = startX + i * spacing;
    
    const gradient = ctx.createRadialGradient(x - 3, sampleY - 3, 0, x, sampleY, fruit.radius * 0.5);
    gradient.addColorStop(0, lightenColor(fruit.color, 40));
    gradient.addColorStop(1, fruit.color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, sampleY, fruit.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = darkenColor(fruit.color, 20);
    ctx.lineWidth = 1;
    ctx.stroke();
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