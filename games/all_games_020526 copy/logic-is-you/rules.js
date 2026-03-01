import { gameState, GRID_W, GRID_H } from './globals.js';
import { TYPES, isText, TEXT_TO_TYPE, TEXT_TO_PROPERTY } from './types.js';

export function parseRules() {
    // Reset rules
    gameState.rules = [];
    gameState.isYou.clear();
    gameState.isPush.clear();
    gameState.isStop.clear();
    gameState.isWin.clear();
    gameState.isDefeat.clear();
    gameState.isSink.clear();
    gameState.transforms.clear();
    
    // Default: Text is always PUSH
    Object.values(TYPES).forEach(t => {
        if (isText(t)) gameState.isPush.add(t);
    });

    const words = [];
    
    // 1. Scan Horizontal
    for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
            const cell = gameState.grid[x][y];
            const word = getTopWord(cell);
            if (word) {
                // Check if we can form a sentence starting here
                checkSentence(x, y, 1, 0); // dx=1, dy=0
                checkSentence(x, y, 0, 1); // dx=0, dy=1
            }
        }
    }
    
    // Apply rules
    gameState.rules.forEach(rule => {
        const subject = TEXT_TO_TYPE[rule.subject];
        
        // Property assignment (BABA IS YOU)
        if (rule.property && !rule.object) {
            const prop = TEXT_TO_PROPERTY[rule.property];
            switch (prop) {
                case 'YOU': gameState.isYou.add(subject); break;
                case 'STOP': gameState.isStop.add(subject); break;
                case 'WIN': gameState.isWin.add(subject); break;
                case 'PUSH': gameState.isPush.add(subject); break;
                case 'DEFEAT': gameState.isDefeat.add(subject); break;
                case 'SINK': gameState.isSink.add(subject); break;
            }
        }
        
        // Transformation (ROCK IS BABA)
        if (rule.object && !rule.property) {
            const targetType = TEXT_TO_TYPE[rule.object];
            if (subject && targetType) {
                gameState.transforms.set(subject, targetType);
            }
        }
    });
    
    // Log rules for debug
    // console.log("Parsed Rules:", gameState.rules);
}

function getTopWord(cellEntities) {
    // Return the text entity on top if any
    for (let i = cellEntities.length - 1; i >= 0; i--) {
        if (isText(cellEntities[i].type)) {
            return cellEntities[i];
        }
    }
    return null;
}

function checkSentence(x, y, dx, dy) {
    // Need at least 3 cells: NOUN IS PROPERTY/NOUN
    const w1 = getWordAt(x, y);
    const w2 = getWordAt(x + dx, y + dy);
    const w3 = getWordAt(x + dx * 2, y + dy * 2);
    
    if (!w1 || !w2 || !w3) return;
    
    // Check structure: [NOUN] [IS] [?]
    if (TEXT_TO_TYPE[w1.type] && w2.type === TYPES.TEXT_IS) {
        // Valid Subject and Operator
        
        // Check Predicate
        if (TEXT_TO_PROPERTY[w3.type]) {
            // [NOUN] IS [PROPERTY]
            addRule(w1.type, w3.type, null);
        } else if (TEXT_TO_TYPE[w3.type]) {
            // [NOUN] IS [NOUN] (Transformation)
            addRule(w1.type, null, w3.type);
        }
    }
}

function getWordAt(x, y) {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return null;
    return getTopWord(gameState.grid[x][y]);
}

function addRule(subject, property, object) {
    gameState.rules.push({ subject, property, object });
}

export function applyTransforms() {
    let changed = false;
    
    // Apply transformations immediately
    // If transforms has 'ROCK' -> 'BABA', find all ROCKs and make them BABAs
    gameState.entities.forEach(ent => {
        if (gameState.transforms.has(ent.type)) {
            ent.type = gameState.transforms.get(ent.type);
            changed = true;
        }
    });
    
    return changed;
}