import { GRID_SIZE, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Obstacle, Log, Train } from './entities.js';

class Lane {
    constructor(gridY, type) {
        this.gridY = gridY;
        this.y = gridY * GRID_SIZE;
        this.type = type; // 'GRASS', 'ROAD', 'WATER', 'RAIL'
        this.obstacles = [];
        this.staticMap = {}; // For trees: { gridX: true }
        
        // Traffic settings
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.speed = 0;
        this.spawnTimer = 0;
        this.spawnRate = 0;
        
        this.setup();
    }
    
    setup() {
        if (this.type === 'GRASS') {
            // Generate Trees
            const density = 0.2;
            const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
            for (let i = 0; i < cols; i++) {
                if (Math.random() < density) {
                    this.staticMap[i] = true;
                }
            }
        } else if (this.type === 'ROAD') {
            this.speed = (2 + Math.random() * 3) * this.direction;
            this.spawnRate = 120 + Math.random() * 100; // frames
            // Initial spawn
            this.spawnObstacle(Math.random() * CANVAS_WIDTH);
        } else if (this.type === 'WATER') {
            this.speed = (1.5 + Math.random() * 2) * this.direction;
            this.spawnRate = 100 + Math.random() * 80;
            // Initial spawn multiple logs
            this.spawnObstacle(Math.random() * CANVAS_WIDTH);
            this.spawnObstacle((Math.random() * CANVAS_WIDTH + 300) % CANVAS_WIDTH);
        } else if (this.type === 'RAIL') {
            this.speed = 20 * this.direction; // Fast!
            this.isWarning = false;
            this.trainActive = false;
            this.spawnRate = 300 + Math.random() * 200;
            this.spawnTimer = this.spawnRate;
        }
    }
    
    spawnObstacle(xOffset = null) {
        let x = xOffset !== null ? xOffset : (this.direction === 1 ? -100 : CANVAS_WIDTH + 100);
        
        if (this.type === 'ROAD') {
            const color = COLORS.CAR_COLORS[Math.floor(Math.random() * COLORS.CAR_COLORS.length)];
            const width = GRID_SIZE * (1.5 + Math.random() * 0.5); // Car length
            this.obstacles.push(new Obstacle(x, this.y + 5, width, GRID_SIZE - 10, this.speed, color));
        } else if (this.type === 'WATER') {
            const width = GRID_SIZE * (2 + Math.random() * 2); // Log length
            this.obstacles.push(new Log(x, this.y + 5, width, GRID_SIZE - 10, this.speed, COLORS.LOG));
        } else if (this.type === 'RAIL') {
            // Train is very long
            const width = CANVAS_WIDTH * 1.5;
            this.obstacles.push(new Train(x, this.y + 2, width, GRID_SIZE - 4, this.speed, COLORS.TRAIN));
        }
    }
    
