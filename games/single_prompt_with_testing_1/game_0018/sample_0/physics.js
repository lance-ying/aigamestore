// physics.js - Physics and collision handling
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
  gameState, 
  GAME_PHASES, 
  MAX_LANDING_VERTICAL_SPEED,
  AIRCRAFT_MASS,
  STALL_SPEED 
} from './globals.js';

export function updatePhysics(deltaTime) {
  if (!gameState.player) return;
  
  const aircraft = gameState.player;
  
  // Apply gravity
  const gravityForce = gameState.gravity.clone().multiplyScalar(AIRCRAFT_MASS * deltaTime);
  gameState.velocity.add(gravityForce.divideScalar(AIRCRAFT_MASS));
  
  // Apply aerodynamics
  applyAerodynamics(deltaTime);
  
  // Update position
  const deltaPos = gameState.velocity.clone().multiplyScalar(deltaTime);
  aircraft.mesh.position.add(deltaPos);
  
  // Update rotation based on angular velocity
  const deltaRot = gameState.angularVelocity.clone().multiplyScalar(deltaTime);
  aircraft.mesh.rotateX(deltaRot.x);
  aircraft.mesh.rotateY(deltaRot.y);
  aircraft.mesh.rotateZ(deltaRot.z);
  
  // Apply damping
  gameState.angularVelocity.multiplyScalar(0.95);
}

function applyAerodynamics(deltaTime) {
  const aircraft = gameState.player;
  const speed = gameState.velocity.length();
  
  if (speed < 0.1) return;
  
  // Get aircraft orientation
  const forward = new THREE.Vector3(0, 0, 1);
  forward.applyQuaternion(aircraft.mesh.quaternion);
  
  const up = new THREE.Vector3(0, 1, 0);
  up.applyQuaternion(aircraft.mesh.quaternion);
  
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(aircraft.mesh.quaternion);
  
  // Calculate angle of attack
  const velocityDir = gameState.velocity.clone().normalize();
  const angleOfAttack = Math.acos(forward.dot(velocityDir));
  
  // Lift force (perpendicular to velocity)
  let liftCoef = Math.sin(angleOfAttack) * 2.5;
  liftCoef += gameState.flapSetting * 0.3; // Flaps increase lift
  
  // Spoilers reduce lift
  if (gameState.spoilersDeployed) {
    liftCoef *= 0.4;
  }
  
  const liftMagnitude = liftCoef * speed * speed * 0.1;
  const liftDir = new THREE.Vector3().crossVectors(velocityDir, right).normalize();
  const liftForce = liftDir.multiplyScalar(liftMagnitude * deltaTime);
  
  gameState.velocity.add(liftForce);
  
  // Thrust from engines
  const engineCount = (gameState.engine1Running ? 1 : 0) + (gameState.engine2Running ? 1 : 0);
  const thrustMagnitude = gameState.throttle * engineCount * 80 * deltaTime;
  const thrustForce = forward.clone().multiplyScalar(thrustMagnitude);
  
  gameState.velocity.add(thrustForce);
  
  // Drag
  const dragCoef = 0.1 + (gameState.spoilersDeployed ? 0.2 : 0) + (gameState.gearDeployed ? 0.1 : 0);
  const dragMagnitude = dragCoef * speed * speed * deltaTime;
  const dragForce = velocityDir.clone().multiplyScalar(-dragMagnitude);
  
  gameState.velocity.add(dragForce);
  
  // Control surface forces
  const controlAuthority = Math.min(speed / 30, 1.0); // More authority at higher speeds
  
  // Pitch (elevator)
  gameState.angularVelocity.x += gameState.pitchInput * 0.8 * controlAuthority * deltaTime;
  
  // Roll (ailerons)
  gameState.angularVelocity.z -= gameState.rollInput * 1.2 * controlAuthority * deltaTime;
  
  // Yaw (rudder)
  gameState.angularVelocity.y += gameState.yawInput * 0.6 * controlAuthority * deltaTime;
  
  // Stability augmentation (auto-leveling tendency)
  const euler = new THREE.Euler().setFromQuaternion(aircraft.mesh.quaternion);
  gameState.angularVelocity.x -= euler.x * 0.5 * deltaTime;
  gameState.angularVelocity.z -= euler.z * 0.5 * deltaTime;
}

