/**
 * level.js
 * Manages the game world, entities, and connectivity graph.
 */

import { Block, RotatorGroup } from './geometry.js';
import { gridToScreen, areVisuallyConnected } from './iso.js';
import { gameState } from './globals.js';

export class Level {
    constructor() {
        this.blocks = [];
        this.rotators = [];
        this.graph = new Map(); // Adjacency list: "x,y,z" -> [ {x,y,z}, ... ]
        this.startPos = {x: 0, y: 0, z: 0};
        this.goalPos = {x: 0, y: 0, z: 0};
    }
    
    addBlock(block) {
        this.blocks.push(block);
    }
    
    addRotator(rotator) {
        this.rotators.push(rotator);
        // Add its blocks to the main list too
        rotator.blocks.forEach(b => this.blocks.push(b));
    }
    
    update() {
        this.rotators.forEach(r => r.update());
        this.blocks.forEach(b => b.update());
        
        // Rebuild graph only if rotation stopped or changed
        // For simplicity, we can rebuild lazily or when requested.
        // We'll rebuild every frame only if efficient, or flag it.
        // Let's rebuild every frame for now (2000 lines budget allows optimization later)
        this.buildConnectivityGraph();
    }
    
    buildConnectivityGraph() {
        this.graph.clear();
        
        // 1. Get world positions of all blocks
        const nodes = this.blocks.map(b => {
            let pos;
            if (b.group) {
                pos = b.group.getWorldCoordinate(b);
            } else {
                pos = { x: b.x, y: b.y, z: b.z };
            }
            // Round to ensure integer keys
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);
            pos.z = Math.round(pos.z);
            return { block: b, pos };
        });
        
        // 2. Build map for quick lookup
        const nodeMap = new Map();
        nodes.forEach(node => {
            nodeMap.set(`${node.pos.x},${node.pos.y},${node.pos.z}`, node);
        });
        
        // 3. Connect Neighbors (Standard 3D)
        nodes.forEach(node => {
            const key = `${node.pos.x},${node.pos.y},${node.pos.z}`;
            const neighbors = [];
            
            // Standard 4 cardinal directions
            const dirs = [
                {x:1, y:0, z:0}, {x:-1, y:0, z:0},
                {x:0, y:1, z:0}, {x:0, y:-1, z:0}
            ];
            
            // Check Physical Neighbors
            dirs.forEach(d => {
                const nk = `${node.pos.x + d.x},${node.pos.y + d.y},${node.pos.z}`; // Same level
                const nk_up = `${node.pos.x + d.x},${node.pos.y + d.y},${node.pos.z + 1}`; // Step up (ramps not imp, but maybe steps?)
                const nk_down = `${node.pos.x + d.x},${node.pos.y + d.y},${node.pos.z - 1}`; // Step down
                
                // Simplified: Only flat movement for now
                if (nodeMap.has(nk)) {
                    neighbors.push(nodeMap.get(nk));
                }
            });
            
            // 4. IMPOSSIBLE CONNECTIONS (Visual Overlap)
            // Compare this node with ALL other nodes (O(N^2) - be careful with level size)
            // Optimization: Only check nodes that are physically far but visually close?
            nodes.forEach(other => {
                if (node === other) return;
                
                // Get Screen Coords
                const s1 = gridToScreen(node.pos.x, node.pos.y, node.pos.z);
                const s2 = gridToScreen(other.pos.x, other.pos.y, other.pos.z);
                
                // Check if adjacent on screen (visually connected faces)
                // We want to connect if the 'walkable' faces align.
                // This usually happens when one block is 'behind' another in 3D but aligns in 2D.
                // Simple check: are centers close?
                // Actually, we want to walk FROM node TO other.
                // They need to appear physically adjacent.
                // So s1 should be roughly 1 tile away from s2 in screen space? 
                // No, the "impossible" link connects two separate surfaces as if they were one path.
                // Usually this means they overlap visually to form a bridge.
                
                // Let's implement the specific "Waterfall" illusion:
                // A block at (x, y, z) visually aligns with (x, y+1, z+1) or similar?
                
                // Better approach for this game:
                // If two blocks have screen coordinates that are within "Adjacent Tile Distance", connect them.
                // Distance between screen centers of adjacent tiles is approx TILE_SIZE.
                
                const dist = Math.sqrt(Math.pow(s1.x - s2.x, 2) + Math.pow(s1.y - s2.y, 2));
                // Theoretical distance between adjacent iso tiles (dx=1, dy=0) -> x diff is width/2, y diff is height/2.
                // Sqrt((30)^2 + (15)^2) approx 33.5.
                // Let's use a range.
                if (dist > 25 && dist < 45) {
                    // It looks like a neighbor.
                    // But we must prevent connecting through walls.
                    // For now, allow it. This is "Valley of Illusions".
                    
                    // Only add if not already added physically
                    // And check if they are not vertically stacked (z diff > 1 might be weird)
                    
                    // Verify they are not already physical neighbors
                    const physDist = Math.abs(node.pos.x - other.pos.x) + Math.abs(node.pos.y - other.pos.y) + Math.abs(node.pos.z - other.pos.z);
                    if (physDist > 1) {
                         neighbors.push(other);
                    }
                }
            });
            
            this.graph.set(key, neighbors);
        });
    }
    
    // Get logical neighbors for a position
    getNeighbors(x, y, z) {
        // Find the node at x,y,z
        // Since positions are integers, we can key directly
        const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
        return this.graph.get(key) || [];
    }
    
    getNodeAt(x, y, z) {
        // Helper to find block at coords
        // Need to iterate because of Rotators
        for (const b of this.blocks) {
            let pos;
            if (b.group) pos = b.group.getWorldCoordinate(b);
            else pos = {x: b.x, y: b.y, z: b.z};
            
            if (Math.round(pos.x) === Math.round(x) && 
                Math.round(pos.y) === Math.round(y) && 
                Math.round(pos.z) === Math.round(z)) {
                return b;
            }
        }
        return null;
    }
}