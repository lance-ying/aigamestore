// logic.js
import { 
    gameState, PLANT_TYPES, PLANT_KEYS,
    GRID_COLS, GRID_ROWS, 
    CELL_WIDTH, CELL_HEIGHT, 
    GRID_OFFSET_X, GRID_OFFSET_Y,
    CANVAS_WIDTH 
} from './globals.js';
import { Plant, Zombie, spawnSun } from './entities.js';

export function initGame() {
    gameState.gamePhase = "PLAYING";
    gameState.sun = 150;
    gameState.score = 0;
    gameState.grid = Array(GRID_COLS).fill(null).map(() => Array(GRID_ROWS).fill(null));
    gameState.entities = [];
    gameState.plants = [];
    gameState.zombies = [];
    gameState.projectiles = [];
    gameState.suns = [];
    gameState.particles = [];
    
    // Reset Cooldowns
    PLANT_KEYS.forEach(key => {
        gameState.plantCooldowns[key] = 0;
    });

    gameState.currentWave = 1;
    gameState.waveTimer = 0;
}

export function updateGame(p) {
    if (gameState.gamePhase !== "PLAYING") return;

    // --- Cooldowns ---
    PLANT_KEYS.forEach(key => {
        if (gameState.plantCooldowns[key] > 0) {
            gameState.plantCooldowns[key]--;
        }
    });

    // --- Wave Management ---
    gameState.waveTimer++;
    
    // Simple wave logic
    // Wave 1: slow spawn. Wave 5: fast spawn.
    const spawnInterval = Math.max(100, 600 - (gameState.currentWave * 80)); 
    
    if (gameState.waveTimer > spawnInterval) {
        gameState.waveTimer = 0;
        spawnZombie();
        
        // Progress wave
        if (gameState.score > gameState.currentWave * 200) {
            gameState.currentWave++;
            if (gameState.currentWave > gameState.totalWaves) {
                 // Check if all zombies are dead
                 if (gameState.zombies.length === 0) {
                     gameState.gamePhase = "GAME_OVER_WIN";
                 }
            }
        }
    }
    
    // Win condition check (Alternate: survive time)
    if (gameState.currentWave > gameState.totalWaves && gameState.zombies.length === 0) {
        gameState.gamePhase = "GAME_OVER_WIN";
    }

    // --- Ambient Sun Spawning ---
    // Spawn sun from sky every ~8 seconds
    if (gameState.frameCount % 480 === 0) {
        const x = Math.random() * (CANVAS_WIDTH - 40) + 20;
        spawnSun(x, -20, true);
    }

    // --- Update Entities ---
    // Filter dead entities BEFORE updating to prevent processing invalid entities
    const filterDead = (list) => list.filter(e => e && !e.markedForDeletion);
    
    // Pre-clean arrays
    gameState.plants = filterDead(gameState.plants);
    gameState.zombies = filterDead(gameState.zombies);
    gameState.projectiles = filterDead(gameState.projectiles);
    gameState.suns = filterDead(gameState.suns);
    gameState.particles = filterDead(gameState.particles);
    
    // Update with error handling for each entity
    gameState.plants.forEach(e => {
        try {
            if (e && typeof e.update === 'function') {
                e.update(p);
            }
        } catch (error) {
            console.error("Plant update error:", error);
            if (e) e.markedForDeletion = true;
        }
    });
    
    gameState.zombies.forEach(e => {
        try {
            if (e && typeof e.update === 'function') {
                e.update(p);
            }
        } catch (error) {
            console.error("Zombie update error:", error);
            if (e) e.markedForDeletion = true;
        }
    });
    
    gameState.projectiles.forEach(e => {
        try {
            if (e && typeof e.update === 'function') {
                e.update(p);
            }
        } catch (error) {
            console.error("Projectile update error:", error);
            if (e) e.markedForDeletion = true;
        }
    });
    
    gameState.suns.forEach(e => {
        try {
            if (e && typeof e.update === 'function') {
                e.update(p);
            }
        } catch (error) {
            console.error("Sun update error:", error);
            if (e) e.markedForDeletion = true;
        }
    });
    
    gameState.particles.forEach(e => {
        try {
            if (e && typeof e.update === 'function') {
                e.update(p);
            }
        } catch (error) {
            console.error("Particle update error:", error);
            if (e) e.markedForDeletion = true;
        }
    });
    
    // Final cleanup after update
    gameState.plants = filterDead(gameState.plants);
    gameState.zombies = filterDead(gameState.zombies);
    gameState.projectiles = filterDead(gameState.projectiles);
    gameState.suns = filterDead(gameState.suns);
    gameState.particles = filterDead(gameState.particles);
    
    // Clean up master entities array to prevent unbounded growth
    gameState.entities = filterDead(gameState.entities);
    
    // Periodic deep cleanup every 5 seconds to prevent any accumulation
    if (gameState.frameCount % 300 === 0) {
        // Remove any nulls or undefined entries that might have slipped through
        gameState.plants = gameState.plants.filter(e => e && typeof e === 'object');
        gameState.zombies = gameState.zombies.filter(e => e && typeof e === 'object');
        gameState.projectiles = gameState.projectiles.filter(e => e && typeof e === 'object');
        gameState.suns = gameState.suns.filter(e => e && typeof e === 'object');
        gameState.particles = gameState.particles.filter(e => e && typeof e === 'object');
        gameState.entities = gameState.entities.filter(e => e && typeof e === 'object');
    }
}

export function spawnZombie() {
    const row = Math.floor(Math.random() * GRID_ROWS);
    const z = new Zombie(row);
    gameState.zombies.push(z);
    gameState.entities.push(z);
}

export function handlePlanting() {
    const { col, row } = gameState.cursor;
    
    // Validate cursor position
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;
    
    // Check if slot empty
    if (gameState.grid[col][row]) return; // Occupied

    const plantKey = PLANT_KEYS[gameState.selectedPlantIndex];
    const plantType = PLANT_TYPES[plantKey];

    // Check cost
    if (gameState.sun < plantType.cost) return; // Not enough sun

    // Check cooldown
    if (gameState.plantCooldowns[plantKey] > 0) return; // On cooldown

    // Plant it!
    gameState.sun -= plantType.cost;
    gameState.plantCooldowns[plantKey] = plantType.cooldown;
    
    const plant = new Plant(col, row, plantType);
    gameState.grid[col][row] = plant;
    gameState.plants.push(plant);
    gameState.entities.push(plant);
    
    // Particle effect
    for(let i=0; i<10; i++) {
        gameState.particles.push({
            x: plant.x, y: plant.y,
            vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
            life: 20, color: [100, 255, 100],
            markedForDeletion: false,
            update: function() { this.x+=this.vx; this.y+=this.vy; this.life--; if(this.life<=0) this.markedForDeletion=true; },
            render: function(p) { p.fill(this.color); p.circle(this.x,this.y,3); }
        });
    }
}

export function handleShovel() {
    const { col, row } = gameState.cursor;
    
    // Validate cursor position
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return;
    
    const plant = gameState.grid[col][row];
    if (plant && typeof plant.die === 'function') {
        plant.die(); // Remove plant
        gameState.grid[col][row] = null;
        // Partial refund
        gameState.sun += 25;
    }
}