    update(p) {
        // Spawning Logic
        if (this.type === 'RAIL') {
            this.spawnTimer--;
            
            // Warning phase
            if (this.spawnTimer < 60 && this.spawnTimer > 0) {
                this.isWarning = true;
            } else if (this.spawnTimer <= 0 && !this.trainActive) {
                this.isWarning = false;
                this.trainActive = true;
                this.spawnObstacle();
            }
        } else if (this.type === 'ROAD' || this.type === 'WATER') {
            this.spawnTimer++;
            if (this.spawnTimer > this.spawnRate) {
                // Check if space is clear to spawn (avoid overlap)
                // Simple check: last obstacle far enough?
                let safe = true;
                if (this.obstacles.length > 0) {
                    const last = this.obstacles[this.obstacles.length - 1];
                    const dist = this.direction === 1 ? (0 - (last.x + last.width)) : (last.x - CANVAS_WIDTH);
                    if (Math.abs(dist) < GRID_SIZE * 3) safe = false;
                }
                
                if (safe) {
                    this.spawnObstacle();
                    this.spawnTimer = 0;
                    // Randomize next rate slightly
                    this.spawnRate = (this.type === 'ROAD' ? 120 : 100) + Math.random() * 100;
                }
            }
        }
        
        // Update Obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.update();
            
            // Cleanup off-screen
            if ((this.direction === 1 && obs.x > CANVAS_WIDTH + 200) ||
                (this.direction === -1 && obs.x < -200 - obs.width)) {
                this.obstacles.splice(i, 1);
                if (this.type === 'RAIL') {
                    this.trainActive = false;
                    this.spawnTimer = 300 + Math.random() * 200;
                }
            }
        }
    }
    
    render(p) {
        const y = this.y;
        
        // Background
        p.noStroke();
        if (this.type === 'GRASS') p.fill(COLORS.GRASS_LIGHT);
        else if (this.type === 'ROAD') p.fill(COLORS.ROAD);
        else if (this.type === 'WATER') p.fill(COLORS.WATER);
        else if (this.type === 'RAIL') p.fill(COLORS.RAIL);
        
        p.rect(0, y, CANVAS_WIDTH, GRID_SIZE);
        
        // Decals
        if (this.type === 'GRASS') {
            // Draw Trees
            p.fill(COLORS.TREE);
            for(let x in this.staticMap) {
                // Simple pine tree
                const tx = x * GRID_SIZE + GRID_SIZE/2;
                const ty = y + GRID_SIZE - 5;
                p.triangle(tx - 15, ty, tx + 15, ty, tx, ty - 35);
                p.fill(COLORS.GRASS_DARK); // Shadow/trunk
                p.rect(tx - 3, ty, 6, 5);
                p.fill(COLORS.TREE); // Reset fill
            }
        } else if (this.type === 'ROAD') {
            p.stroke(COLORS.ROAD_MARKING);
            p.strokeWeight(2);
            p.line(0, y + GRID_SIZE - 5, CANVAS_WIDTH, y + GRID_SIZE - 5); // Curb
            p.drawingContext.setLineDash([10, 10]);
            p.line(0, y + GRID_SIZE/2, CANVAS_WIDTH, y + GRID_SIZE/2);
            p.drawingContext.setLineDash([]);
        } else if (this.type === 'RAIL') {
            // Ties
            p.fill(COLORS.RAIL_TIE);
            p.noStroke();
            for(let i=0; i<CANVAS_WIDTH; i+=20) {
                p.rect(i, y + 5, 6, GRID_SIZE - 10);
            }
            // Rails
            p.stroke(COLORS.RAIL_METAL);
            p.strokeWeight(3);
            p.line(0, y + 10, CANVAS_WIDTH, y + 10);
            p.line(0, y + GRID_SIZE - 10, CANVAS_WIDTH, y + GRID_SIZE - 10);
            
            // Warning Light
            if (this.isWarning) {
                if (Math.floor(p.frameCount / 10) % 2 === 0) {
                    p.fill(255, 0, 0, 150);
                    p.noStroke();
                    p.rect(0, y, CANVAS_WIDTH, GRID_SIZE);
                }
            }
        }
        
        // Obstacles
        this.obstacles.forEach(obs => obs.render(p));
    }
}

export class LaneManager {
    constructor() {
        this.lanes = [];
        this.startGridY = 5; // Start generation here
        this.minGridY = 10;  // How far back to keep lanes
        
        // Generate initial safe zone
        this.initSafeZone();
    }
    
    initSafeZone() {
        // Clear lanes
        this.lanes = [];
        // Create 10 grass lanes around 0
        for (let i = 5; i >= -5; i--) {
            this.addLane(i, 'GRASS');
        }
        // Ensure starting position (0,0) is free of trees
        const startLane = this.getLaneAt(0);
        if (startLane && startLane.staticMap[7]) { // Player starts at x=7
            delete startLane.staticMap[7];
        }
    }
    
    addLane(gridY, forcedType = null) {
        // Procedural Generation Logic
        let type = 'GRASS';
        
        if (forcedType) {
            type = forcedType;
        } else {
            const r = Math.random();
            // Groups of lanes logic could go here
            // Simple probability
            if (r < 0.4) type = 'GRASS';
            else if (r < 0.7) type = 'ROAD';
            else if (r < 0.9) type = 'WATER';
            else type = 'RAIL';
        }
        
        const lane = new Lane(gridY, type);
        this.lanes.push(lane);
        
        // Keep sorted by Y for rendering? 
        // Rendering should be back-to-front (highest Y to lowest Y, since low Y is far away/up)
        // Actually, painter's algorithm: draw top (lowest Y) first.
        this.lanes.sort((a, b) => a.gridY - b.gridY);
    }
    
    update(p) {
        // Safety check: ensure lanes array is not empty
        if (this.lanes.length === 0) {
            this.initSafeZone();
        }
        
        // Generate new lanes ahead of player
        const playerGridY = gameState.player ? gameState.player.gridY : 0;
        const lowestGeneratedY = this.lanes[0].gridY;
        
        if (playerGridY < lowestGeneratedY + 15) {
            // Need more lanes
            for(let i=1; i<=5; i++) {
                this.addLane(lowestGeneratedY - i);
            }
        }
        
        // Remove old lanes behind player (optimization)
        const cutoff = playerGridY + 10;
        for (let i = this.lanes.length - 1; i >= 0; i--) {
            if (this.lanes[i].gridY > cutoff) {
                this.lanes.splice(i, 1);
            }
        }
        
        // Update all lanes
        this.lanes.forEach(lane => lane.update(p));
    }
    
    render(p) {
        // Render in order
        this.lanes.forEach(lane => {
            // Culling
            const screenY = lane.y - gameState.cameraY;
            if (screenY > -GRID_SIZE && screenY < CANVAS_HEIGHT) {
                lane.render(p);
            }
        });
    }
    
    getLaneAt(gridY) {
        return this.lanes.find(l => l.gridY === gridY);
    }
}