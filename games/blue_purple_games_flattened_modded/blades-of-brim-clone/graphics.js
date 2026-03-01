import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Procedural Geometry Generators

export function createPlayerMesh() {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.45;
    head.castShadow = true;
    group.add(head);
    
    // Bandana (Hero flair)
    const bandanaGeo = new THREE.BoxGeometry(0.55, 0.1, 0.55);
    const bandanaMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const bandana = new THREE.Mesh(bandanaGeo, bandanaMat);
    bandana.position.y = 1.55;
    group.add(bandana);

    // Sword Arm
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const arm = new THREE.Mesh(armGeo, headMat);
    arm.position.set(0.5, 0.8, 0.2);
    group.add(arm);

    // Sword
    const hiltGeo = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    const hiltMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const hilt = new THREE.Mesh(hiltGeo, hiltMat);
    hilt.position.set(0, -0.3, 0.2);
    arm.add(hilt);

    const bladeGeo = new THREE.BoxGeometry(0.05, 1.2, 0.2);
    const bladeMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, 
        emissive: 0x004444, 
        metalness: 0.8, 
        roughness: 0.2 
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 0.6, 0);
    hilt.add(blade);

    // Store references for animation
    group.userData = { arm, blade };

    return group;
}

export function createEnemyMesh() {
    const group = new THREE.Group();

    // Main Body
    const bodyGeo = new THREE.DodecahedronGeometry(0.6);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;
    body.castShadow = true;
    group.add(body);

    // Spikes
    const spikeGeo = new THREE.ConeGeometry(0.1, 0.4, 4);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    const positions = [
        [0, 1.2, 0], [0.5, 1, 0], [-0.5, 1, 0], [0, 1, 0.5], [0, 1, -0.5]
    ];

    positions.forEach(pos => {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(...pos);
        group.add(spike);
    });

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.1);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
    
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.2, 0.7, 0.5);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.2, 0.7, 0.5);
    group.add(rightEye);

    return group;
}

export function createCoinMesh() {
    const group = new THREE.Group();
    
    // Coin
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        metalness: 1.0, 
        roughness: 0.3,
        emissive: 0x443300
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2; // Face camera roughly
    mesh.castShadow = true;
    group.add(mesh);
    
    return group;
}

export function createObstacleMesh(type) {
    if (type === 'wall') {
        // Shortened wall: Height 2.0 (was 3.0), Y position 1.0 (was 1.5)
        const geo = new THREE.BoxGeometry(2.5, 2.0, 1);
        const mat = new THREE.MeshStandardMaterial({ color: 0x555555 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    } else if (type === 'rock') {
        const geo = new THREE.DodecahedronGeometry(0.8);
        const mat = new THREE.MeshStandardMaterial({ color: 0x665544 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.8;
        mesh.castShadow = true;
        return mesh;
    }
    return new THREE.Group();
}