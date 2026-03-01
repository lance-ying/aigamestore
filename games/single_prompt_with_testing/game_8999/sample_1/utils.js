// Simple seeded random implementation
let seedVal = 42;

export function setSeed(val) {
    seedVal = val;
    Math.seedrandom(val);
}

export function random() {
    return Math.random();
}

export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

// 2D Noise function for terrain generation (Simple value noise)
// Based on a simple seeded interaction
export function noise2D(x, z, scale = 0.1, magnitude = 10) {
    const sx = x * scale;
    const sz = z * scale;
    
    // Super simple composition of sines/cosines for deterministic "noise"
    // avoiding external heavy libraries
    const val = Math.sin(sx) * Math.cos(sz) + 
                Math.sin(sx * 2.5 + sz * 1.5) * 0.5 + 
                Math.cos(sx * 0.5 - sz * 3.0) * 0.25;
                
    // Normalize roughly to 0..1 then scale
    const norm = (val + 1.75) / 3.5; 
    return Math.floor(norm * magnitude);
}

// 3D Distance check
export function distance3D(p1, p2) {
    return Math.sqrt(
        Math.pow(p2.x - p1.x, 2) +
        Math.pow(p2.y - p1.y, 2) +
        Math.pow(p2.z - p1.z, 2)
    );
}

// Ray-Box Intersection helper
export function intersectRayBox(rayOrigin, rayDir, boxMin, boxMax) {
    let tmin = (boxMin.x - rayOrigin.x) / rayDir.x;
    let tmax = (boxMax.x - rayOrigin.x) / rayDir.x;

    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (boxMin.y - rayOrigin.y) / rayDir.y;
    let tymax = (boxMax.y - rayOrigin.y) / rayDir.y;

    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if ((tmin > tymax) || (tymin > tmax)) return null;

    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (boxMin.z - rayOrigin.z) / rayDir.z;
    let tzmax = (boxMax.z - rayOrigin.z) / rayDir.z;

    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if ((tmin > tzmax) || (tzmin > tmax)) return null;

    if (tzmin > tmin) tmin = tzmin;
    if (tzmax < tmax) tmax = tzmax;

    if (tmax < 0) return null; // Box is behind ray

    const t = tmin >= 0 ? tmin : tmax;
    
    // Calculate intersection point
    const point = {
        x: rayOrigin.x + rayDir.x * t,
        y: rayOrigin.y + rayDir.y * t,
        z: rayOrigin.z + rayDir.z * t
    };
    
    // Calculate normal (which face was hit)
    const normal = { x: 0, y: 0, z: 0 };
    const epsilon = 0.001;
    
    if (Math.abs(point.x - boxMin.x) < epsilon) normal.x = -1;
    else if (Math.abs(point.x - boxMax.x) < epsilon) normal.x = 1;
    else if (Math.abs(point.y - boxMin.y) < epsilon) normal.y = -1;
    else if (Math.abs(point.y - boxMax.y) < epsilon) normal.y = 1;
    else if (Math.abs(point.z - boxMin.z) < epsilon) normal.z = -1;
    else if (Math.abs(point.z - boxMax.z) < epsilon) normal.z = 1;

    return { distance: t, point: point, normal: normal };
}