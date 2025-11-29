// terrain.js - Terrain generation and management
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WORLD_SIZE, BIOME_DEFINITIONS } from './globals.js';

export function createTerrain() {
  const scene = gameState.scene;
  
  // Create ground plane with segments for varied coloring
  const segments = 40;
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE * 2, WORLD_SIZE * 2, segments, segments);
  
  // Generate height variation and biome-based coloring
  const colors = [];
  const positions = geometry.attributes.position.array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 1];
    
    // Add slight height variation
    const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2;
    positions[i + 2] = height;
    
    // Determine biome based on position
    const biomeIndex = getBiomeIndex(x, z);
    const biome = BIOME_DEFINITIONS[biomeIndex];
    
    // Add color variation
    const color = new THREE.Color(biome.groundColor);
    const variation = 0.85 + Math.random() * 0.3;
    color.multiplyScalar(variation);
    
    colors.push(color.r, color.g, color.b);
  }
  
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const terrain = new THREE.Mesh(geometry, material);
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  scene.add(terrain);
  
  gameState.terrain = terrain;
  
  // Create boundary walls (invisible collision)
  createBoundaryWalls();
  
  // Spawn environmental decorations
  spawnEnvironmentalObjects();
  
  return terrain;
}

function getBiomeIndex(x, z) {
  // Divide world into quadrants
  const halfSize = WORLD_SIZE;
  
  if (x > 0 && z > 0) return 0; // Desert (NE)
  if (x < 0 && z > 0) return 1; // Jungle (NW)
  if (x < 0 && z < 0) return 2; // Beach (SW)
  return 3; // Mountain (SE)
}

function createBoundaryWalls() {
  const wallHeight = 20;
  const wallThickness = 2;
  const boundary = WORLD_SIZE + 5;
  
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B7355,
    transparent: true,
    opacity: 0.3
  });
  
  // Create four walls
  const walls = [
    { pos: [0, wallHeight / 2, boundary], size: [boundary * 2, wallHeight, wallThickness] }, // North
    { pos: [0, wallHeight / 2, -boundary], size: [boundary * 2, wallHeight, wallThickness] }, // South
    { pos: [boundary, wallHeight / 2, 0], size: [wallThickness, wallHeight, boundary * 2] }, // East
    { pos: [-boundary, wallHeight / 2, 0], size: [wallThickness, wallHeight, boundary * 2] } // West
  ];
  
  walls.forEach(wall => {
    const geometry = new THREE.BoxGeometry(...wall.size);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.set(...wall.pos);
    mesh.receiveShadow = true;
    gameState.scene.add(mesh);
    gameState.obstacles.push({
      mesh: mesh,
      type: 'boundary',
      radius: Math.max(...wall.size) / 2
    });
  });
}

function spawnEnvironmentalObjects() {
  // Spawn rocks and trees as obstacles
  const objectCount = 100;
  
  for (let i = 0; i < objectCount; i++) {
    // Random position within world
    const x = (Math.random() - 0.5) * WORLD_SIZE * 1.8;
    const z = (Math.random() - 0.5) * WORLD_SIZE * 1.8;
    
    // Determine biome for this position
    const biomeIndex = getBiomeIndex(x, z);
    const biome = BIOME_DEFINITIONS[biomeIndex];
    
    // Random object type
    const isTree = Math.random() > 0.5;
    
    if (isTree) {
      createTree(x, z, biome);
    } else {
      createRock(x, z, biome);
    }
  }
}

function createTree(x, z, biome) {
  const group = new THREE.Group();
  
  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x4A2511,
    roughness: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  
  // Foliage
  const foliageGeometry = new THREE.SphereGeometry(1.5, 8, 8);
  const foliageColor = biome.name === "Jungle" ? 0x228B22 : 
                       biome.name === "Desert" ? 0x6B8E23 : 0x32CD32;
  const foliageMaterial = new THREE.MeshStandardMaterial({
    color: foliageColor,
    roughness: 0.8
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 3.5;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  group.add(foliage);
  
  group.position.set(x, 0, z);
  gameState.scene.add(group);
  
  gameState.obstacles.push({
    mesh: group,
    type: 'tree',
    radius: 1.5,
    position: new THREE.Vector3(x, 0, z)
  });
}

function createRock(x, z, biome) {
  const size = 0.5 + Math.random() * 1.5;
  const geometry = new THREE.DodecahedronGeometry(size, 0);
  
  const rockColor = new THREE.Color(biome.accentColor);
  rockColor.multiplyScalar(0.6 + Math.random() * 0.4);
  
  const material = new THREE.MeshStandardMaterial({
    color: rockColor,
    roughness: 0.95,
    metalness: 0.1
  });
  
  const rock = new THREE.Mesh(geometry, material);
  rock.position.set(x, size / 2, z);
  rock.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  rock.castShadow = true;
  rock.receiveShadow = true;
  
  gameState.scene.add(rock);
  
  gameState.obstacles.push({
    mesh: rock,
    type: 'rock',
    radius: size,
    position: new THREE.Vector3(x, 0, z)
  });
}

export function getCurrentBiome(position) {
  const biomeIndex = getBiomeIndex(position.x, position.z);
  return BIOME_DEFINITIONS[biomeIndex];
}