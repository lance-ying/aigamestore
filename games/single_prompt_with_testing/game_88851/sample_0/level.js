import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS, TEAMS } from './globals.js';
import { Entity, Pickup } from './entities.js';
import { createStripedTexture } from './utils.js';

class Wall extends Entity {
    constructor(x, y, z, w, h, d, color) {
        super(x, y, z, w, h, d, color);
        this.isStatic = true;
    }
}

export function generateLevel() {
    // Clear old
    gameState.walls.forEach(w => gameState.scene.remove(w.mesh));
    gameState.walls = [];
    
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: COLORS.GROUND });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    gameState.ground = ground;
    
    // Control Point (Visual)
    const cpGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
    const cpMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const cp = new THREE.Mesh(cpGeo, cpMat);
    cp.position.set(0, 0.1, 0);
    cp.receiveShadow = true;
    gameState.scene.add(cp);
    
    gameState.controlPoint = {
        mesh: cp,
        radius: 4,
        owner: TEAMS.NONE
    };
    
    // Walls / Obstacles (Symmetric Arena)
    const wallConfig = [
        // Center cover
        { x: -8, y: 1.5, z: 0, w: 2, h: 3, d: 8, c: COLORS.CRATE },
        { x: 8, y: 1.5, z: 0, w: 2, h: 3, d: 8, c: COLORS.CRATE },
        
        // Spawn barriers (Visual)
        { x: 0, y: 2, z: -30, w: 20, h: 4, d: 1, c: COLORS.BLUE_DARK },
        { x: 0, y: 2, z: 30, w: 20, h: 4, d: 1, c: COLORS.RED_DARK },
        
        // Side lanes
        { x: -15, y: 2, z: -10, w: 4, h: 4, d: 10, c: COLORS.WALL },
        { x: 15, y: 2, z: 10, w: 4, h: 4, d: 10, c: COLORS.WALL },
    ];
    
    wallConfig.forEach(cfg => {
        const wall = new Wall(cfg.x, cfg.y, cfg.z, cfg.w, cfg.h, cfg.d, cfg.c);
        gameState.walls.push(wall);
    });
    
    // Health Packs
    const hp1 = new Pickup(-10, 1, 0);
    const hp2 = new Pickup(10, 1, 0);
    gameState.entities.push(hp1, hp2);
}