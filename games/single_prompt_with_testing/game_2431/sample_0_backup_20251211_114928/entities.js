/**
 * Game entities including Player, Tree, Particles, and FloatingText.
 * Contains logic for rendering and updating individual game objects.
 */

import { gameState, GAME_CONFIG, COLORS, SIDE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updatePhysics } from './physics.js';

/* ==========================
   BASE ENTITY
   ========================== */
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dead = false;
        this.vx = 0;
        this.vy = 0;
        this.useGravity = false;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    update() {}
    render(p) {}
}

/* ==========================
   PLAYER CLASS
   ========================== */
export class Player extends Entity {
    constructor() {
        // Adjusted Y position to account for shorter height (was 120 offset)
        super(CANVAS_WIDTH / 2 - GAME_CONFIG.PLAYER_OFFSET_X, CANVAS_HEIGHT - 110);
        this.side = SIDE.LEFT;
        this.width = 60;
        this.height = 70; // Slightly reduced logical height
        
        // Animation States
        this.isChopping = false;
        this.chopTimer = 0;
        this.chopDuration = 10; // Frames for chop animation
        this.state = "IDLE"; // IDLE, CHOPPING, DYING
    }

    moveTo(side) {
        this.side = side;
        // Update X position based on side
        if (this.side === SIDE.LEFT) {
            this.x = CANVAS_WIDTH / 2 - GAME_CONFIG.PLAYER_OFFSET_X;
        } else {
            this.x = CANVAS_WIDTH / 2 + GAME_CONFIG.PLAYER_OFFSET_X;
        }
    }

    chop() {
        this.isChopping = true;
        this.chopTimer = this.chopDuration;
        this.state = "CHOPPING";
    }

    die() {
        this.state = "DYING";
        // Create grave stone particle logic here if needed, or handle in game loop
    }

