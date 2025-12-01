import { gameState, KEYS, NOTE_LEFT, NOTE_DOWN, NOTE_UP, NOTE_RIGHT, RECEPTOR_Y, HIT_WINDOW } from './globals.js';
import { Particle } from './entities.js';
import { logGameEvent, resetGameState } from './globals.js';
import { generateSong } from './rhythm_engine.js';

export function handleInput(p) {
    p.keyPressed = function() {
        const key = p.keyCode;
        
        // Log Input
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                type: 'press',
                key: key,
                frame: p.frameCount,
                time: Date.now()
            });
        }
        
        // Phase Transitions
        if (key === KEYS.ENTER) {
            if (gameState.gamePhase === "START") {
                resetGameState();
                // Generate song
                gameState.notes = generateSong();
                gameState.gamePhase = "PLAYING";
                logGameEvent(p, 'game_info', { action: 'start_game' });
            }
        }
        
        if (key === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (key === KEYS.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
                resetGameState();
            }
        }
        
        // Gameplay Inputs
        if (gameState.gamePhase === "PLAYING") {
            let noteType = -1;
            if (key === KEYS.LEFT) noteType = NOTE_LEFT;
            if (key === KEYS.DOWN) noteType = NOTE_DOWN;
            if (key === KEYS.UP) noteType = NOTE_UP;
            if (key === KEYS.RIGHT) noteType = NOTE_RIGHT;
            
            if (noteType !== -1) {
                gameState.lanePressed[noteType] = true;
                if (gameState.player) {
                    const anims = ['left', 'down', 'up', 'right'];
                    gameState.player.playAnim(anims[noteType]);
                }
                checkNoteHit(p, noteType);
            }
        }
    };
    
    p.keyReleased = function() {
        if (gameState.gamePhase === "PLAYING") {
            const key = p.keyCode;
            let noteType = -1;
            if (key === KEYS.LEFT) noteType = NOTE_LEFT;
            if (key === KEYS.DOWN) noteType = NOTE_DOWN;
            if (key === KEYS.UP) noteType = NOTE_UP;
            if (key === KEYS.RIGHT) noteType = NOTE_RIGHT;
            
            if (noteType !== -1) {
                gameState.lanePressed[noteType] = false;
            }
        }
    };
}

function checkNoteHit(p, type) {
    // Find the closest unhit note of this type owned by player
    // Notes are sorted by time approx.
    // We filter for active notes near the receptor
    
    const candidates = gameState.notes.filter(n => 
        !n.isEnemy && !n.hit && !n.missed && n.type === type
    );
    
    if (candidates.length === 0) {
        // Ghost tap penalty? optional.
        return;
    }
    
    // Sort by proximity to current song time
    candidates.sort((a, b) => Math.abs(a.timestamp - gameState.songTime) - Math.abs(b.timestamp - gameState.songTime));
    
    const targetNote = candidates[0];
    const timeDiff = Math.abs(targetNote.timestamp - gameState.songTime);
    
    // Check if within window (allowance in ms)
    // HIT_WINDOW in globals is pixels, let's convert or use time.
    // 150ms is standard ample window. 45ms is perfect.
    
    if (timeDiff < 150) {
        // HIT!
        targetNote.hit = true;
        
        // Score calculation
        let scoreAdd = 0;
        let rating = "";
        
        if (timeDiff < 45) {
            scoreAdd = 300;
            rating = "SICK!!";
            gameState.health += 4;
        } else if (timeDiff < 90) {
            scoreAdd = 200;
            rating = "GOOD!";
            gameState.health += 2;
        } else {
            scoreAdd = 100;
            rating = "BAD";
            gameState.health += 0.5;
        }
        
        gameState.score += scoreAdd;
        gameState.combo++;
        
        // Effects
        createHitParticles(p, type);
        logGameEvent(p, 'game_info', { event: 'hit', rating: rating, time_diff: timeDiff });
    } else {
        // Too early? Don't count as miss yet, just ignore input, or count as 'miss' if way off?
        // Usually FNF allows mash, but standard rhythm logic says ignore if too far.
        gameState.health -= 2; // Slight penalty for spamming
        gameState.score -= 10;
    }
}

function createHitParticles(p, type) {
    // Get receptor position
    const laneOffset = CANVAS_WIDTH - (50 * 4) - 50;
    const x = laneOffset + (type * 50) + 25;
    const y = RECEPTOR_Y;
    
    // Spawn particles
    const color = getColorForParticle(type);
    for(let i=0; i<10; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

function getColorForParticle(type) {
    // Simplified RGB from globals
    if (type === 0) return [175, 75, 220];
    if (type === 1) return [75, 175, 235];
    if (type === 2) return [75, 235, 125];
    if (type === 3) return [235, 75, 95];
    return [255, 255, 255];
}