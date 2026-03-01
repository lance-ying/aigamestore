import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, TOWN_SIZE } from './globals.js';
import { Building, InteractableZone, Watcher } from './entities.js';
import { createRoadTexture, randomRange } from './utils.js';

export function setupWorld() {
    createGround();
    createRoads();
    createProps();
    setupLightingAndFog();
    
    // Create initial zones
    createZones();
}

function createGround() {
    // Basic ground plane
    const geometry = new THREE.PlaneGeometry(TOWN_SIZE * 2, TOWN_SIZE * 2, 64, 64);
    
    // Add some height variation for "mountains" on the edges
    const posAttribute = geometry.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i); // This is Z in 3D space before rotation
        const z = posAttribute.getZ(i); // This is Y (height)
        
        const dist = Math.sqrt(x*x + y*y);
        let height = 0;
        
        // Mountain ring
        if (dist > 70) {
            height = (dist - 70) * 0.5 + Math.random() * 2;
        }
        
        // Small noise everywhere
        height += Math.random() * 0.2;
        
        posAttribute.setZ(i, height); // Set height (Z of plane is Y of world)
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ 
        color: 0x2e4033, // Dark green grass
        roughness: 1.0,
        flatShading: true
    });
    
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    gameState.scene.add(plane);
}

function createRoads() {
    // Simple Loop Road geometry
    // We'll create a ring of meshes
    const roadWidth = 8;
    const radius = 60;
    
    const roadTex = createRoadTexture();
    
    const geometry = new THREE.RingGeometry(radius, radius + roadWidth, 64);
    const material = new THREE.MeshStandardMaterial({ 
        map: roadTex,
        roughness: 0.9
    });
    
    // Remap UVs for ring to make texture flow along road
    const uvAttribute = geometry.attributes.uv;
    const posAttribute = geometry.attributes.position;
    
    // This is a simplified UV mapping for ring, might be distorted but fits "retro" vibe
    for (let i = 0; i < uvAttribute.count; i++) {
        const x = posAttribute.getX(i);
        const y = posAttribute.getY(i);
        // Calculate angle
        const angle = Math.atan2(y, x);
        const u = (angle + Math.PI) / (2 * Math.PI) * 20; // Repeat 20 times around ring
        // Determine if inner or outer
        const dist = Math.sqrt(x*x + y*y);
        const v = (dist - radius) / roadWidth;
        
        uvAttribute.setXY(i, u, v);
    }
    
    const road = new THREE.Mesh(geometry, material);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.05; // Slightly above grass
    road.receiveShadow = true;
    gameState.scene.add(road);
    
    // Cross road
    const crossGeo = new THREE.PlaneGeometry(roadWidth, radius * 2);
    const crossMat = new THREE.MeshStandardMaterial({ map: roadTex });
    const crossRoad = new THREE.Mesh(crossGeo, crossMat);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.rotation.z = Math.PI / 4; // Diagonal
    crossRoad.position.y = 0.06;
    gameState.scene.add(crossRoad);
}

function createProps() {
    // Buildings
    // Central Depot
    const depot = new Building(0, 0, 10, 10, 5, "depot");
    gameState.buildings.push(depot);
    
    // Scattered houses around the ring road
    const radius = 75; // Outside the road
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Skip area near cross road exits to avoid blocking
        
        const w = randomRange(5, 8);
        const d = randomRange(5, 8);
        const h = randomRange(3, 6);
        const type = Math.random() > 0.8 ? "store" : "house";
        
        const b = new Building(x, z, w, d, h, type);
        gameState.buildings.push(b);
    }
    
    // Trees
    const treeGeo = new THREE.ConeGeometry(2, 6, 8);
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x1b3b25, flatShading: true });
    
    for (let i = 0; i < 150; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = randomRange(20, 95);
        
        // Don't place on road (approximate)
        if (dist > 55 && dist < 70) continue; // Ring road
        if (Math.abs(dist * Math.cos(angle - Math.PI/4)) < 4) continue; // Cross road (rough check)
        
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        
        const tree = new THREE.Mesh(treeGeo, treeMat);
        tree.position.set(x, 3, z);
        tree.castShadow = true;
        gameState.scene.add(tree);
        gameState.trees.push(tree);
    }
}

function setupLightingAndFog() {
    // Ambient
    const ambient = new THREE.AmbientLight(0x404040, 0.5); // Soft white
    gameState.scene.add(ambient);
    gameState.ambientLight = ambient;
    
    // Sun
    const sun = new THREE.DirectionalLight(0xffdfba, 1.0);
    sun.position.set(50, 100, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    gameState.scene.add(sun);
    gameState.directionalLight = sun;
    
    // Fog
    const fogColor = 0xcccccc;
    gameState.scene.fog = new THREE.FogExp2(fogColor, 0.02);
    gameState.scene.background = new THREE.Color(fogColor);
}

function createZones() {
    // Pickup at Depot
    const depotPickup = new InteractableZone(0, 8, 'PICKUP', 'Depot');
    gameState.interactables.push(depotPickup);
    
    // Generate Delivery Points at buildings
    gameState.buildings.forEach((b, idx) => {
        if (b.name === "Central Depot") return;
        
        // Place zone in front of building
        const zone = new InteractableZone(b.mesh.position.x, b.mesh.position.z + 6, 'DELIVER', `House #${idx}`);
        gameState.interactables.push(zone);
    });
    
    // Create watchers (hidden initially)
    for(let i=0; i<5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 90;
        const w = new Watcher(Math.cos(angle)*dist, Math.sin(angle)*dist);
        gameState.mysteryEntities.push(w);
    }
}