import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { getTerrainHeight, getBiomeColor, randomRange } from './utils.js';
import { Collectible, Prop } from './entities.js';

export function setupEnvironment() {
    // 1. Create Terrain
    const geometry = new THREE.PlaneGeometry(200, 200, 64, 64);
    geometry.rotateX(-Math.PI / 2);
    
    // Deform and Color Terrain
    const count = geometry.attributes.position.count;
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        const x = geometry.attributes.position.getX(i);
        const z = geometry.attributes.position.getZ(i);
        
        // Height
        const y = getTerrainHeight(x, z);
        geometry.attributes.position.setY(i, y);
        
        // Color
        const color = getBiomeColor(x, z);
        colors.push(color.r, color.g, color.b);
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({ 
        vertexColors: true, 
        roughness: 0.9,
        metalness: 0.0
    });
    
    const terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    gameState.scene.add(terrain);
    gameState.terrain = terrain;
    
    // 2. Props Generation
    // Place cactus in Desert (North +Z)
    for (let i = 0; i < 50; i++) {
        const angle = randomRange(0.5, 2.5);
        const dist = randomRange(30, 90);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        gameState.props.push(new Prop(x, z, 'cactus'));
    }
    
    // Place Palms in Jungle (South -Z)
    for (let i = 0; i < 50; i++) {
        const angle = randomRange(-0.5, -2.5);
        const dist = randomRange(30, 90);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        gameState.props.push(new Prop(x, z, 'palm'));
    }
    
    // Rocks everywhere else
    for (let i = 0; i < 40; i++) {
        const angle = randomRange(2.5, 3.8); // West
        const dist = randomRange(30, 90);
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        gameState.props.push(new Prop(x, z, 'rock'));
    }
    
    // 3. Collectibles Generation
    for (let i = 0; i < gameState.totalTokens; i++) {
        const angle = randomRange(0, Math.PI * 2);
        const dist = randomRange(25, 90); // Avoid spawning in center
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        gameState.collectibles.push(new Collectible(x, z));
    }
}