import { gameState, KEYS, NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") {
        if (gameState.gamePhase === "START") return { keyCode: KEYS.ENTER };
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") return { keyCode: KEYS.R };
        return null;
    }
    
    if (gameState.controlMode === "TEST_1") {
        // Perfect Play Bot
        // Look for any unhit player note that is within the "Perfect" window (e.g., < 20ms diff)
        // And hasn't been pressed yet (we need to track if we pressed it to avoid spam)
        
        // We can check if lane is not pressed, and a note is ready.
        
        const perfectWindow = 30; // ms
        
        // Find notes ready to hit
        const readyNotes = gameState.notes.filter(n => 
            !n.isEnemy && !n.hit && !n.missed && 
            Math.abs(n.timestamp - gameState.songTime) < perfectWindow
        );
        
        if (readyNotes.length > 0) {
            const note = readyNotes[0];
            // Only press if lane not already held (simple press simulation)
            // But we need to toggle key up/down. This function returns an action to PRESS.
            // The simulation loop in typical frameworks handles the 'down' state.
            // If the key is already pressed, we don't need to press again unless it's a new note? 
            // For this simple input model, let's just return the keycode.
            // We need to ensure we don't spam.
            
            // Map type to key
            let key = 0;
            switch(note.type) {
                case NOTE_LEFT: key = KEYS.LEFT; break;
                case NOTE_DOWN: key = KEYS.DOWN; break;
                case NOTE_UP: key = KEYS.UP; break;
                case NOTE_RIGHT: key = KEYS.RIGHT; break;
            }
            
            if (!gameState.lanePressed[note.type]) {
                return { keyCode: key };
            }
        } else {
             // Release keys if no note is immediate? 
             // The system typically handles key releases or we return null.
             // If we return null, no NEW press.
        }
    }
    
    if (gameState.controlMode === "TEST_2") {
        // Do nothing (Lose)
        return null;
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;