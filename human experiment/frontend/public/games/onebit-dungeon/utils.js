import { gameState, TILE_SIZE } from './globals.js';

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function gridToPixel(gridX, gridY) {
    return {
        x: gridX * TILE_SIZE,
        y: gridY * TILE_SIZE
    };
}

// Simple AABB collision for particles/non-grid entities
export function checkCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

// Distance heuristic (Manhattan)
export function distManhattan(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Distance Euclidean
export function distEuclidean(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// A* Pathfinding helper
export function findPath(startX, startY, targetX, targetY, map) {
    // Simplified Greedy Best-First Search for performance in JS
    // A* implementation
    
    let openSet = [{x: startX, y: startY, cost: 0, dist: distManhattan(startX, startY, targetX, targetY)}];
    let cameFrom = new Map();
    let gScore = new Map();
    gScore.set(`${startX},${startY}`, 0);
    
    let visited = new Set();
    
    while (openSet.length > 0) {
        // Sort by heuristic
        openSet.sort((a, b) => (a.cost + a.dist) - (b.cost + b.dist));
        let current = openSet.shift();
        
        if (current.x === targetX && current.y === targetY) {
            // Reconstruct path
            let path = [];
            let currKey = `${targetX},${targetY}`;
            while (cameFrom.has(currKey)) {
                let coords = currKey.split(',').map(Number);
                path.unshift({x: coords[0], y: coords[1]});
                currKey = cameFrom.get(currKey);
            }
            return path;
        }
        
        visited.add(`${current.x},${current.y}`);
        
        // Neighbors (Up, Down, Left, Right)
        const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
        
        for (let dir of dirs) {
            let nx = current.x + dir.x;
            let ny = current.y + dir.y;
            let nKey = `${nx},${ny}`;
            
            // Check bounds and walls
            if (nx < 0 || ny < 0 || nx >= map[0].length || ny >= map.length) continue;
            if (map[ny][nx].type === 'WALL') continue;
            // Check for other entities blocking (simplified: enemies block path)
            // Ideally we'd check gameState.entities here, but that might be expensive for pathfinding every frame.
            // We'll ignore dynamic entity collision for pathfinding to avoid getting stuck in corridors too easily
            
            if (visited.has(nKey)) continue;
            
            let tentativeGScore = (gScore.get(`${current.x},${current.y}`) || 0) + 1;
            
            if (tentativeGScore < (gScore.get(nKey) || Infinity)) {
                cameFrom.set(nKey, `${current.x},${current.y}`);
                gScore.set(nKey, tentativeGScore);
                openSet.push({
                    x: nx,
                    y: ny,
                    cost: tentativeGScore,
                    dist: distManhattan(nx, ny, targetX, targetY)
                });
            }
        }
    }
    return []; // No path
}