    update() {
        if (this.chopTimer > 0) {
            this.chopTimer--;
            if (this.chopTimer === 0) {
                this.isChopping = false;
                this.state = "IDLE";
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Flip if on right side
        if (this.side === SIDE.RIGHT) {
            p.scale(-1, 1);
        }

        // Draw Player Character (Geometric Style)
        
        if (this.state === "DYING") {
            // Grave marker
            p.fill(100);
            p.rectMode(p.CENTER);
            p.rect(0, 20, 40, 60, 10, 10, 0, 0);
            p.fill(200);
            p.textSize(20);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("R.I.P", 0, 20);
        } else {
            // --- Normal Player Rendering ---
            
            // Animation Offset for chopping
            let armAngle = 0;
            let bodyX = 0;
            
            if (this.isChopping) {
                // Simple chop animation using timer
                const progress = this.chopTimer / this.chopDuration;
                if (progress > 0.5) {
                    armAngle = p.map(progress, 1, 0.5, -p.PI/4, p.PI/2);
                    bodyX = 5;
                } else {
                    armAngle = p.map(progress, 0.5, 0, p.PI/2, -p.PI/4);
                    bodyX = 0;
                }
            }

            // Legs (Shortened)
            p.fill(COLORS.PLAYER_PANTS);
            p.rectMode(p.CENTER);
            p.rect(-10 + bodyX, 25, 15, 20); // Back leg (y=25, h=20)
            p.rect(10 + bodyX, 25, 15, 20);  // Front leg
            
            // Body (Shirt) (Shortened)
            p.fill(COLORS.PLAYER_SHIRT);
            p.rect(0 + bodyX, 0, 40, 40, 5); // Height 40 (was 50)
            
            // Head (Lowered)
            p.fill(COLORS.PLAYER_SKIN);
            p.rect(0 + bodyX, -30, 30, 30, 5); // y=-30 (was -35)
            
            // Beard/Hair (Lowered)
            p.fill(COLORS.TREE_BARK_DARK);
            p.rect(0 + bodyX, -40, 32, 10); // Hair (y=-40)
            p.rect(0 + bodyX, -20, 32, 10); // Beard (y=-20)
            
            // Eyes (Lowered)
            p.fill(0);
            p.circle(-5 + bodyX, -30, 4); // y=-30
            p.circle(5 + bodyX, -30, 4);

            // Arm (Shoulder) (Lowered)
            p.fill(COLORS.PLAYER_SHIRT);
            p.circle(10 + bodyX, -5, 15); // y=-5 (was -10)

            // Axe Assembly
            p.push();
            p.translate(10 + bodyX, -5); // y=-5
            p.rotate(armAngle);
            
            // Arm (Forearm)
            p.fill(COLORS.PLAYER_SKIN);
            p.rect(15, 0, 30, 10, 5);
            
            // Axe Handle
            p.fill(COLORS.AXE_HANDLE);
            p.rect(30, -15, 5, 60);
            
            // Axe Head
            p.fill(COLORS.AXE_HEAD);
            p.beginShape();
            p.vertex(28, -25);
            p.vertex(45, -35);
            p.vertex(45, -5);
            p.vertex(28, -15);
            p.endShape(p.CLOSE);
            
            p.pop();
        }

        p.pop();
    }
}

/* ==========================
   TREE SYSTEM
   ========================== */
class TreeSegment {
    constructor(y, branchSide) {
        this.y = y; // Visual Y position
        this.targetY = y;
        this.branchSide = branchSide; // SIDE.LEFT, SIDE.RIGHT, SIDE.NONE
        this.hasBranch = (branchSide !== SIDE.NONE);
        
        // Texture variations
        this.textureOffset = Math.floor(Math.random() * 20);
        this.knotY = Math.random() > 0.7 ? Math.random() * 40 - 20 : null;
    }

    render(p, season) {
        p.push();
        p.translate(CANVAS_WIDTH / 2, this.y);

        // Trunk
        p.fill(COLORS.TREE_BARK);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, GAME_CONFIG.TREE_WIDTH, GAME_CONFIG.SEGMENT_HEIGHT + 1); // +1 to overlap seams

        // Bark texture details
        p.fill(COLORS.TREE_BARK_DARK);
        p.rect(-20, this.textureOffset - 10, 5, 20);
        p.rect(30, -this.textureOffset, 5, 15);
        p.rect(10, 20, 3, 10);

        // Knot
        if (this.knotY !== null) {
            p.fill(COLORS.TREE_BARK_DARK);
            p.ellipse(15, this.knotY, 12, 8);
        }

        // Branch
        if (this.hasBranch) {
            const dir = this.branchSide === SIDE.LEFT ? -1 : 1;
            
            p.push();
            p.translate((GAME_CONFIG.TREE_WIDTH / 2) * dir, 0);
            
            // Main branch wood
            p.fill(COLORS.TREE_BARK);
            p.beginShape();
            p.vertex(0, -10);
            p.vertex(dir * GAME_CONFIG.BRANCH_LENGTH, -20);
            p.vertex(dir * GAME_CONFIG.BRANCH_LENGTH, 10);
            p.vertex(0, 20);
            p.endShape(p.CLOSE);
            
            // Leaves (based on season)
            const leafColor = season.leaves;
            p.fill(leafColor[0], leafColor[1], leafColor[2]);
            
            // Draw a cluster of leaves at the end of branch
            const tipX = dir * GAME_CONFIG.BRANCH_LENGTH;
            p.circle(tipX, -15, 30);
            p.circle(tipX + (dir * 10), -5, 25);
            p.circle(tipX, 10, 20);
            
            p.pop();
        }

        p.pop();
    }
}

export class Tree {
    constructor() {
        this.segments = [];
        this.segmentCount = 8; // Number of visible segments
        this.baseY = CANVAS_HEIGHT - 60; // Base position on screen
        
        // Initialize segments
        this.initializeTree();
        
        // Animation for falling effect
        this.fallSpeed = 0;
        this.isFalling = false;
    }

    initializeTree() {
        this.segments = [];
        // First few segments have no branches to be safe
        for (let i = 0; i < 3; i++) {
            this.addSegment(SIDE.NONE);
        }
        // Fill rest
        for (let i = 0; i < this.segmentCount + 2; i++) {
            this.addNewRandomSegment();
        }
        
        // Align visual positions
        this.resetVisualPositions();
    }

    addSegment(branchSide) {
        // Position logic is relative index based in the array, actual Y calculated in render/reset
        const newSeg = new TreeSegment(0, branchSide);
        this.segments.push(newSeg);
    }

    addNewRandomSegment() {
        // Logic to prevent impossible scenarios (e.g. Left immediately after Right)
        const lastSeg = this.segments[this.segments.length - 1];
        let newSide = SIDE.NONE;
        
        const roll = Math.random();
        
        // 50% chance of branch
        if (roll < 0.5) {
            // Decide side
            const sideRoll = Math.random();
            const potentialSide = sideRoll > 0.5 ? SIDE.RIGHT : SIDE.LEFT;
            
            // FIX: Prevent fatal alternating branches (e.g. Left then Right)
            // If the last segment had a branch, the new one cannot be on the opposite side.
            // The player would be trapped on the side safe for the first branch, 
            // but that side is fatal for the second branch when it falls.
            if (lastSeg && lastSeg.hasBranch && lastSeg.branchSide !== potentialSide) {
                 newSide = SIDE.NONE;
            } else {
                 newSide = potentialSide;
            }
        }
        
        this.addSegment(newSide);
    }