export function checkCollisions() {
  if (!gameState.player || !gameState.runway) return;
  
  const aircraft = gameState.player;
  const runway = gameState.runway;
  
  // Check if aircraft is near ground/runway
  const groundY = 0.5; // Half of runway height
  const aircraftBottom = aircraft.mesh.position.y - 0.5; // Half of aircraft height
  
  if (aircraftBottom <= groundY && !aircraft.onGround) {
    // Touchdown!
    aircraft.onGround = true;
    
    // Check if on runway
    const onRunway = Math.abs(aircraft.mesh.position.x - runway.mesh.position.x) < 7.5 &&
                     Math.abs(aircraft.mesh.position.z - runway.mesh.position.z) < 50;
    
    if (onRunway) {
      handleRunwayLanding();
    } else {
      handleTerrainCrash();
    }
  }
  
  // If on ground, stop descent
  if (aircraft.mesh.position.y < groundY) {
    aircraft.mesh.position.y = groundY + 0.5;
    gameState.velocity.y = Math.max(0, gameState.velocity.y);
  }
}

function handleRunwayLanding() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Record touchdown metrics
  gameState.touchdownSpeed = gameState.speed * 1.944; // Convert to knots
  gameState.touchdownVerticalSpeed = Math.abs(gameState.velocity.y * 196.85); // Convert to fpm
  gameState.touchdownAlignment = Math.abs(gameState.player.mesh.position.x);
  
  // Check landing criteria
  const safeVerticalSpeed = Math.abs(gameState.velocity.y) < MAX_LANDING_VERTICAL_SPEED;
  const gearDown = gameState.gearDeployed;
  const reasonableSpeed = gameState.speed > 30 && gameState.speed < 90;
  const goodAlignment = gameState.touchdownAlignment < 5;
  const levelPitch = Math.abs(gameState.pitch) < 15;
  const levelRoll = Math.abs(gameState.roll) < 20;
  
  if (safeVerticalSpeed && gearDown && reasonableSpeed && goodAlignment && levelPitch && levelRoll) {
    // Successful landing
    gameState.landedSafely = true;
    gameState.score += 1000;
    gameState.score += Math.floor((MAX_LANDING_VERTICAL_SPEED - Math.abs(gameState.velocity.y)) * 500);
    gameState.score -= Math.floor(gameState.touchdownAlignment * 20);
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    window.logs.game_info.push({
      game_status: GAME_PHASES.GAME_OVER_WIN,
      data: { score: gameState.score },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Crash landing
    const reasons = [];
    if (!gearDown) reasons.push("Gear not deployed");
    if (!safeVerticalSpeed) reasons.push("Vertical speed too high");
    if (!reasonableSpeed) reasons.push("Approach speed incorrect");
    if (!goodAlignment) reasons.push("Poor runway alignment");
    if (!levelPitch) reasons.push("Excessive pitch angle");
    if (!levelRoll) reasons.push("Excessive roll angle");
    
    gameState.crashReason = reasons.join(", ");
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    window.logs.game_info.push({
      game_status: GAME_PHASES.GAME_OVER_LOSE,
      data: { reason: gameState.crashReason },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleTerrainCrash() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.crashReason = "Crashed into terrain - missed runway";
  gameState.touchdownSpeed = gameState.speed * 1.944;
  gameState.touchdownVerticalSpeed = Math.abs(gameState.velocity.y * 196.85);
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  
  window.logs.game_info.push({
    game_status: GAME_PHASES.GAME_OVER_LOSE,
    data: { reason: gameState.crashReason },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function checkBoundaries() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const aircraft = gameState.player;
  if (!aircraft) return;
  
  // Check if aircraft went too far out of bounds
  if (Math.abs(aircraft.mesh.position.x) > 500 ||
      Math.abs(aircraft.mesh.position.z) > 500 ||
      aircraft.mesh.position.y < -10) {
    gameState.crashReason = "Aircraft left operational area";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    window.logs.game_info.push({
      game_status: GAME_PHASES.GAME_OVER_LOSE,
      data: { reason: gameState.crashReason },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check for stall
  if (gameState.speed < STALL_SPEED && gameState.altitude > 10) {
    gameState.crashReason = "Aircraft stalled";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    window.logs.game_info.push({
      game_status: GAME_PHASES.GAME_OVER_LOSE,
      data: { reason: gameState.crashReason },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}