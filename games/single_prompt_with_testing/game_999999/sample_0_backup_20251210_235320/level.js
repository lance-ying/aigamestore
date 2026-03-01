import { Wall, Enemy, Player } from './entities.js';
import { gameState, CONFIG } from './globals.js';

// Simple Grid Based Level Generation
// W = Wall, . = Floor, P = Player, E = Enemy(Grunt), S = Shooter
const LEVEL_1 = [
    "WWWWWWWWWWWWWWWW",
    "W..............W",
    "W.P............W",
    "W.......W......W",
    "W.......W...E..W",
    "WWWW..WWWW.....W",
    "W..............W",
    "W.....S........W",
    "W..............W",
    "W.......E......W",
    "WWWWWWWWWWWWWWWW"
];

const LEVEL_2 = [
    "WWWWWWWWWWWWWWWWWWWW",
    "W..................W",
    "W.P.....WWWW.......W",
    "W.......W..E.......W",
    "W...E...W..........W",
    "W.......WWWW...S...W",
    "W..................W",
    "W...WWWW....WWWW...W",
    "W...W..........W...W",
    "W...W...S..E...W...W",
    "W...W..........W...W",
    "W..................W",
    "WWWWWWWWWWWWWWWWWWWW"
];

export function loadLevel(levelIndex) {
    clearLevel();
    
    let layout = LEVEL_1;
    if (levelIndex === 2) layout = LEVEL_2;
    // ... add more or procedural
    
    const scale = CONFIG.TILE_SIZE;
    const offsetX = (layout[0].length * scale) / 2;
    const offsetZ = (layout.length * scale) / 2;
    
    for (let row = 0; row < layout.length; row++) {
        for (let col = 0; col < layout[row].length; col++) {
            const char = layout[row][col];
            const x = col * scale - offsetX;
            const z = row * scale - offsetZ;
            
            if (char === 'W') {
                new Wall(x, z, scale, scale);
            } else if (char === 'P') {
                gameState.player = new Player(x, z);
                gameState.entities.push(gameState.player);
            } else if (char === 'E') {
                const e = new Enemy(x, z, 'GRUNT');
                gameState.enemies.push(e);
                gameState.entities.push(e);
            } else if (char === 'S') {
                const e = new Enemy(x, z, 'SHOOTER');
                gameState.enemies.push(e);
                gameState.entities.push(e);
            }
        }
    }
    
    // Create Floor
    createFloor(layout[0].length * scale, layout.length * scale);
}

function clearLevel() {
    // Remove all entities
    gameState.entities.forEach(e => gameState.scene.remove(e.mesh));
    gameState.walls.forEach(w => gameState.scene.remove(w.mesh));
    
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.walls = [];
    
    if (gameState.floorMesh) gameState.scene.remove(gameState.floorMesh);
}

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function createFloor(width, height) {
    const geometry = new THREE.PlaneGeometry(width + 20, height + 20); // Make it larger than level
    const material = new THREE.MeshStandardMaterial({ 
        color: CONFIG.COLORS.FLOOR,
        roughness: 0.9 
    });
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    gameState.scene.add(floor);
    gameState.floorMesh = floor;
}