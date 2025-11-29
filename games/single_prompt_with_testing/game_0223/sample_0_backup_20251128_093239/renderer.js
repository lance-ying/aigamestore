// renderer.js - Three.js scene setup

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, WALLS, ROOMS, LEVEL_COLORS } from './globals.js';

export function setupScene() {
  // Create floor
  const floorGeometry = new THREE.PlaneGeometry(50, 50);
  const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1520,
    roughness: 0.9,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  gameState.scene.add(floor);
  gameState.floorMesh = floor;
  
  // Create ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ 
      color: 0x0a0508,
      roughness: 1.0,
      side: THREE.DoubleSide
    })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3;
  gameState.scene.add(ceiling);
  gameState.ceilingMesh = ceiling;
}

export function setupWalls() {
  const wallHeight = 3;
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a1a2f,
    roughness: 0.9,
    metalness: 0.1
  });
  
  gameState.wallMeshes = [];
  
  for (const wall of WALLS) {
    const length = Math.sqrt(
      Math.pow(wall.x2 - wall.x1, 2) + 
      Math.pow(wall.y2 - wall.y1, 2)
    );
    
    const geometry = new THREE.BoxGeometry(length, wallHeight, 0.2);
    const mesh = new THREE.Mesh(geometry, wallMaterial);
    
    // Position at midpoint
    mesh.position.x = (wall.x1 + wall.x2) / 2;
    mesh.position.y = wallHeight / 2;
    mesh.position.z = (wall.y1 + wall.y2) / 2;
    
    // Rotate to align with wall direction
    const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
    mesh.rotation.y = -angle;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    gameState.scene.add(mesh);
    gameState.wallMeshes.push(mesh);
  }
  
  // Add some decorative boxes for furniture
  addFurniture();
}

function addFurniture() {
  const furnitureMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a2a3f,
    roughness: 0.8,
    metalness: 0.2
  });
  
  // Add some boxes as furniture
  const furniture = [
    { x: 7, y: 0.5, z: 7, w: 1.5, h: 1, d: 1.5 },
    { x: 32, y: 0.5, z: 5, w: 1, h: 1, d: 1 }, // Food bowl
    { x: 5, y: 0.5, z: 5, w: 0.8, h: 0.8, d: 0.8 }, // Brush
    { x: 32, y: 0.5, z: 25, w: 1, h: 1, d: 1 }, // Charger
  ];
  
  for (const item of furniture) {
    const geometry = new THREE.BoxGeometry(item.w, item.h, item.d);
    const mesh = new THREE.Mesh(geometry, furnitureMaterial);
    mesh.position.set(item.x, item.y, item.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    gameState.scene.add(mesh);
  }
}

export function updateSceneColors() {
  const levelIndex = Math.min(gameState.currentLevel - 1, LEVEL_COLORS.length - 1);
  const colors = LEVEL_COLORS[levelIndex];
  
  // Update floor color
  if (gameState.floorMesh) {
    gameState.floorMesh.material.color.setHex(colors.floor);
  }
  
  // Update ceiling color
  if (gameState.ceilingMesh) {
    gameState.ceilingMesh.material.color.setHex(colors.fog);
  }
  
  // Update wall colors
  gameState.wallMeshes.forEach(wall => {
    wall.material.color.setHex(colors.walls);
  });
  
  // Update ambient light
  if (gameState.ambientLight) {
    gameState.ambientLight.color.setHex(colors.ambient);
  }
  
  // Update fog
  if (gameState.scene.fog) {
    gameState.scene.fog.color.setHex(colors.fog);
    gameState.scene.background.setHex(colors.fog);
  }
}