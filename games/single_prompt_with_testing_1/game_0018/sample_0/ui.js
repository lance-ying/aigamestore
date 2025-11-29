// ui.js - UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';

let uiCanvas = null;
let uiContext = null;

function initUICanvas() {
  if (uiCanvas) return;
  
  uiCanvas = document.createElement('canvas');
  uiCanvas.width = CANVAS_WIDTH;
  uiCanvas.height = CANVAS_HEIGHT;
  uiCanvas.className = 'ui-overlay';
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.top = '0';
  uiCanvas.style.left = '0';
  uiCanvas.style.pointerEvents = 'none';
  uiCanvas.style.zIndex = '1000';
  
  if (gameState.gameContainer) {
    gameState.gameContainer.appendChild(uiCanvas);
  }
  
  uiContext = uiCanvas.getContext('2d');
}

export function renderUI() {
  initUICanvas();
  
  // Clear canvas
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen();
      break;
    case GAME_PHASES.PLAYING:
      renderHUD();
      break;
    case GAME_PHASES.PAUSED:
      renderHUD();
      renderPausedOverlay();
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOver();
      break;
  }
}

export function renderStartScreen() {
  const ctx = uiContext;
  
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('EXTREME LANDINGS PRO 3D', CANVAS_WIDTH / 2, 80);
  
  // Instructions
  ctx.font = '14px Arial';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('Navigate your aircraft to a safe landing', CANVAS_WIDTH / 2, 120);
  ctx.fillText('Manage systems and respond to emergencies', CANVAS_WIDTH / 2, 140);
  
  // Controls
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#999999';
  ctx.fillText('W/S: Pitch Control', 50, 180);
  ctx.fillText('A/D: Roll Control', 50, 195);
  ctx.fillText('←/→: Rudder', 50, 210);
  ctx.fillText('↑/↓: Throttle', 50, 225);
  
  ctx.fillText('SPACE: Landing Gear', 320, 180);
  ctx.fillText('SHIFT: Flaps', 320, 195);
  ctx.fillText('Z: Spoilers', 320, 210);
  
  // Start prompt
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#66ff66';
  ctx.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 320);
}

export function renderHUD() {
  const ctx = uiContext;
  
  // Background panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 70);
  
  // Primary Flight Display
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  
  // Altitude
  ctx.fillStyle = 'white';
  ctx.fillText(`ALT: ${Math.floor(gameState.altitude)} m`, 10, 15);
  
  // Speed (convert to knots for display)
  const speedKnots = Math.floor(gameState.speed * 1.944);
  const speedColor = speedKnots < 100 ? '#ff6666' : 
                     speedKnots > 180 ? '#ffcc66' : '#66ff66';
  ctx.fillStyle = speedColor;
  ctx.fillText(`SPD: ${speedKnots} kts`, 10, 28);
  
  // Vertical Speed
  const vsColor = Math.abs(gameState.verticalSpeed) > 500 ? '#ff6666' : 'white';
  ctx.fillStyle = vsColor;
  const vsSign = gameState.verticalSpeed > 0 ? '+' : '';
  ctx.fillText(`V/S: ${vsSign}${Math.floor(gameState.verticalSpeed)} fpm`, 10, 41);
  
  // Heading
  ctx.fillStyle = 'white';
  ctx.fillText(`HDG: ${Math.floor(gameState.heading)}°`, 10, 54);
  
  // Pitch and Roll
  ctx.fillText(`PITCH: ${Math.floor(gameState.pitch)}°`, 10, 67);
  
  // Systems (center)
  ctx.textAlign = 'center';
  
  // Throttle
  ctx.fillStyle = 'white';
  ctx.fillText(`THR: ${Math.floor(gameState.throttle * 100)}%`, CANVAS_WIDTH / 2, 15);
  
  // Gear
  const gearColor = gameState.gearDeployed ? '#66ff66' : '#999999';
  ctx.fillStyle = gearColor;
  ctx.fillText(gameState.gearDeployed ? 'GEAR DOWN' : 'GEAR UP', CANVAS_WIDTH / 2, 28);
  
  // Flaps
  ctx.fillStyle = 'white';
  ctx.fillText(`FLAPS: ${gameState.flapSetting}`, CANVAS_WIDTH / 2, 41);
  
  // Spoilers
  if (gameState.spoilersDeployed) {
    ctx.fillStyle = '#ffcc66';
    ctx.fillText('SPOILERS', CANVAS_WIDTH / 2, 54);
  }
  
  // Fuel and engines (right)
  ctx.textAlign = 'right';
  
  // Fuel
  const fuelColor = gameState.fuel < 20 ? '#ff6666' : 
                    gameState.fuel < 50 ? '#ffcc66' : '#66ff66';
  ctx.fillStyle = fuelColor;
  ctx.fillText(`FUEL: ${Math.floor(gameState.fuel)}%`, CANVAS_WIDTH - 10, 15);
  
  // Engines
  ctx.fillStyle = gameState.engine1Running ? '#66ff66' : '#ff6666';
  ctx.fillText(`ENG1: ${gameState.engine1Running ? 'ON' : 'OFF'}`, CANVAS_WIDTH - 10, 28);
  
  ctx.fillStyle = gameState.engine2Running ? '#66ff66' : '#ff6666';
  ctx.fillText(`ENG2: ${gameState.engine2Running ? 'ON' : 'OFF'}`, CANVAS_WIDTH - 10, 41);
  
  // Score
  ctx.fillStyle = 'white';
  ctx.fillText(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 54);
  
  // Roll indicator (bottom center)
  ctx.fillText(`ROLL: ${Math.floor(gameState.roll)}°`, CANVAS_WIDTH - 10, 67);
  
  // Emergency alerts
  if (gameState.activeEmergencies.length > 0) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(0, 70, CANVAS_WIDTH, 25);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`⚠ ${gameState.activeEmergencies[0]} ⚠`, CANVAS_WIDTH / 2, 85);
  }
  
  // Artificial Horizon (simplified)
  renderArtificialHorizon();
}

