import { gameState, NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT } from './globals.js';
import { Note } from './entities.js';

// Procedurally generate a "song"
export function generateSong() {
    const notes = [];
    const bpm = 130;
    gameState.bpm = bpm;
    gameState.beatDuration = 60000 / bpm; // ms per beat
    
    // Create 2 minutes of notes
    const duration = 2 * 60 * 1000;
    let time = 2000; // Start offset
    
    while (time < duration) {
        // Pattern 1: Alternating Player/Enemy
        const isEnemyTurn = Math.floor(time / (gameState.beatDuration * 4)) % 2 === 0;
        
        // Difficulty ramp: more density as time goes on
        const density = Math.min(0.8, 0.3 + (time / duration) * 0.5);
        
        if (Math.random() < density) {
            // Add a note
            const type = Math.floor(Math.random() * 4);
            const note = new Note(type, time, isEnemyTurn);
            notes.push(note);
            
            // Sometimes add a double or syncopated note
            if (Math.random() < 0.3) {
                 const type2 = (type + 1) % 4;
                 notes.push(new Note(type2, time + gameState.beatDuration/2, isEnemyTurn));
            }
        }
        
        // Advance time by 1 beat
        time += gameState.beatDuration;
    }
    
    // Sort by timestamp just in case
    notes.sort((a, b) => a.timestamp - b.timestamp);
    
    return notes;
}

export function updateRhythm(p) {
    if (gameState.gamePhase !== 'PLAYING') return;
    
    // Update song time
    const now = p.millis();
    if (gameState.songStartFrame === 0) {
        // Initialize start time relative to now if resuming or starting
        // But we rely on deltaTime for smooth accumulation usually
        // For simplicity, let's use accumulated delta time
    }
    
    // Increment song time by deltaTime (in ms)
    gameState.songTime += (gameState.deltaTime * 1000);
    
    // Calculate beats
    gameState.currentBeat = gameState.songTime / gameState.beatDuration;
    
    // Auto-play enemy notes logic
    gameState.notes.forEach(note => {
        if (note.isEnemy && !note.hit) {
            // Enemy hits note perfectly when it crosses timestamp
            if (gameState.songTime >= note.timestamp) {
                note.hit = true;
                if (gameState.enemy) {
                    const anims = ['left', 'down', 'up', 'right'];
                    gameState.enemy.playAnim(anims[note.type]);
                    gameState.enemyLanePressed[note.type] = true;
                    // Reset pressed state after short delay
                    setTimeout(() => { gameState.enemyLanePressed[note.type] = false; }, 100);
                }
            }
        }
        
        // Check for missed player notes
        if (!note.isEnemy && !note.hit && !note.missed) {
            // If note is too far past (allow 150ms late)
            if (gameState.songTime > note.timestamp + 150) {
                note.missed = true;
                gameState.health -= 5; // Penalty
                gameState.combo = 0;
                if (gameState.player) gameState.player.playAnim('miss');
                
                // Log miss
                 if (p.logs && p.logs.game_info) {
                    p.logs.game_info.push({ event: 'miss', note_time: note.timestamp, current_time: gameState.songTime });
                }
            }
        }
    });
    
    // Check Loss Condition
    if (gameState.health <= 0) {
        gameState.gamePhase = 'GAME_OVER_LOSE';
    } else if (gameState.health > 100) {
        gameState.health = 100;
    }
    
    // Check Win Condition (End of song)
    // Find last note time
    if (gameState.notes.length > 0) {
        const lastNote = gameState.notes[gameState.notes.length - 1];
        if (gameState.songTime > lastNote.timestamp + 2000) {
            gameState.gamePhase = 'GAME_OVER_WIN';
        }
    }
}