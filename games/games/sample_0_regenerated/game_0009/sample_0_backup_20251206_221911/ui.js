import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class UIManager {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none'; // Click through
        
        this.ctx = this.canvas.getContext('2d');
        
        // Append to container
        if (gameState.gameContainer) {
            gameState.gameContainer.appendChild(this.canvas);
        } else {
            document.body.appendChild(this.canvas);
        }
    }
    
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (gameState.gamePhase === "START") {
            this.drawStartScreen();
        } else if (gameState.gamePhase === "PLAYING") {
            this.drawHUD();
        } else if (gameState.gamePhase === "PAUSED") {
            this.drawHUD();
            this.drawPauseScreen();
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            this.drawGameOverScreen();
        }
    }
    
    drawText(text, x, y, size, color, align = 'center') {
        const ctx = this.ctx;
        ctx.fillStyle = color;
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
    }
    
    drawStartScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        this.drawText("DEEP SHAFT DOWN", CANVAS_WIDTH/2, 120, 40, '#FFFFFF');
        this.drawText("Plunge into the abyss. Shoot Gunboots to slow fall.", CANVAS_WIDTH/2, 180, 18, '#CCCCCC');
        this.drawText("Arrows/WASD: Move | Space: Jump | Z: Shoot", CANVAS_WIDTH/2, 220, 16, '#AAAAAA');
        this.drawText("PRESS ENTER TO START", CANVAS_WIDTH/2, 300, 24, '#FFFF00');
    }
    
    drawHUD() {
        // Score
        this.drawText(`SCORE: ${gameState.score}`, 20, 30, 20, '#FFFFFF', 'left');
        
        // Health
        const hp = gameState.player ? gameState.player.health : 0;
        this.drawText(`HP: ${hp}`, 20, 60, 20, '#FF0000', 'left');
        
        // Ammo
        const ammo = gameState.player ? gameState.player.ammo : 0;
        this.drawText(`AMMO: ${ammo}`, 20, 90, 20, '#FFFF00', 'left');
        
        // Depth
        const depth = gameState.player ? Math.abs(Math.min(0, Math.floor(gameState.player.mesh.position.y))) : 0;
        this.drawText(`DEPTH: ${depth}m`, CANVAS_WIDTH - 20, 30, 20, '#FFFFFF', 'right');
    }
    
    drawPauseScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.drawText("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 40, '#FFFFFF');
    }
    
    drawGameOverScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        const msg = gameState.gamePhase === "GAME_OVER_WIN" ? "MISSION ACCOMPLISHED" : "GAME OVER";
        const color = gameState.gamePhase === "GAME_OVER_WIN" ? '#00FF00' : '#FF0000';
        
        this.drawText(msg, CANVAS_WIDTH/2, 150, 40, color);
        this.drawText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 200, 24, '#FFFFFF');
        this.drawText("Press R to Restart", CANVAS_WIDTH/2, 300, 20, '#AAAAAA');
    }
}