function renderArtificialHorizon() {
  const ctx = uiContext;
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 + 50;
  const size = 40;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Rotate based on roll
  ctx.rotate(-gameState.roll * Math.PI / 180);
  
  // Sky
  ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
  ctx.fillRect(-size, -size - gameState.pitch, size * 2, size + gameState.pitch);
  
  // Ground
  ctx.fillStyle = 'rgba(139, 90, 43, 0.6)';
  ctx.fillRect(-size, -gameState.pitch, size * 2, size + gameState.pitch);
  
  // Horizon line
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size, -gameState.pitch);
  ctx.lineTo(size, -gameState.pitch);
  ctx.stroke();
  
  ctx.restore();
  
  // Aircraft reference (fixed)
  ctx.strokeStyle = '#ffff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 25, centerY);
  ctx.lineTo(centerX - 10, centerY);
  ctx.moveTo(centerX + 10, centerY);
  ctx.lineTo(centerX + 25, centerY);
  ctx.moveTo(centerX, centerY - 5);
  ctx.lineTo(centerX, centerY + 5);
  ctx.stroke();
}

export function renderPausedOverlay() {
  const ctx = uiContext;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  ctx.font = '16px Arial';
  ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver() {
  const ctx = uiContext;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.textAlign = 'center';
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Success
    ctx.fillStyle = '#66ff66';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('LANDING SUCCESSFUL', CANVAS_WIDTH / 2, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 130);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Touchdown Speed: ${Math.floor(gameState.touchdownSpeed)} kts`, CANVAS_WIDTH / 2, 160);
    ctx.fillText(`Vertical Speed: ${Math.floor(gameState.touchdownVerticalSpeed)} fpm`, CANVAS_WIDTH / 2, 175);
    ctx.fillText(`Centerline Deviation: ${Math.floor(gameState.touchdownAlignment)} m`, CANVAS_WIDTH / 2, 190);
    
    // Rating
    let rating = 'EXCELLENT';
    if (gameState.touchdownVerticalSpeed > 200 || gameState.touchdownAlignment > 3) {
      rating = 'GOOD';
    }
    if (gameState.touchdownVerticalSpeed > 250 || gameState.touchdownAlignment > 4) {
      rating = 'FAIR';
    }
    
    ctx.fillStyle = '#ffff66';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`Landing Rating: ${rating}`, CANVAS_WIDTH / 2, 230);
    
  } else {
    // Failure
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('CRASH', CANVAS_WIDTH / 2, 80);
    
    ctx.fillStyle = 'white';
    ctx.font = '13px Arial';
    const lines = wrapText(ctx, gameState.crashReason || 'Aircraft crashed', 500);
    lines.forEach((line, i) => {
      ctx.fillText(line, CANVAS_WIDTH / 2, 130 + i * 18);
    });
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#cccccc';
    if (gameState.touchdownSpeed > 0) {
      ctx.fillText(`Impact Speed: ${Math.floor(gameState.touchdownSpeed)} kts`, CANVAS_WIDTH / 2, 200);
      ctx.fillText(`Vertical Speed: ${Math.floor(gameState.touchdownVerticalSpeed)} fpm`, CANVAS_WIDTH / 2, 215);
    }
  }
  
  ctx.fillStyle = '#66ffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}