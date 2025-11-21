// game.js - Main game logic and loop
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logs, CANVAS_WIDTH, CANVAS_HEIGHT, SPEED_INCREMENT, MAX_SPEED, DISTANCE_SCORE_MULTIPLIER } from './globals.js';
import { Player, Track } from './entities.js';
import { ObstacleSpawner } from './spawner.js';
import { checkCollisions } from './collision.js';
import { createUI, updateUI, projectToScreen } from './ui.js';
import { setupInputHandlers } from './input.js';

// Initialize random seed
Math.seedrandom(42);

// Initialize three.js
function initThreeJS() {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue
  scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
  gameState.scene = scene;

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    1000
  );
  camera.position.set(0, 5, 8);
  camera.lookAt(0, 0, 0);
  gameState.camera = camera;

  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Append to game container instead of body
  const container = document.getElementById('gameContainer');
  container.appendChild(renderer.domElement);
  gameState.renderer = renderer;

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  // Add hemisphere light for better atmosphere
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.5);
  scene.add(hemisphereLight);
}

// Initialize game
function initGame() {
  initThreeJS();
  
  // Create track
  const track = new Track(gameState.scene);
  gameState.track = track;

  // Create player
  const player = new Player(0, 0.8, 0);
  gameState.scene.add(player.mesh);
  gameState.player = player;
  gameState.entities.push(player);

  // Create obstacle spawner
  gameState.spawner = new ObstacleSpawner(gameState.scene);

  // Setup UI
  createUI();

  // Setup input handlers
  setupInputHandlers();

  // Log game start
  logs.game_info.push({
    game_status: 'START',
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
}

// Update game logic
function updateGame() {
  gameState.frameCount++;

  if (gameState.gamePhase === 'PLAYING') {
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Log player position periodically
      if (gameState.frameCount % 10 === 0) {
        const screenPos = projectToScreen(
          gameState.player.mesh.position,
          gameState.camera,
          gameState.renderer.domElement
        );
        
        logs.player_info.push({
          screen_x: Math.round(screenPos.x),
          screen_y: Math.round(screenPos.y),
          game_x: gameState.player.mesh.position.x.toFixed(2),
          game_y: gameState.player.mesh.position.y.toFixed(2),
          game_z: gameState.player.mesh.position.z.toFixed(2),
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Update track
    if (gameState.track) {
      gameState.track.update(gameState.currentSpeed);
    }

    // Update obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      obstacle.update(gameState.currentSpeed);
      
      if (obstacle.shouldDespawn()) {
        gameState.scene.remove(obstacle.mesh);
        gameState.obstacles.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(obstacle);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }

    // Update coins
    for (let i = gameState.coins.length - 1; i >= 0; i--) {
      const coin = gameState.coins[i];
      coin.update(gameState.currentSpeed);
      
      if (coin.shouldDespawn()) {
        gameState.scene.remove(coin.mesh);
        gameState.coins.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(coin);
        if (entityIndex > -1) {
          gameState.entities.splice(entityIndex, 1);
        }
      }
    }

    // Spawn obstacles
    if (gameState.spawner) {
      gameState.spawner.update();
    }

    // Check collisions
    checkCollisions();

    // Update camera to follow player with smoother movement
    if (gameState.player) {
      const targetCameraX = gameState.player.mesh.position.x;
      // Reduced from 0.1 to 0.05 for smoother camera movement
      gameState.camera.position.x += (targetCameraX - gameState.camera.position.x) * 0.05;
      gameState.camera.lookAt(gameState.player.mesh.position.x, 0, 0);
    }

    // Update distance and speed
    gameState.distance += gameState.currentSpeed;
    gameState.score += DISTANCE_SCORE_MULTIPLIER * gameState.currentSpeed;
    
    // Gradually increase speed
    if (gameState.currentSpeed < MAX_SPEED) {
      gameState.currentSpeed += SPEED_INCREMENT;
    }

    // Increase difficulty over time
    gameState.difficulty = 1 + Math.floor(gameState.distance / 100);
  }

  // Update UI
  updateUI();
}

// Main game loop
function gameLoop() {
  requestAnimationFrame(gameLoop);
  updateGame();
  
  // Render scene
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}

// Export getGameState function
export function getGameState() {
  return gameState;
}

// Expose globally
window.getGameState = getGameState;

// Start game
initGame();
gameLoop();