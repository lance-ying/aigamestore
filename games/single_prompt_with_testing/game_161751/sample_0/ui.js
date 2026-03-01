import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let canvas, ctx;

export function initUI() {
    // Check if canvas exists in container
    const existing = document.querySelector('#ui-layer');
    if (existing) existing.remove();

    canvas = document.createElement('canvas');
    canvas.id = 'ui-layer';
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    
    if (gameState.gameContainer) {
        gameState.gameContainer.appendChild(canvas);
    } else {
        document.body.appendChild(canvas);
    }
    
    ctx = canvas.getContext('2d');
}

export function renderUI() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameState.gamePhase === "START") {
        renderStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
        renderHUD();
    } else if (gameState.gamePhase === "PAUSED") {
        renderHUD();
        renderPauseScreen();
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        renderWinScreen();
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        // Not really used yet, but good practice
        renderLoseScreen();
    }
}

function renderStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UNTITLED GOOSE CLONE', CANVAS_WIDTH/2, 120);
    
    ctx.font = '18px Arial';
    ctx.fillText('It is a lovely morning in the village', CANVAS_WIDTH/2, 160);
    ctx.fillText('and you are a horrible goose.', CANVAS_WIDTH/2, 185);
    
    ctx.fillStyle = '#FFA500'; // Beak color
    ctx.font = 'bold 24px Arial';
    ctx.fillText('PRESS ENTER TO HONK (START)', CANVAS_WIDTH/2, 280);
    
    ctx.fillStyle = '#ccc';
    ctx.font = '14px Arial';
    ctx.fillText('Controls: Arrows/WASD to Move | SPACE to Honk | Z to Grab', CANVAS_WIDTH/2, 330);
    ctx.fillText('Shift to Run | X to Toggle List | ESC to Pause', CANVAS_WIDTH/2, 350);
}

function renderHUD() {
    // Task List Paper Style
    if (gameState.showTodoList) {
        // Increased width to fit text
        const paperW = 340;
        const paperH = 180;
        const pad = 10;
        
        ctx.fillStyle = '#fff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 10;
        ctx.fillRect(CANVAS_WIDTH - paperW - pad, pad, paperW, paperH);
        ctx.shadowBlur = 0;
        
        // Notebook lines
        ctx.strokeStyle = '#add8e6';
        ctx.lineWidth = 1;
        for(let i=0; i<8; i++) {
            const y = pad + 40 + i * 20;
            ctx.beginPath();
            ctx.moveTo(CANVAS_WIDTH - paperW - pad, y);
            ctx.lineTo(CANVAS_WIDTH - pad, y);
            ctx.stroke();
        }
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TO DO LIST', CANVAS_WIDTH - paperW/2 - pad, pad + 25);
        
        ctx.textAlign = 'left';
        ctx.font = '12px "Courier New", monospace';
        
        let yOff = pad + 45;
        gameState.tasks.forEach(task => {
            if (task.completed) {
                ctx.fillStyle = '#888';
                ctx.fillText('[x] ' + task.text, CANVAS_WIDTH - paperW - pad + 10, yOff);
                // Strike through
                ctx.beginPath();
                ctx.moveTo(CANVAS_WIDTH - paperW - pad + 5, yOff - 4);
                ctx.lineTo(CANVAS_WIDTH - pad - 5, yOff - 4);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#000';
                ctx.fillText('[ ] ' + task.text, CANVAS_WIDTH - paperW - pad + 10, yOff);
            }
            yOff += 20;
        });
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.strokeText(`Score: ${gameState.score}`, 20, 40);
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
}

function renderPauseScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.font = '20px Arial';
    ctx.fillText('Press ESC to Resume', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}

function renderWinScreen() {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LOVELY MORNING!', CANVAS_WIDTH/2, 150);
    
    ctx.font = '24px Arial';
    ctx.fillText('All tasks completed.', CANVAS_WIDTH/2, 200);
    ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 240);
    
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to play again', CANVAS_WIDTH/2, 300);
}

function renderLoseScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#f00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('Press R to Restart', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
}