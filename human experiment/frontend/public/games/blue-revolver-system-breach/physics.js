/**
 * physics.js
 * Collision detection wrappers using p5.collide2D and basic AABB/Circle math.
 */

// Import collision library logic (assuming loaded via script tag globally as collideRectRect etc)
// p5.collide2D attaches to p5.prototype usually, but we can also use standalone functions if available
// or write custom ones to be safe and dependency-free if the library fails to load.
// We will implement custom efficient checks here to ensure reliability.

export const Physics = {
    // Circle-Circle Collision (Cheapest)
    checkCircleCircle: (x1, y1, r1, x2, y2, r2) => {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distSq = dx * dx + dy * dy;
        const rSum = r1 + r2;
        return distSq <= rSum * rSum;
    },

    // AABB (Rect-Rect)
    checkAABB: (r1, r2) => {
        return (
            r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y
        );
    },
    
    // Circle-Rect
    checkCircleRect: (cx, cy, radius, rx, ry, rw, rh) => {
        // Find the closest point to the circle within the rectangle
        let testX = cx;
        let testY = cy;

        if (cx < rx) testX = rx;      // Left edge
        else if (cx > rx + rw) testX = rx + rw;   // Right edge
        
        if (cy < ry) testY = ry;      // Top edge
        else if (cy > ry + rh) testY = ry + rh;   // Bottom edge

        // Get distance from closest edges
        const distX = cx - testX;
        const distY = cy - testY;
        const distance = Math.sqrt((distX * distX) + (distY * distY));

        return distance <= radius;
    }
};

/**
 * Grid-based Spatial Partitioning for efficient collision detection.
 * Essential for bullet hell with 100s of entities.
 */
export class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    key(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    clear() {
        this.grid.clear();
    }

    insert(entity) {
        // Simple insertion based on center point
        // For large entities, might need to insert into multiple cells
        const k = this.key(entity.x, entity.y);
        if (!this.grid.has(k)) {
            this.grid.set(k, []);
        }
        this.grid.get(k).push(entity);
    }

    // Retrieve potential collisions for an entity
    query(entity) {
        const neighbors = [];
        const cx = Math.floor(entity.x / this.cellSize);
        const cy = Math.floor(entity.y / this.cellSize);

        // Check 3x3 grid around entity
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const k = `${cx + i},${cy + j}`;
                if (this.grid.has(k)) {
                    const cellEntities = this.grid.get(k);
                    for (let e of cellEntities) {
                        if (e !== entity) neighbors.push(e);
                    }
                }
            }
        }
        return neighbors;
    }
}