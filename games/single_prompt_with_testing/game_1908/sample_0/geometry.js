/**
 * geometry.js
 * Definitions for Block, Rotator, and other static world elements.
 */

import { gridToScreen, getDepth } from './iso.js';
import { PALETTE, TILE_SIZE, gameState } from './globals.js';
import { Easing } from './utils.js';

export class Block {
    constructor(x, y, z, type = 'NORMAL', group = null) {
        this.gridX = x;
        this.gridY = y;
        this.gridZ = z;
        
        // Render position (can be animated)
        this.x = x;
        this.y = y;
        this.z = z;
        
        this.type = type; // NORMAL, ROTATOR_PIVOT, ROTATOR_ARM, GOAL, START
        this.group = group; // Reference to a RotatorGroup if applicable
        
        this.walkable = true;
        this.highlighted = false;
        
        // Visuals
        this.colorTop = PALETTE.blocks.walkable;
        this.colorRight = PALETTE.blocks.dark;
        this.colorLeft = PALETTE.blocks.medium;
        
        if (type === 'GOAL') {
            this.colorTop = PALETTE.goal;
        } else if (type === 'ROTATOR_ARM' || type === 'ROTATOR_PIVOT') {
            this.colorTop = PALETTE.blocks.rotator;
            this.walkable = true;
        }
    }
    
    update() {
        // If part of a moving group, sync position
        if (this.group) {
            const pos = this.group.getTransformedPosition(this.gridX, this.gridY, this.gridZ);
            this.x = pos.x;
            this.y = pos.y;
            this.z = pos.z;
        } else {
            this.x = this.gridX;
            this.y = this.gridY;
            this.z = this.gridZ;
        }
    }
    
    render(p, cameraX, cameraY) {
        const pos = gridToScreen(this.x, this.y, this.z);
        const scrX = pos.x + cameraX;
        const scrY = pos.y + cameraY;
        
        const size = TILE_SIZE;
        // Isometric Cube Drawing
        // Top Face
        p.fill(this.highlighted ? [255, 255, 200] : this.colorTop);
        p.stroke(255, 255, 255, 50);
        p.strokeWeight(1);
        
        p.beginShape();
        p.vertex(scrX, scrY - size); // Top corner
        p.vertex(scrX + size, scrY - size/2); // Right corner
        p.vertex(scrX, scrY); // Bottom corner
        p.vertex(scrX - size, scrY - size/2); // Left corner
        p.endShape(p.CLOSE);
        
        // Right Face
        p.fill(this.colorRight);
        p.beginShape();
        p.vertex(scrX, scrY);
        p.vertex(scrX + size, scrY - size/2);
        p.vertex(scrX + size, scrY + size/2);
        p.vertex(scrX, scrY + size);
        p.endShape(p.CLOSE);
        
        // Left Face
        p.fill(this.colorLeft);
        p.beginShape();
        p.vertex(scrX, scrY);
        p.vertex(scrX - size, scrY - size/2);
        p.vertex(scrX - size, scrY + size/2);
        p.vertex(scrX, scrY + size);
        p.endShape(p.CLOSE);
    }
    
    getSortDepth() {
        return getDepth(this.x, this.y, this.z);
    }
}

export class RotatorGroup {
    constructor(id, pivotX, pivotY, pivotZ, axis = 'Z') {
        this.id = id;
        this.pivot = { x: pivotX, y: pivotY, z: pivotZ };
        this.axis = axis; // 'Z', 'X', 'Y' (usually Z for horizontal rotation)
        this.blocks = [];
        
        this.currentAngle = 0; // 0, 90, 180, 270
        this.targetAngle = 0;
        this.isRotating = false;
        this.animationProgress = 0;
    }
    
    addBlock(block) {
        this.blocks.push(block);
        block.group = this;
    }
    
    rotate() {
        if (this.isRotating) return;
        this.targetAngle += 90;
        this.isRotating = true;
        this.animationProgress = 0;
    }
    
    update() {
        if (this.isRotating) {
            this.animationProgress += 0.05;
            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isRotating = false;
                this.currentAngle = this.targetAngle % 360;
                // Snap blocks to new integer grid positions
                this.finalizePositions();
            }
        }
    }
    
    getRenderAngle() {
        if (!this.isRotating) return this.currentAngle * (Math.PI / 180);
        
        const t = Easing.easeInOutQuad(this.animationProgress);
        const start = (this.targetAngle - 90) * (Math.PI / 180);
        const end = this.targetAngle * (Math.PI / 180);
        return start + (end - start) * t;
    }
    
    getTransformedPosition(bx, by, bz) {
        const rad = this.getRenderAngle();
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        // Relative to pivot
        const rx = bx - this.pivot.x;
        const ry = by - this.pivot.y;
        
        // Rotate (Standard 2D rotation matrix)
        const rotX = rx * cos - ry * sin;
        const rotY = rx * sin + ry * cos;
        
        return {
            x: this.pivot.x + rotX,
            y: this.pivot.y + rotY,
            z: bz // Assuming Z-axis rotation
        };
    }
    
    finalizePositions() {
        // Update the actual grid coordinates of the blocks after rotation
        // This is crucial for the logic graph to update correctly
        const rad = (90) * (Math.PI / 180); // We always rotate 90 deg at a time
        // Note: The blocks' stored gridX/Y are their *original* positions relative to the pivot
        // We shouldn't change gridX/gridY permanently unless we track relative offset.
        // Better strategy: The logic graph uses the *current transformed* integer positions.
        
        // Actually, let's keep gridX/Y static (local coords) and only expose 'world' coords
    }
    
    // Get the logical world coordinate for a block in this group
    getWorldCoordinate(block) {
        // Calculate based on current integer angle (0, 90, 180, 270)
        const angle = this.currentAngle % 360;
        const rad = angle * (Math.PI / 180);
        // Use Math.round to avoid float errors
        const cos = Math.round(Math.cos(rad));
        const sin = Math.round(Math.sin(rad));
        
        const rx = block.gridX - this.pivot.x;
        const ry = block.gridY - this.pivot.y;
        
        return {
            x: this.pivot.x + (rx * cos - ry * sin),
            y: this.pivot.y + (rx * sin + ry * cos),
            z: block.gridZ
        };
    }
}