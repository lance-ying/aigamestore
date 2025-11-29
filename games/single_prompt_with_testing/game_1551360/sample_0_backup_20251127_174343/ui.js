// ui.js - UI rendering on canvas overlay
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_SCORE, TARGET_TOKENS } from './globals.js';

let uiCanvas = null;
let uiContext = null;

export function setupUI() {
  // Create 2D canvas overlay for UI
  uiCanvas = document.createElement('canvas');
  uiCanvas.width = CANVAS_WIDTH;
  uiCanvas.height = CANVAS_HEIGHT;
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.top = '0';
  uiCanvas.style.left = '0';
  uiCanvas.style.pointerEvents = 'none';
  uiCanvas.style.zIndex = '1000';
  uiCanvas.style.margin = '0';
  uiCanvas.style.padding = '0';
  
  // Append to game container
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  }
  
  uiContext = uiCanvas.getContext('2d');
  gameState.uiCanvas = uiCanvas;
  gameState.uiContext = uiContext;
}

export function renderUI() {
  if (!uiContext) return;
  
  // Clear canvas
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (gameState.gamePhase) {
    case "START":
      renderStartScreen();
      break;
    case "PLAYING":
      renderHUD();
      renderControlReminder();
      break;
    case "PAUSED":
      renderHUD();
      renderPauseOverlay();
      break;
    case "GAME_OVER_WIN":
      renderGameOverScreen(true);
      break;
    case "GAME_OVER_LOSE":
      renderGameOverScreen(false);
      break;
  }
}

function renderStartScreen() {
  // Semi-transparent background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title with gradient
  const gradient = uiContext.createLinearGradient(0, 80, 0, 140);
  gradient.addColorStop(0, '#FFD700');
  gradient.addColorStop(1, '#FFA500');
  uiContext.fillStyle = gradient;
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('HORIZON RACER', CANVAS_WIDTH / 2, 100);
  
  // Subtitle
  uiContext.fillStyle = '#FF6347';
  uiContext.font = 'bold 24px Arial';
  uiContext.fillText('MEXICO EDITION', CANVAS_WIDTH / 2, 130);
  
  // Description
  uiContext.fillStyle = 'white';
  uiContext.font = '16px Arial';
  const descLines = [
    'Explore vibrant Mexican landscapes',
    'Collect tokens and complete checkpoints',
    `Goal: ${TARGET_TOKENS} tokens & ${TARGET_SCORE} points`
  ];
  descLines.forEach((line, i) => {
    uiContext.fillText(line, CANVAS_WIDTH / 2, 170 + i * 25);
  });
  
  // Controls - larger and more prominent
  uiContext.fillStyle = '#FFD700';
  uiContext.font = 'bold 18px Arial';
  uiContext.fillText('CONTROLS', CANVAS_WIDTH / 2, 260);
  
  uiContext.fillStyle = '#FFFFFF';
  uiContext.font = 'bold 14px Arial';
  const controls = [
    'W or ↑ Arrow = Accelerate Forward',
    'S or ↓ Arrow = Brake/Slow Down',
    'A or ← Arrow = Turn Left',
    'D or → Arrow = Turn Right',
    'SPACE = Handbrake (Drift)',
    'SHIFT = Boost (requires 3 tokens)'
  ];
  controls.forEach((line, i) => {
    uiContext.fillText(line, CANVAS_WIDTH / 2, 285 + i * 22);
  });
  
  // Important note
  uiContext.fillStyle = '#FF6347';
  uiContext.font = 'bold 14px Arial';
  uiContext.fillText('⚠ Press ENTER to start the game first! ⚠', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  
  // Start prompt (pulsing and VERY prominent)
  const pulseAlpha = 0.6 + Math.sin(Date.now() * 0.005) * 0.4;
  const pulseScale = 1.0 + Math.sin(Date.now() * 0.005) * 0.1;
  
  // Background box for start prompt
  uiContext.fillStyle = `rgba(255, 215, 0, ${pulseAlpha * 0.3})`;
  uiContext.fillRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 65, 400, 50);
  
  // Border
  uiContext.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
  uiContext.lineWidth = 3;
  uiContext.strokeRect(CANVAS_WIDTH / 2 - 200, CANVAS_HEIGHT - 65, 400, 50);
  
  // Text
  uiContext.save();
  uiContext.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  uiContext.scale(pulseScale, pulseScale);
  uiContext.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
  uiContext.font = 'bold 28px Arial';
  uiContext.fillText('▶ PRESS ENTER TO START ◀', 0, 0);
  uiContext.restore();
}

