/**
 * Grid and Dungeon Generation
 */

import { 
    gameState, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS 
} from './globals.js';
import { Wall, Floor, Exit } from './entities.js';

export class Dungeon {
    constructor() {
        this.width = GRID_WIDTH;
        this.height = GRID_HEIGHT;
        this.tiles = []; // 2D array
    }

    /**
     * Initialize empty grid
     */
    initGrid() {
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(null);
            }
            this.tiles.push(row);
        }
    }

    /**
     * Generate a procedural level
     * @param {object} p - p5 instance for random
     */
    generateLevel(p) {
        this.initGrid();
        
        // 1. Fill with walls
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = new Wall(x, y);
            }
        }

        // 2. Create rooms (BSP or Random Walk)
        // Simple approach: Random Rectangles connected by corridors
        const rooms = [];
        const numRooms = p.floor(p.random(3, 6));

        for (let i = 0; i < numRooms; i++) {
            const w = p.floor(p.random(3, 6));
            const h = p.floor(p.random(3, 6));
            const x = p.floor(p.random(1, this.width - w - 1));
            const y = p.floor(p.random(1, this.height - h - 1));
            
            const newRoom = { x, y, w, h };
            
            // Check overlap
            let overlap = false;
            for (let r of rooms) {
                if (x < r.x + r.w + 1 && x + w + 1 > r.x && 
                    y < r.y + r.h + 1 && y + h + 1 > r.y) {
                    overlap = true;
                    break;
                }
            }
            
            if (!overlap) {
                this.carveRoom(newRoom);
                rooms.push(newRoom);
            }
        }

        // 3. Connect rooms
        for (let i = 0; i < rooms.length - 1; i++) {
            const r1 = rooms[i];
            const r2 = rooms[i + 1];
            
            // Center points
            const c1 = { x: p.floor(r1.x + r1.w / 2), y: p.floor(r1.y + r1.h / 2) };
            const c2 = { x: p.floor(r2.x + r2.w / 2), y: p.floor(r2.y + r2.h / 2) };
            
            this.carveCorridor(c1.x, c1.y, c2.x, c2.y);
        }

        // 4. Place Exit in last room
        const lastRoom = rooms[rooms.length - 1];
        const exitX = p.floor(lastRoom.x + lastRoom.w / 2);
        const exitY = p.floor(lastRoom.y + lastRoom.h / 2);
        this.tiles[exitY][exitX] = new Exit(exitX, exitY);
        gameState.exit = this.tiles[exitY][exitX];

        // 5. Place Player in first room
        const firstRoom = rooms[0];
        const startX = p.floor(firstRoom.x + firstRoom.w / 2);
        const startY = p.floor(firstRoom.y + firstRoom.h / 2);
        
        // Ensure start pos is floor
        if (this.tiles[startY][startX].type !== 'FLOOR') {
            this.tiles[startY][startX] = new Floor(startX, startY);
        }
        
        return { startX, startY, rooms };
    }

    carveRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                this.tiles[y][x] = new Floor(x, y);
            }
        }
    }

    carveCorridor(x1, y1, x2, y2) {
        // Horizontal then Vertical
        let x = x1;
        let y = y1;
        
        while (x !== x2) {
            this.tiles[y][x] = new Floor(x, y);
            x += (x < x2) ? 1 : -1;
        }
        while (y !== y2) {
            this.tiles[y][x] = new Floor(x, y);
            y += (y < y2) ? 1 : -1;
        }
        this.tiles[y2][x2] = new Floor(x2, y2);
    }

    /**
     * Get tile at grid coordinates
     */
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
        return this.tiles[y][x];
    }
    
    /**
     * Check if tile is walkable (not a wall)
     */
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile && tile.walkable;
    }

    render(p) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x]) {
                    this.tiles[y][x].render(p);
                }
            }
        }
    }
}