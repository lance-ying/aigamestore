/**
 * World generation and terrain management
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONFIG } from './globals.js';
import { isPositionValid } from './physics.js';

/**
 * Setup the game world
 */
export function setupWorld() {
  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(
    GAME_CONFIG.WORLD_SIZE,
    GAME_CONFIG.WORLD_SIZE,
    32,
    32
  );
  
  // Add some variation to ground vertices
  const positions = groundGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] = Math.random() * 0.3;
  }
  groundGeometry.attributes.position.needsUpdate = true;
  groundGeometry.computeVertexNormals();
  
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a7c59,
    roughness: 0.9,
    metalness: 0.0
  });
  
  gameState.terrain = new THREE.Mesh(groundGeometry, groundMaterial);
  gameState.terrain.rotation.x = -Math.PI / 2;
  gameState.terrain.position.y = 0;
  gameState.terrain.receiveShadow = true;
  
  gameState.scene.add(gameState.terrain);
  
  // Add trees
  createTrees();
  
  // Add rocks
  createRocks();
  
  // Create skybox
  createSkybox();
}

/**
 * Create trees scattered around the world
 */
function createTrees() {
  const treeCount = 30;
  
  for (let i = 0; i < treeCount; i++) {
    const x = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.8;
    const z = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.8;
    
    // Skip if too close to center (spawn area)
    if (Math.sqrt(x * x + z * z) < 10) continue;
    
    createTree(x, z);
  }
}

/**
 * Create a single tree
 */
function createTree(x, z) {
  const tree = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4a3520,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Foliage
  const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2d5016,
    roughness: 0.8
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 4;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  tree.add(foliage);
  
  tree.position.set(x, 0, z);
  gameState.scene.add(tree);
  gameState.trees.push(tree);
}

/**
 * Create rocks scattered around the world
 */
function createRocks() {
  const rockCount = 20;
  
  for (let i = 0; i < rockCount; i++) {
    const x = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.8;
    const z = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.8;
    
    // Skip if too close to center
    if (Math.sqrt(x * x + z * z) < 10) continue;
    
    createRock(x, z);
  }
}

/**
 * Create a single rock
 */
function createRock(x, z) {
  const rockGeometry = new THREE.DodecahedronGeometry(0.8, 0);
  const rockMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6b6b6b,
    roughness: 0.95,
    metalness: 0.1
  });
  const rock = new THREE.Mesh(rockGeometry, rockMaterial);
  rock.position.set(x, 0.4, z);
  rock.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  rock.scale.set(
    0.8 + Math.random() * 0.6,
    0.8 + Math.random() * 0.6,
    0.8 + Math.random() * 0.6
  );
  rock.castShadow = true;
  rock.receiveShadow = true;
  
  gameState.scene.add(rock);
  gameState.rocks.push(rock);
}

/**
 * Create skybox with gradient
 */
function createSkybox() {
  // Create a large sphere for the sky
  const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x87CEEB) },
      bottomColor: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  gameState.scene.add(sky);
}