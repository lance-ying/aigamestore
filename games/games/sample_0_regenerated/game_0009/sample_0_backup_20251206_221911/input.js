import { gameState } from './globals.js';

export class InputManager {
    constructor() {
        this.keys = {};
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        // Add listeners
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    handleKeyDown(e) {
        this.keys[e.code] = true;
        this.logInput('keydown', e.code);
        
        // Handle Game Phase transitions immediately
        if (e.code === 'Enter') {
            if (gameState.gamePhase === "START") {
                this.startGame();
            }
        }
        
        if (e.code === 'KeyR') {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                this.resetGame();
            }
        }
        
        if (e.code === 'Escape') {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        this.logInput('keyup', e.code);
    }
    
    logInput(type, key) {
        if (window.logs.inputs.length < 2000) {
            window.logs.inputs.push({
                input_type: type,
                data: { key },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    isDown(keyCodes) {
        if (Array.isArray(keyCodes)) {
            return keyCodes.some(code => this.keys[code]);
        }
        return this.keys[keyCodes];
    }
    
    // Actions
    get moveLeft() { return this.isDown(['ArrowLeft', 'KeyA']); }
    get moveRight() { return this.isDown(['ArrowRight', 'KeyD']); }
    get moveForward() { return this.isDown(['ArrowUp', 'KeyW']); } // Into screen (Z-)
    get moveBackward() { return this.isDown(['ArrowDown', 'KeyS']); } // Out of screen (Z+)
    get jump() { return this.isDown(['Space']); }
    get shoot() { return this.isDown(['KeyZ', 'ShiftLeft', 'ShiftRight']); }
    
    startGame() {
        // Logic to start game
        // This is handled in main update loop usually, or we trigger it here
        if (window.gameInstance && window.gameInstance.start) {
            window.gameInstance.start();
        }
    }
    
    resetGame() {
        if (window.gameInstance && window.gameInstance.reset) {
            window.gameInstance.reset();
        }
    }
    
    cleanup() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}