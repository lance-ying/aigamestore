// renderer.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
    gameState,
    CANVAS_WIDTH, 
    CANVAS_HEIGHT,
    PHASE_START,
    PHASE_PLAYING,
    PHASE_PAUSED,
    PHASE_GAME_OVER_WIN,
    PHASE_GAME_OVER_LOSE
} from './globals.js';

let uiCanvas, uiContext;

export function setupRenderer() {
    // Create game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.width = CANVAS_WIDTH + 'px';
    gameContainer.style.height = CANVAS_HEIGHT + 'px';
    gameContainer.style.position = 'relative';
    gameContainer.style.overflow = 'hidden';
    gameContainer.style.margin = '0';
    gameContainer.style.padding = '0';
    document.body.appendChild(gameContainer);
    
    // Set body styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Create WebGL renderer
    gameState.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false
    });
    
    gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    gameState.renderer.shadowMap.enabled = true;
    gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gameState.renderer.setClearColor(0x2a2f36);
    
    gameContainer.appendChild(gameState.renderer.domElement);
    
    // Create UI canvas overlay
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    uiCanvas.style.zIndex = '1000';
    
    gameContainer.appendChild(uiCanvas);
    uiContext = uiCanvas.getContext('2d');
}

export function render() {
    // Render 3D scene
    gameState.renderer.render(gameState.scene, gameState.camera);
    
    // Render UI
    renderUI();
}

function renderUI() {
    uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    switch(gameState.gamePhase) {
        case PHASE_START:
            renderStartScreen();
            break;
        case PHASE_PLAYING:
            renderHUD();
            break;
        case PHASE_PAUSED:
            renderHUD();
            renderPauseOverlay();
            break;
        case PHASE_GAME_OVER_WIN:
        case PHASE_GAME_OVER_LOSE:
            renderGameOver();
            break;
    }
}

function renderStartScreen() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = '#dc5032';
    uiContext.font = 'bold 36px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('RADIATION CITY', CANVAS_WIDTH / 2, 60);
    
    uiContext.fillStyle = '#c8c8c8';
    uiContext.font = '12px Arial';
    
    const instructions = [
        'SURVIVE THE WASTELAND',
        '',
        'Navigate the irradiated ruins and reach the evacuation point.',
        'Scavenge buildings for supplies and manage your survival stats.',
        'Fight mutated creatures that roam the wasteland.',
        '',
        'CONTROLS:',
        'Arrow Keys - Move and turn | Space - Attack',
        'Shift - Sprint | Z - Use consumable',
        '',
        'Keep all your stats above zero or you will die!',
        '',
        'PRESS ENTER TO START'
    ];
    
    let yPos = 100;
    for (let line of instructions) {
        uiContext.fillText(line, CANVAS_WIDTH / 2, yPos);
        yPos += 16;
    }
}

function renderHUD() {
    const player = gameState.player;
    if (!player) return;
    
    // Stats panel
    const panelX = 10;
    const panelY = 10;
    const panelWidth = 180;
    const barHeight = 18;
    const spacing = 23;
    
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    uiContext.fillRect(panelX, panelY, panelWidth, 100);
    
    drawBar(panelX + 5, panelY + 5, panelWidth - 10, barHeight, 
            player.health, 100, '#c83232', 'HEALTH');
    
    drawBar(panelX + 5, panelY + 5 + spacing, panelWidth - 10, barHeight,
            player.hunger, 100, '#ffb432', 'HUNGER');
    
    drawBar(panelX + 5, panelY + 5 + spacing * 2, panelWidth - 10, barHeight,
            player.thirst, 100, '#64b4ff', 'THIRST');
    
    drawBar(panelX + 5, panelY + 5 + spacing * 3, panelWidth - 10, barHeight,
            player.radiation, 100, '#32ff32', 'RAD', true);
    
    // Inventory panel
    const invX = CANVAS_WIDTH - 190;
    const invY = 10;
    
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
    uiContext.fillRect(invX, invY, 180, 85);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '11px Arial';
    uiContext.textAlign = 'left';
    
    const consumables = ['food', 'water', 'antirad'];
    const labels = ['FOOD', 'WATER', 'ANTI-RAD'];
    let yPos = invY + 8;
    
    uiContext.fillText('INVENTORY (Z):', invX + 5, yPos);
    yPos += 16;
    
    for (let i = 0; i < consumables.length; i++) {
        const type = consumables[i];
        const selected = player.currentConsumable === i;
        
        uiContext.fillStyle = selected ? '#ffff64' : '#c8c8c8';
        uiContext.fillText(`${selected ? '>' : ' '} ${labels[i]}: ${player.inventory[type]}`, 
                          invX + 5, yPos);
        yPos += 15;
    }
    
    uiContext.fillStyle = '#b4b4b4';
    uiContext.fillText(`Scrap: ${player.inventory.scrap}`, invX + 5, yPos);
    
    // Compass
    const compassX = CANVAS_WIDTH / 2;
    const compassY = 25;
    
    const evac = gameState.evacuationPoint;
    const dx = evac.mesh.position.x - player.mesh.position.x;
    const dz = evac.mesh.position.z - player.mesh.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const dirAngle = Math.atan2(dx, dz) - player.angle;
    
    uiContext.save();
    uiContext.translate(compassX, compassY);
    uiContext.rotate(dirAngle);
    uiContext.fillStyle = '#64ff96';
    uiContext.beginPath();
    uiContext.moveTo(0, -12);
    uiContext.lineTo(-6, 4);
    uiContext.lineTo(6, 4);
    uiContext.closePath();
    uiContext.fill();
    uiContext.restore();
    
    uiContext.fillStyle = '#64ff96';
    uiContext.font = '11px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(`EVAC: ${Math.floor(dist)}m`, compassX, compassY + 20);
}

