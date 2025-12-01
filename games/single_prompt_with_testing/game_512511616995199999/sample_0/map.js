import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { uuid } from './utils.js';

/**
 * Map generation and handling.
 */

// Node types: 'monster', 'elite', 'rest', 'treasure', 'boss', 'start'
const FLOOR_CONFIG = [
    ['start'],
    ['monster'],
    ['monster', 'monster', 'event'],
    ['monster', 'rest', 'monster'],
    ['elite', 'monster'],
    ['rest'],
    ['boss']
];

export function generateMap() {
    const map = [];
    const width = 3; // 3 lanes
    
    // Generate nodes
    for (let i = 0; i < FLOOR_CONFIG.length; i++) {
        let floorNodes = [];
        let types = FLOOR_CONFIG[i];
        
        // If single type (like start/boss), create one node centered
        if (types.length === 1) {
            floorNodes.push({
                id: uuid(),
                floor: i,
                x: CANVAS_WIDTH / 2,
                y: CANVAS_HEIGHT - 50 - (i * 50),
                type: types[0],
                next: [], // IDs of next nodes
                parents: []
            });
        } else {
            // Distribute nodes across width
            let count = Math.floor(Math.random() * width) + 1;
            // Force at least 2 paths for variety in middle floors
            if (i > 1 && i < FLOOR_CONFIG.length - 1) count = Math.max(2, count);
            
            let segmentW = CANVAS_WIDTH / (count + 1);
            
            for (let j = 0; j < count; j++) {
                // Random type from available options for this floor config level
                let type = types[Math.floor(Math.random() * types.length)];
                
                floorNodes.push({
                    id: uuid(),
                    floor: i,
                    x: segmentW * (j + 1) + (Math.random() * 20 - 10),
                    y: CANVAS_HEIGHT - 50 - (i * 50),
                    type: type,
                    next: [],
                    parents: []
                });
            }
        }
        map.push(floorNodes);
    }
    
    // Connect nodes
    for (let i = 0; i < map.length - 1; i++) {
        let currentFloor = map[i];
        let nextFloor = map[i + 1];
        
        for (let node of currentFloor) {
            // Connect to at least one node in next floor
            // Simple logic: connect to nearest nodes
            
            // Find closest node in next floor
            let sortedNext = [...nextFloor].sort((a, b) => Math.abs(a.x - node.x) - Math.abs(b.x - node.x));
            
            // Connect to closest 1 or 2
            let connections = Math.min(sortedNext.length, Math.random() > 0.5 ? 2 : 1);
            
            for(let k=0; k<connections; k++) {
                node.next.push(sortedNext[k].id);
                sortedNext[k].parents.push(node.id);
            }
        }
    }
    
    // Ensure connectivity (backward pass) - make sure every next floor node has a parent
    for (let i = map.length - 1; i > 0; i--) {
        for (let node of map[i]) {
            if (node.parents.length === 0) {
                // Connect to nearest parent
                let prevFloor = map[i-1];
                let closest = prevFloor.sort((a, b) => Math.abs(a.x - node.x) - Math.abs(b.x - node.x))[0];
                closest.next.push(node.id);
                node.parents.push(closest.id);
            }
        }
    }

    gameState.map = map;
    gameState.currentNode = map[0][0]; // Start node
    gameState.currentNode.visited = true;
    gameState.floor = 0;
}

export function getNextAvailableNodes() {
    if (!gameState.currentNode) return [];
    if (!gameState.map) return [];
    
    let nextIds = gameState.currentNode.next;
    let nextFloorIndex = gameState.floor + 1;
    
    if (nextFloorIndex >= gameState.map.length) return [];
    
    return gameState.map[nextFloorIndex].filter(n => nextIds.includes(n.id));
}