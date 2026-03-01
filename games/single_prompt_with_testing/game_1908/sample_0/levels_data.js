/**
 * levels_data.js
 * Defines the layout of game levels.
 */

import { Level } from './level.js';
import { Block, RotatorGroup } from './geometry.js';
import { Crow } from './entities.js';

export function createLevel(index) {
    const level = new Level();
    
    if (index === 0) {
        // LEVEL 1: Introduction
        // Simple path
        // 0,0,0 to 4,0,0
        for (let i = 0; i < 5; i++) {
            level.addBlock(new Block(i, 0, 0));
        }
        // Turn
        for (let i = 1; i < 4; i++) {
            level.addBlock(new Block(4, i, 0));
        }
        // Goal
        level.addBlock(new Block(4, 4, 0, 'GOAL'));
        
        level.startPos = {x: 0, y: 0, z: 0};
        
    } else if (index === 1) {
        // LEVEL 2: The Rotator
        // Start platform
        level.addBlock(new Block(0, 0, 0));
        level.addBlock(new Block(1, 0, 0));
        
        // Rotator in the middle
        const rotator = new RotatorGroup('bridge', 3, 0, 0);
        rotator.addBlock(new Block(2, 0, 0, 'ROTATOR_ARM')); // Pivot point (roughly)
        rotator.addBlock(new Block(3, 0, 0, 'ROTATOR_PIVOT'));
        rotator.addBlock(new Block(4, 0, 0, 'ROTATOR_ARM'));
        level.addRotator(rotator);
        
        // Goal Platform (disconnected initially)
        // If rotator is 0 deg: blocks at 2,0,0 | 3,0,0 | 4,0,0. Connects to 1,0,0.
        // But Goal is at 3, 3, 0?
        // Let's put goal at 3, 2, 0.
        // If rotator rotates 90 deg -> blocks become (3, -1, 0), (3,0,0), (3,1,0).
        // 3,1,0 connects to 3,2,0.
        
        level.addBlock(new Block(3, 2, 0));
        level.addBlock(new Block(3, 3, 0, 'GOAL'));
        
        level.startPos = {x: 0, y: 0, z: 0};
        
    } else {
        // LEVEL 3: Impossible Visual Connection
        // High platform and Low platform
        level.addBlock(new Block(0, 0, 0));
        level.addBlock(new Block(1, 0, 0));
        
        // High platform
        level.addBlock(new Block(3, 3, 4, 'GOAL'));
        level.addBlock(new Block(3, 2, 4));
        
        // Rotator to bridge the gap visually
        const rotator = new RotatorGroup('magic', 2, 1, 0); // Pivot at 2,1,0
        // L shape
        rotator.addBlock(new Block(2, 1, 0, 'ROTATOR_PIVOT'));
        rotator.addBlock(new Block(2, 0, 0, 'ROTATOR_ARM')); 
        rotator.addBlock(new Block(2, 2, 2, 'ROTATOR_ARM')); // Higher block on the arm!
        
        // When rotated, (2,2,2) might align with (3,2,4) or similar?
        // This is hard to hand-code without a visual editor.
        // Let's do a simple bridge that connects physically for Level 3 for now.
        
        level.addRotator(rotator);
        
        level.startPos = {x: 0, y: 0, z: 0};
    }
    
    return level;
}