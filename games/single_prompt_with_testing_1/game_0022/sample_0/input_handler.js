// input_handler.js
export class InputHandler {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            shift: false,
            z: false
        };
        
        this.zPressed = false;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e.keyCode);
        });
        
        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e.keyCode);
        });
    }
    
    handleKeyDown(keyCode) {
        switch(keyCode) {
            case 38: this.keys.up = true; break;
            case 40: this.keys.down = true; break;
            case 37: this.keys.left = true; break;
            case 39: this.keys.right = true; break;
            case 32: this.keys.space = true; break;
            case 16: this.keys.shift = true; break;
            case 90: // Z key
                if (!this.zPressed) {
                    this.keys.z = true;
                    this.zPressed = true;
                }
                break;
        }
    }
    
    handleKeyUp(keyCode) {
        switch(keyCode) {
            case 38: this.keys.up = false; break;
            case 40: this.keys.down = false; break;
            case 37: this.keys.left = false; break;
            case 39: this.keys.right = false; break;
            case 32: this.keys.space = false; break;
            case 16: this.keys.shift = false; break;
            case 90:
                this.keys.z = false;
                this.zPressed = false;
                break;
        }
    }
    
    updateFromAutomatedTesting(action) {
        this.keys.up = action.up || false;
        this.keys.down = action.down || false;
        this.keys.left = action.left || false;
        this.keys.right = action.right || false;
        this.keys.space = action.space || false;
        this.keys.shift = action.shift || false;
        this.keys.z = action.z || false;
    }
    
    getInputs() {
        return { ...this.keys };
    }
}