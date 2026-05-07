import { gameState } from './globals.js';

class InputManager {
    constructor() {
        this.keys = {};
        this.prevKeys = {};
        
        // Map key codes to logical names
        this.keyMap = {
            38: 'UP', 87: 'UP',       // ArrowUp, W
            40: 'DOWN', 83: 'DOWN',   // ArrowDown, S
            37: 'LEFT', 65: 'LEFT',   // ArrowLeft, A
            39: 'RIGHT', 68: 'RIGHT', // ArrowRight, D
            32: 'JUMP',               // Space
            16: 'SPRINT',             // Shift
            90: 'ACTION',             // Z
            13: 'ENTER',              // Enter
            27: 'ESC',                // Esc
            82: 'RESTART'             // R
        };
        
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    
    onKeyDown(event) {
        // Prevent default scrolling for game keys
        if([32, 37, 38, 39, 40].indexOf(event.keyCode) > -1) {
            event.preventDefault();
        }

        const action = this.keyMap[event.keyCode];
        if (action) {
            this.keys[action] = true;
            
            // Log input
            window.logs.inputs.push({
                input_type: 'keydown',
                data: { key: event.key, keyCode: event.keyCode, action },
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    onKeyUp(event) {
        const action = this.keyMap[event.keyCode];
        if (action) {
            this.keys[action] = false;
        }
    }
    
    update() {
        // Store previous frame keys for edge detection
        this.prevKeys = { ...this.keys };
    }
    
    isDown(action) {
        return !!this.keys[action];
    }
    
    justPressed(action) {
        return !!this.keys[action] && !this.prevKeys[action];
    }
}

export const input = new InputManager();