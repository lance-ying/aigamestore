/**
 * Level Management System
 * 
 * Handles Room storage, Tile definitions, and World generation.
 * Implements a grid of rooms (Screen Transitions).
 */

import { ROWS, COLS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';
import { Ghost, Collectible } from './entities.js';

// Tile Types Mapping
const TILE_MAP = {
    0: null, // Empty
    1: { type: 'WALL', isSolid: true, color: COLORS.WALL },
    2: { type: 'WATER', isSolid: false, color: COLORS.WATER },
    3: { type: 'SPIKE', isSolid: false, color: COLORS.SPIKE }, // Spikes are solid? Usually no, you die overlapping
    4: { type: 'LADDER', isSolid: false, color: COLORS.LADDER },
    5: { type: 'ONE_WAY', isSolid: true, color: COLORS.WALL_HIGHLIGHT },
    6: { type: 'SWITCH_OFF', isSolid: true, color: COLORS.SWITCH_OFF },
    7: { type: 'SWITCH_ON', isSolid: true, color: COLORS.SWITCH_ON },
    8: { type: 'DOOR_CLOSED', isSolid: true, color: COLORS.DOOR_CLOSED },
    9: { type: 'DOOR_OPEN', isSolid: false, color: COLORS.DOOR_OPEN }
};

export class Room {
    constructor(layoutString, entitiesData = []) {
        this.grid = [];
        this.entitiesData = entitiesData; // Definitions for initial spawn
        
        // Parse layout string
        // Assuming string is ROWS * COLS characters
        // But for easier editing, we'll use a compact RLE or just a generated array
        // For this implementation, we'll initialize empty and let World builder fill it
        for (let r = 0; r < ROWS; r++) {
            this.grid[r] = new Array(COLS).fill(0);
        }
    }

    setTile(x, y, typeName) {
        // Reverse lookup or direct ID
        let id = 0;
        for (const [key, val] of Object.entries(TILE_MAP)) {
            if (val && val.type === typeName) id = parseInt(key);
        }
        if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
            this.grid[y][x] = id;
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return null;
        const id = this.grid[y][x];
        return TILE_MAP[id];
    }
    
    render(p) {
        p.noStroke();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = TILE_MAP[this.grid[r][c]];
                if (tile) {
                    p.fill(tile.color);
                    
                    if (tile.type === 'SPIKE') {
                        // Draw spike triangle
                        p.triangle(
                            c*TILE_SIZE, r*TILE_SIZE + TILE_SIZE,
                            c*TILE_SIZE + TILE_SIZE/2, r*TILE_SIZE,
                            c*TILE_SIZE + TILE_SIZE, r*TILE_SIZE + TILE_SIZE
                        );
                    } else if (tile.type === 'WATER') {
                        p.fill(tile.color);
                        p.rect(c*TILE_SIZE, r*TILE_SIZE + 4, TILE_SIZE, TILE_SIZE - 4); // Water slightly lower
                    } else if (tile.type === 'ONE_WAY') {
                        p.rect(c*TILE_SIZE, r*TILE_SIZE, TILE_SIZE, 6);
                    } else {
                        p.rect(c*TILE_SIZE, r*TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        }
    }
}

export class World {
    constructor() {
        this.rooms = {}; // Key "x,y" e.g., "0,0"
        this.initWorld();
    }

    initWorld() {
        // Procedurally generate or hardcode a small 3x2 map
        
        // Room 0,0: Start
        let r00 = this.createRoom(0, 0);
        this.addFloor(r00);
        this.addWalls(r00);
        this.addPlatform(r00, 10, 15, 5);
        this.addPlatform(r00, 20, 12, 5);
        // Add exit right
        this.clearRegion(r00, COLS-1, 14, 1, 3);
        
        // Room 1,0: Water & Bubble Wand
        let r10 = this.createRoom(1, 0);
        this.addFloor(r10);
        this.addWalls(r10);
        this.clearRegion(r10, 0, 14, 1, 3); // Entrance Left
        this.clearRegion(r10, COLS-1, 14, 1, 3); // Exit Right
        // Water pit
        this.fillRegion(r10, 10, 15, 10, 4, 'WATER');
        this.fillRegion(r10, 10, 19, 10, 1, 'WALL'); // Floor under water
        // Item
        r10.entitiesData.push({ type: 'COLLECTIBLE', subtype: 'BUBBLE_WAND', x: 15*TILE_SIZE, y: 12*TILE_SIZE });
        
        // Room 2,0: Vertical shaft
        let r20 = this.createRoom(2, 0);
        this.addWalls(r20);
        this.addFloor(r20);
        this.clearRegion(r20, 0, 14, 1, 3); // Entrance Left
        this.fillRegion(r20, 14, 0, 2, ROWS, 'LADDER'); // Ladder up
        this.clearRegion(r20, 14, 0, 2, 1); // Exit Up
        
        // Room 2,-1: Upper Challenge (Ghosts)
        let r21 = this.createRoom(2, -1);
        this.addWalls(r21);
        this.clearRegion(r21, 14, ROWS-1, 2, 1); // Entrance Down
        this.addPlatform(r21, 5, 15, 5);
        this.addPlatform(r21, 20, 10, 5);
        // Ghosts
        r21.entitiesData.push({ type: 'GHOST', x: 5*TILE_SIZE, y: 5*TILE_SIZE });
        r21.entitiesData.push({ type: 'GHOST', x: 25*TILE_SIZE, y: 5*TILE_SIZE });
        // Exit Left to secret
        this.clearRegion(r21, 0, 5, 1, 3);
        
        // Room 1,-1: Disc Room locked by Door
        let r11 = this.createRoom(1, -1);
        this.addWalls(r11);
        this.addFloor(r11);
        this.clearRegion(r11, COLS-1, 5, 1, 3); // Entrance Right
        // Door
        this.fillRegion(r11, 20, 5, 1, 3, 'DOOR_CLOSED');
        // Switch
        this.fillRegion(r11, 25, 14, 1, 1, 'SWITCH_OFF');
        // Item behind door
        r11.entitiesData.push({ type: 'COLLECTIBLE', subtype: 'DISC', x: 5*TILE_SIZE, y: 14*TILE_SIZE });

        this.rooms["0,0"] = r00;
        this.rooms["1,0"] = r10;
        this.rooms["2,0"] = r20;
        this.rooms["2,-1"] = r21;
        this.rooms["1,-1"] = r11;
    }
    
    createRoom(x, y) {
        return new Room();
    }
    
    // Helpers for generation
    fillRegion(room, x, y, w, h, type) {
        for(let i=0; i<w; i++) for(let j=0; j<h; j++) room.setTile(x+i, y+j, type);
    }
    clearRegion(room, x, y, w, h) {
        for(let i=0; i<w; i++) for(let j=0; j<h; j++) room.grid[y+j][x+i] = 0;
    }
    addWalls(room) {
        this.fillRegion(room, 0, 0, COLS, 1, 'WALL'); // Top
        this.fillRegion(room, 0, 0, 1, ROWS, 'WALL'); // Left
        this.fillRegion(room, COLS-1, 0, 1, ROWS, 'WALL'); // Right
        this.fillRegion(room, 0, ROWS-1, COLS, 1, 'WALL'); // Bottom
    }
    addFloor(room) {
        this.fillRegion(room, 0, ROWS-2, COLS, 1, 'WALL');
    }
    addPlatform(room, x, y, w) {
        this.fillRegion(room, x, y, w, 1, 'ONE_WAY');
    }

    getCurrentRoom() {
        return this.rooms[`${gameState.currentRoomX},${gameState.currentRoomY}`] || new Room();
    }
    
    changeRoom(dx, dy) {
        gameState.currentRoomX += dx;
        gameState.currentRoomY += dy;
        
        // Spawn entities for the new room if not persistent or tracked elsewhere
        // For this simple engine, we re-spawn entities from data every entry 
        // OR we track them. To keep it simple, we'll clear and spawn from data, 
        // removing collected items.
        
        this.loadRoomEntities();
    }
    
    loadRoomEntities() {
        const room = this.getCurrentRoom();
        
        // Keep Player
        const player = gameState.player;
        
        // Clear others
        gameState.entities = [];
        gameState.particles.clear();
        
        // Parse Room Data
        room.entitiesData.forEach(data => {
            if (data.type === 'COLLECTIBLE') {
                if (!gameState.collectedItems.includes(data.subtype)) {
                    gameState.entities.push(new Collectible(data.x, data.y, data.subtype));
                }
            } else if (data.type === 'GHOST') {
                gameState.entities.push(new Ghost(data.x, data.y));
            }
        });
        
        // Update Checkpoint on room entry (optional, makes game easier)
        // player.checkpoint = { x: player.x, y: player.y, roomX: gameState.currentRoomX, roomY: gameState.currentRoomY };
    }
    
    triggerSwitch(tx, ty, room) {
        // Logic to find connected doors
        // For prototype, any switch opens any door in the room
        for(let r=0; r<ROWS; r++) {
            for(let c=0; c<COLS; c++) {
                const tile = room.getTile(c, r);
                if (tile && tile.type === 'DOOR_CLOSED') {
                    room.setTile(c, r, 'DOOR_OPEN');
                    // Create particles
                    gameState.particles.emit(c*TILE_SIZE + 10, r*TILE_SIZE + 10, 'DUST', 5);
                }
            }
        }
    }
}