    resetVisualPositions() {
        // Reposition all segments visually to their stack positions
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].y = this.baseY - (i * GAME_CONFIG.SEGMENT_HEIGHT);
            this.segments[i].targetY = this.segments[i].y;
        }
    }

    chop() {
        // Remove bottom segment
        const removed = this.segments.shift();
        
        // Add new segment at top
        this.addNewRandomSegment();
        
        // Trigger falling animation logic
        // We shift the target Ys of all segments down by one height
        for (let i = 0; i < this.segments.length; i++) {
            // Reset current Y to be one step higher relative to new index 0
            // Actually, simplified: Just reset visual positions to 'snap' or interpolate?
            // Timberman is snappy.
            // Let's make them 'fall' into place.
            
            // Current visual Y needs to be preserved, then tweened to new target.
            // But since we shifted the array, index 0 is now the old index 1.
            // Old index 1 was at (baseY - height). It is now at index 0, so target is baseY.
            // So we don't need to change Y manually, just recalculate target based on index.
        }
        
        // Let's manually set the 'y' of the new array items to where they were visually
        // So they slide down.
        // The element at index 0 (was 1) is currently at y = baseY - height.
        // It needs to go to y = baseY.
        
        // Correct approach for smooth fall:
        // 1. Shift array.
        // 2. New segment at end gets placed visually at top + height.
        // 3. All segments get a targetY based on their new index.
        // 4. Update lerps Y towards targetY.
        
        const topIdx = this.segments.length - 1;
        // Initialize the new top segment's Y position
        this.segments[topIdx].y = this.baseY - (topIdx * GAME_CONFIG.SEGMENT_HEIGHT) - GAME_CONFIG.SEGMENT_HEIGHT;
        
        // Return removed segment for particle generation
        return removed;
    }

    update() {
        // Smoothly interpolate Y positions
        const speed = 0.4; // 40% distance per frame
        for (let i = 0; i < this.segments.length; i++) {
            const target = this.baseY - (i * GAME_CONFIG.SEGMENT_HEIGHT);
            // Snap if close
            if (Math.abs(this.segments[i].y - target) < 1) {
                this.segments[i].y = target;
            } else {
                this.segments[i].y += (target - this.segments[i].y) * speed;
            }
        }
    }

    render(p, season) {
        // Render from top to bottom so bottom overlaps top if needed (though rects don't matter much)
        // Actually bottom to top is better for painter's algorithm if we have 2.5D, but here 2D flat.
        for (let i = this.segments.length - 1; i >= 0; i--) {
            this.segments[i].render(p, season);
        }
        
        // Draw Stump base
        p.fill(COLORS.TREE_BARK);
        p.rectMode(p.CENTER);
        p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20, GAME_CONFIG.TREE_WIDTH + 20, 40, 10);
    }
}

/* ==========================
   PARTICLES & EFFECTS
   ========================== */
export class WoodChip extends Entity {
    constructor(x, y, side) {
        super(x, y);
        this.useGravity = true;
        this.vx = side === SIDE.LEFT ? Math.random() * 5 + 2 : -(Math.random() * 5 + 2);
        this.vy = -(Math.random() * 5 + 5);
        this.size = Math.random() * 10 + 5;
        this.color = COLORS.TREE_BARK;
        this.rotationSpeed = Math.random() * 0.2 - 0.1;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        p.fill(this.color);
        p.noStroke();
        p.rect(0, 0, this.size, this.size);
        p.pop();
    }
}

export class FloatingText extends Entity {
    constructor(x, y, text, color) {
        super(x, y);
        this.text = text;
        this.color = color;
        this.vy = -2;
        this.life = 30;
        this.alpha = 255;
    }

    update() {
        this.y += this.vy;
        this.life--;
        this.alpha = (this.life / 30) * 255;
        if (this.life <= 0) this.dead = true;
    }

    render(p) {
        p.push();
        p.fill(p.red(this.color), p.green(this.color), p.blue(this.color), this.alpha);
        p.stroke(0, this.alpha);
        p.strokeWeight(2);
        p.textSize(24);
        p.text(this.text, this.x, this.y);
        p.pop();
    }
}