function renderHUD() {
  // Top bar background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, 80);
  
  // Score
  uiContext.fillStyle = '#FFD700';
  uiContext.font = 'bold 24px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText(`Score: ${gameState.score}`, 15, 30);
  
  // Tokens collected
  uiContext.fillStyle = '#FFFFFF';
  uiContext.font = '16px Arial';
  uiContext.fillText(`Tokens: ${gameState.tokensCollected}/${TARGET_TOKENS}`, 15, 55);
  
  // Speed indicator
  if (gameState.player) {
    const speedPercent = (gameState.player.currentSpeed / gameState.player.maxSpeed) * 100;
    uiContext.fillStyle = '#00FF00';
    uiContext.font = 'bold 20px Arial';
    uiContext.textAlign = 'right';
    uiContext.fillText(`Speed: ${Math.round(speedPercent)}%`, CANVAS_WIDTH - 15, 30);
    
    // Boost indicator
    if (gameState.boostsAvailable > 0) {
      uiContext.fillStyle = gameState.player.isBoosting ? '#FF4500' : '#FFA500';
      uiContext.font = 'bold 16px Arial';
      uiContext.fillText(`Boost: ${gameState.boostsAvailable}`, CANVAS_WIDTH - 15, 55);
      
      if (gameState.player.isBoosting) {
        uiContext.fillText('BOOST ACTIVE!', CANVAS_WIDTH - 15, 75);
      }
    } else {
      uiContext.fillStyle = '#888888';
      uiContext.font = '14px Arial';
      uiContext.fillText('Collect 3 tokens for boost', CANVAS_WIDTH - 15, 55);
    }
  }
  
  // Checkpoint indicator
  if (gameState.activeCheckpoint) {
    uiContext.fillStyle = 'rgba(0, 255, 0, 0.3)';
    uiContext.fillRect(CANVAS_WIDTH / 2 - 150, 10, 300, 60);
    
    uiContext.fillStyle = '#00FF00';
    uiContext.font = 'bold 18px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('Next Checkpoint', CANVAS_WIDTH / 2, 30);
    
    // Direction arrow
    if (gameState.player) {
      const dx = gameState.activeCheckpoint.mesh.position.x - gameState.player.mesh.position.x;
      const dz = gameState.activeCheckpoint.mesh.position.z - gameState.player.mesh.position.z;
      const angle = Math.atan2(dx, -dz);
      
      uiContext.save();
      uiContext.translate(CANVAS_WIDTH / 2, 50);
      uiContext.rotate(angle);
      
      uiContext.fillStyle = '#00FF00';
      uiContext.beginPath();
      uiContext.moveTo(0, -15);
      uiContext.lineTo(-8, 5);
      uiContext.lineTo(8, 5);
      uiContext.closePath();
      uiContext.fill();
      
      uiContext.restore();
    }
  }
  
  // Progress bar
  const progressWidth = 200;
  const progressHeight = 20;
  const progressX = CANVAS_WIDTH / 2 - progressWidth / 2;
  const progressY = CANVAS_HEIGHT - 40;
  
  // Background
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(progressX - 5, progressY - 5, progressWidth + 10, progressHeight + 10);
  
  // Progress fill
  const progress = Math.min(gameState.score / TARGET_SCORE, 1);
  uiContext.fillStyle = progress >= 1 ? '#00FF00' : '#FFD700';
  uiContext.fillRect(progressX, progressY, progressWidth * progress, progressHeight);
  
  // Border
  uiContext.strokeStyle = '#FFFFFF';
  uiContext.lineWidth = 2;
  uiContext.strokeRect(progressX, progressY, progressWidth, progressHeight);
  
  // Progress text
  uiContext.fillStyle = '#FFFFFF';
  uiContext.font = 'bold 12px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(`${gameState.score}/${TARGET_SCORE}`, CANVAS_WIDTH / 2, progressY + 15);
}

function renderControlReminder() {
  // Show control reminder for first 10 seconds or if speed is very low
  const showReminder = gameState.frameCount < 600 || 
                       (gameState.player && gameState.player.currentSpeed < 0.1);
  
  if (!showReminder) return;
  
  // Semi-transparent control box in bottom-left
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.75)';
  uiContext.fillRect(10, CANVAS_HEIGHT - 120, 220, 75);
  
  // Border
  uiContext.strokeStyle = 'rgba(255, 215, 0, 0.8)';
  uiContext.lineWidth = 2;
  uiContext.strokeRect(10, CANVAS_HEIGHT - 120, 220, 75);
  
  // Title
  uiContext.fillStyle = '#FFD700';
  uiContext.font = 'bold 14px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('CONTROLS:', 20, CANVAS_HEIGHT - 100);
  
  // Control list
  uiContext.fillStyle = '#FFFFFF';
  uiContext.font = '11px Arial';
  const quickControls = [
    '↑/W: Forward  ↓/S: Brake',
    '←/A: Left  →/D: Right',
    'SPACE: Drift  SHIFT: Boost'
  ];
  quickControls.forEach((line, i) => {
    uiContext.fillText(line, 20, CANVAS_HEIGHT - 78 + i * 18);
  });
}

function renderPauseOverlay() {
  // Semi-transparent overlay
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  uiContext.fillStyle = '#FFD700';
  uiContext.font = 'bold 48px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  // Instructions
  uiContext.fillStyle = 'white';
  uiContext.font = '20px Arial';
  uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(won) {
  // Background
  uiContext.fillStyle = won ? 'rgba(0, 100, 0, 0.9)' : 'rgba(100, 0, 0, 0.9)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  const gradient = uiContext.createLinearGradient(0, 100, 0, 160);
  if (won) {
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, '#00FF00');
  } else {
    gradient.addColorStop(0, '#FF6347');
    gradient.addColorStop(1, '#8B0000');
  }
  uiContext.fillStyle = gradient;
  uiContext.font = 'bold 56px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText(won ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 130);
  
  // Stats
  uiContext.fillStyle = 'white';
  uiContext.font = 'bold 24px Arial';
  uiContext.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  
  uiContext.font = '18px Arial';
  uiContext.fillText(`Tokens Collected: ${gameState.tokensCollected}`, CANVAS_WIDTH / 2, 220);
  uiContext.fillText(`Checkpoints: ${gameState.checkpointsCompleted}`, CANVAS_WIDTH / 2, 245);
  
  if (won) {
    uiContext.fillStyle = '#FFD700';
    uiContext.font = 'bold 20px Arial';
    uiContext.fillText('You conquered Mexico!', CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  uiContext.fillStyle = 'white';
  uiContext.font = 'bold 22px Arial';
  const pulseAlpha = 0.5 + Math.sin(Date.now() * 0.003) * 0.5;
  uiContext.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
  uiContext.fillText('Press R to Restart', CANVAS_WIDTH / 2, 340);
}