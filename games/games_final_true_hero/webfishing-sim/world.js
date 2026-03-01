import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';
import { getTerrainHeight } from './physics.js';

export class WorldManager {
    init() {
        this.createWater();
        this.createTerrain();
        this.createProps();
    }
    
    createWater() {
        const geometry = new THREE.PlaneGeometry(200, 200);
        const material = new THREE.MeshPhongMaterial({
            color: COLORS.WATER,
            transparent: true,
            opacity: 0.7,
            shininess: 80
        });
        const water = new THREE.Mesh(geometry, material);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 0; // Water Level
        gameState.scene.add(water);
    }
    
    createTerrain() {
        // Create island mesh based on physics heightmap
        const geometry = new THREE.PlaneGeometry(100, 100, 50, 50);
        const posAttribute = geometry.attributes.position;
        
        for (let i = 0; i < posAttribute.count; i++) {
            const x = posAttribute.getX(i);
            const z = posAttribute.getY(i); // Plane is initially XY
            
            // We rotate X by -90 later, so Y becomes Z locally
            // But let's manipulate Z as height for now or just set vertices manually in world space?
            // Easier: Standard Plane is XY. Vertices are x,y,z.
            // We will rotate mesh -PI/2 X. So Mesh Y -> World Z. Mesh Z -> World Y (height).
            
            // wait, geometry is X, Y.
            // We want height.
            // Let's manually set positions.
            
            const h = getTerrainHeight(x, -z); // Map plane Y to world Z
            
            // Adjust Z (which becomes Y after rotation)
            posAttribute.setZ(i, h);
            
            // Color vertices based on height (Low = Sand, High = Grass)
            // Can use vertex colors or just texture. Let's stick to simple green material for now.
        }
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshLambertMaterial({ 
            color: COLORS.GRASS, 
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        gameState.scene.add(mesh);
        
        // Add a sand rim? Hard with single mesh. Let's add separate sand blobs or just imagine it.
    }
    
    createProps() {
        // Add Trees
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 10 + Math.random() * 25;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const y = getTerrainHeight(x, z);
            
            if (y > 0.5) { // Only on dry land
                this.createTree(x, y, z);
            }
        }
        
        // Campfire
        const light = new THREE.PointLight(0xffaa00, 1, 10);
        light.position.set(0, 2, 0);
        gameState.scene.add(light);
        
        // Logs
        const logGeo = new THREE.CylinderGeometry(0.2, 0.2, 2);
        const logMat = new THREE.MeshLambertMaterial({color: COLORS.DIRT});
        const log = new THREE.Mesh(logGeo, logMat);
        log.position.set(2, 0.5, 0);
        log.rotation.z = Math.PI / 2;
        gameState.scene.add(log);
    }
    
    createTree(x, y, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2),
            new THREE.MeshLambertMaterial({color: COLORS.DIRT})
        );
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Leaves
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2, 4, 8),
            new THREE.MeshLambertMaterial({color: 0x228b22})
        );
        leaves.position.y = 3;
        leaves.castShadow = true;
        group.add(leaves);
        
        group.position.set(x, y, z);
        
        // Random scale
        const s = 0.8 + Math.random() * 0.4;
        group.scale.set(s, s, s);
        
        gameState.scene.add(group);
        
        // Static collider? Not implemented, trees are ghosts for now to prevent getting stuck
    }
}

export const world = new WorldManager();