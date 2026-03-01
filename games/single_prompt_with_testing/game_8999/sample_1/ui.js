import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCKS } from './globals.js';

let uiCanvas, uiCtx;

export function initUI() {
    uiCanvas = document.createElement('canvas');
    uiCanvas.width = CANVAS_WIDTH;
    uiCanvas.height = CANVAS_HEIGHT;
    uiCanvas.style.position = 'absolute';
    uiCanvas.style.top = '0';
    uiCanvas.style.left = '0';
    uiCanvas.style.pointerEvents = 'none';
    
    // Append to container
    gameState.gameContainer.appendChild(uiCanvas);
    uiCtx = uiCanvas.getContext('2d');
}

export function renderUI() {
    uiCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.gamePhase === "START") {
        drawScreen("BLOCKCRAFT 3D", "Press ENTER to Start", "Controls: WASD Move, Arrows Look, Z Interact, Shift Slot");
    } else if (gameState.gamePhase === "PLAYING") {
        drawHUD();
    } else if (gameState.gamePhase === "PAUSED") {
        drawScreen("PAUSED", "Press ESC to Resume");
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        drawScreen("GAME OVER", "You Died!", "Press R to Restart");
    }
}

function drawHUD() {
    // Crosshair
    uiCtx.strokeStyle = 'white';
    uiCtx.lineWidth = 2;
    uiCtx.beginPath();
    uiCtx.moveTo(CANVAS_WIDTH/2 - 10, CANVAS_HEIGHT/2);
    uiCtx.lineTo(CANVAS_WIDTH/2 + 10, CANVAS_HEIGHT/2);
    uiCtx.moveTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    uiCtx.lineTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    uiCtx.stroke();
    
    if (!gameState.player) return;
    
    // Health Bar
    const hp = gameState.player.health;
    const maxHp = gameState.player.maxHealth;
    const barW = 200;
    
    uiCtx.fillStyle = '#333';
    uiCtx.fillRect(10, 10, barW, 20);
    uiCtx.fillStyle = '#ff3333';
    uiCtx.fillRect(10, 10, barW * (hp/maxHp), 20);
    uiCtx.strokeStyle = '#fff';
    uiCtx.strokeRect(10, 10, barW, 20);
    uiCtx.fillStyle = '#fff';
    uiCtx.font = '12px Arial';
    uiCtx.fillText(`HP: ${Math.floor(hp)}`, 15, 25);
    
    // Inventory
    const slotSize = 40;
    const startX = CANVAS_WIDTH / 2 - (gameState.player.inventory.length * slotSize) / 2;
    const y = CANVAS_HEIGHT - 50;
    
    gameState.player.inventory.forEach((item, index) => {
        const x = startX + index * slotSize;
        
        // Selected highlight
        if (index === gameState.player.selectedSlot) {
            uiCtx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            uiCtx.fillRect(x - 2, y - 2, slotSize + 4, slotSize + 4);
        }
        
        uiCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        uiCtx.fillRect(x, y, slotSize, slotSize);
        uiCtx.strokeStyle = '#fff';
        uiCtx.strokeRect(x, y, slotSize, slotSize);
        
        // Item Name
        uiCtx.fillStyle = '#fff';
        uiCtx.textAlign = 'center';
        uiCtx.font = '10px Arial';
        const name = item.type === "PICKAXE" ? "PICK" : getName(item.type);
        uiCtx.fillText(name, x + slotSize/2, y + slotSize/2 + 4);
    });
    
    // Debug info
    /*
    uiCtx.textAlign = 'left';
    uiCtx.fillText(`Pos: ${gameState.player.mesh.position.x.toFixed(1)}, ${gameState.player.mesh.position.y.toFixed(1)}, ${gameState.player.mesh.position.z.toFixed(1)}`, 10, 50);
    */
}

function getName(id) {
    return Object.keys(BLOCKS).find(key => BLOCKS[key] === id) || "?";
}

function drawScreen(title, sub, sub2) {
    uiCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    uiCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    uiCtx.fillStyle = '#fff';
    uiCtx.textAlign = 'center';
    
    uiCtx.font = 'bold 40px Arial';
    uiCtx.fillText(title, CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    uiCtx.font = '20px Arial';
    uiCtx.fillText(sub, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    if (sub2) {
        uiCtx.font = '16px Arial';
        uiCtx.fillStyle = '#ccc';
        uiCtx.fillText(sub2, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
}