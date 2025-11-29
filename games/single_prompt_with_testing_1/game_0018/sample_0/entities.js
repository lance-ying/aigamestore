// entities.js - Game entity classes
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, RUNWAY_LENGTH, RUNWAY_WIDTH } from './globals.js';

export class Aircraft {
  constructor(x, y, z) {
    // Create aircraft mesh
    const geometry = new THREE.BoxGeometry(3, 1, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xccccdd,
      roughness: 0.5,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.3, 2);
    const wingMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xaaaacc,
      roughness: 0.5,
      metalness: 0.3
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, -0.2, 0);
    wings.castShadow = true;
    this.mesh.add(wings);
    
    // Add tail
    const tailGeometry = new THREE.BoxGeometry(2, 2, 0.3);
    const tail = new THREE.Mesh(tailGeometry, wingMaterial);
    tail.position.set(0, 0.5, -3.5);
    tail.castShadow = true;
    this.mesh.add(tail);
    
    // Add vertical stabilizer
    const vstabGeometry = new THREE.BoxGeometry(0.3, 1.5, 1.5);
    const vstab = new THREE.Mesh(vstabGeometry, wingMaterial);
    vstab.position.set(0, 1, -3.5);
    vstab.castShadow = true;
    this.mesh.add(vstab);
    
    // Add cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.6, 8, 8);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333366,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, 2.5);
    cockpit.scale.set(1, 0.8, 1.2);
    cockpit.castShadow = true;
    this.mesh.add(cockpit);
    
    gameState.scene.add(this.mesh);
    
    this.lastLoggedPos = new THREE.Vector3().copy(this.mesh.position);
    this.onGround = false;
  }
  
  update(deltaTime) {
    // Log position if changed significantly
    const distance = this.mesh.position.distanceTo(this.lastLoggedPos);
    if (distance > 5) {
      const screenPos = this.mesh.position.clone().project(gameState.camera);
      window.logs.player_info.push({
        screen_x: (screenPos.x + 1) * 300,
        screen_y: (1 - screenPos.y) * 200,
        game_x: this.mesh.position.x,
        game_y: this.mesh.position.y,
        game_z: this.mesh.position.z,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedPos.copy(this.mesh.position);
    }
    
    // Update game state from aircraft
    gameState.altitude = Math.max(0, this.mesh.position.y);
    
    // Calculate speed from velocity
    const speed = gameState.velocity.length();
    gameState.speed = speed;
    
    // Convert to knots for display (1 m/s ≈ 1.944 knots)
    const speedKnots = speed * 1.944;
    
    // Vertical speed in m/s, converted to fpm for display
    gameState.verticalSpeed = gameState.velocity.y * 196.85; // m/s to fpm
    
    // Get pitch and roll from mesh rotation
    const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion);
    gameState.pitch = THREE.MathUtils.radToDeg(euler.x);
    gameState.roll = THREE.MathUtils.radToDeg(euler.z);
    
    // Calculate heading from forward direction
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(this.mesh.quaternion);
    gameState.heading = (Math.atan2(forward.x, forward.z) * 180 / Math.PI + 360) % 360;
    
    // Fuel consumption
    if (gameState.engine1Running || gameState.engine2Running) {
      const consumption = gameState.throttle * 0.02 * deltaTime;
      gameState.fuel = Math.max(0, gameState.fuel - consumption);
      
      if (gameState.fuel <= 0) {
        gameState.engine1Running = false;
        gameState.engine2Running = false;
      }
    }
  }
}

export class Runway {
  constructor() {
    // Create runway surface
    const geometry = new THREE.BoxGeometry(RUNWAY_WIDTH, 0.1, RUNWAY_LENGTH);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a3a44,
      roughness: 0.9,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 0, 0);
    this.mesh.receiveShadow = true;
    
    gameState.scene.add(this.mesh);
    
    // Create centerline markings
    const markingGeometry = new THREE.BoxGeometry(0.3, 0.15, 3);
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < 15; i++) {
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.position.set(0, 0.1, -RUNWAY_LENGTH/2 + i * 7 + 3);
      this.mesh.add(marking);
    }
    
    // Create threshold markings
    const thresholdGeometry = new THREE.BoxGeometry(RUNWAY_WIDTH - 2, 0.15, 0.5);
    const threshold = new THREE.Mesh(thresholdGeometry, markingMaterial);
    threshold.position.set(0, 0.1, RUNWAY_LENGTH/2 - 2);
    this.mesh.add(threshold);
    
    // Create runway edge lights
    const lightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
    const lightMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8
    });
    
    for (let i = 0; i < 20; i++) {
      const z = -RUNWAY_LENGTH/2 + i * 5;
      
      const leftLight = new THREE.Mesh(lightGeometry, lightMaterial);
      leftLight.position.set(-RUNWAY_WIDTH/2 - 0.5, 0.3, z);
      gameState.scene.add(leftLight);
      
      const rightLight = new THREE.Mesh(lightGeometry, lightMaterial);
      rightLight.position.set(RUNWAY_WIDTH/2 + 0.5, 0.3, z);
      gameState.scene.add(rightLight);
    }
  }
  
  update(deltaTime) {
    // Runway is static, no update needed
  }
}

export class Terrain {
  constructor() {
    // Create large ground plane
    const geometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    
    // Add some height variation
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      const height = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 2;
      positions.setZ(i, height);
    }
    geometry.computeVertexNormals();
    
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x5a7a3a,
      roughness: 0.9,
      metalness: 0.0
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = -1;
    this.mesh.receiveShadow = true;
    
    gameState.scene.add(this.mesh);
    
    // Add some clouds
    this.createClouds();
  }
  
  createClouds() {
    const cloudGeometry = new THREE.SphereGeometry(15, 8, 8);
    const cloudMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      roughness: 1.0
    });
    
    for (let i = 0; i < 20; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 500,
        100 + Math.random() * 100,
        (Math.random() - 0.5) * 500
      );
      cloud.scale.set(
        1 + Math.random(),
        0.5 + Math.random() * 0.5,
        1 + Math.random()
      );
      gameState.scene.add(cloud);
    }
  }
  
  update(deltaTime) {
    // Terrain is static
  }
}