function drawBar(x, y, width, height, value, maxValue, color, label, invert = false) {
    const percent = Math.max(0, Math.min(1, value / maxValue));
    
    uiContext.fillStyle = '#282828';
    uiContext.fillRect(x, y, width, height);
    
    let barColor = color;
    if (invert) {
        if (percent > 0.7) barColor = '#ff6464';
        else if (percent > 0.4) barColor = '#ffc864';
    } else {
        if (percent < 0.3) barColor = '#ff6464';
        else if (percent < 0.6) barColor = '#ffc864';
    }
    
    uiContext.fillStyle = barColor;
    uiContext.fillRect(x, y, width * percent, height);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = '10px Arial';
    uiContext.textAlign = 'left';
    uiContext.fillText(label, x + 3, y + 12);
    
    uiContext.textAlign = 'right';
    uiContext.fillText(Math.floor(value), x + width - 3, y + 12);
}

function renderPauseOverlay() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiContext.fillStyle = '#ffffff';
    uiContext.font = 'bold 32px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    uiContext.font = '16px Arial';
    uiContext.fillText('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOver() {
    uiContext.fillStyle = 'rgba(0, 0, 0, 0.85)';
    uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
    
    uiContext.fillStyle = isWin ? '#64ff64' : '#ff6464';
    uiContext.font = 'bold 42px Arial';
    uiContext.textAlign = 'center';
    uiContext.fillText(isWin ? 'EVACUATED!' : 'GAME OVER', CANVAS_WIDTH / 2, 80);
    
    uiContext.fillStyle = '#c8c8c8';
    uiContext.font = '16px Arial';
    
    if (isWin) {
        uiContext.fillText('You reached the evacuation point!', CANVAS_WIDTH / 2, 130);
        uiContext.fillText('You survived the radiation zone!', CANVAS_WIDTH / 2, 155);
    } else {
        uiContext.fillText('You succumbed to the wasteland...', CANVAS_WIDTH / 2, 130);
        
        const player = gameState.player;
        if (player.health <= 0) {
            uiContext.fillText('Cause: Health depleted', CANVAS_WIDTH / 2, 155);
        } else if (player.hunger <= 0) {
            uiContext.fillText('Cause: Starvation', CANVAS_WIDTH / 2, 155);
        } else if (player.thirst <= 0) {
            uiContext.fillText('Cause: Dehydration', CANVAS_WIDTH / 2, 155);
        } else if (player.radiation >= 100) {
            uiContext.fillText('Cause: Radiation poisoning', CANVAS_WIDTH / 2, 155);
        }
    }
    
    uiContext.fillStyle = '#b4b4b4';
    uiContext.font = '14px Arial';
    const player = gameState.player;
    uiContext.fillText(`Buildings Scavenged: ${gameState.buildingsScavenged}`, CANVAS_WIDTH / 2, 200);
    uiContext.fillText(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 220);
    uiContext.fillText(`Scrap Collected: ${player.inventory.scrap}`, CANVAS_WIDTH / 2, 240);
    
    uiContext.fillStyle = '#ffff64';
    uiContext.font = '18px Arial';
    uiContext.fillText('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
}