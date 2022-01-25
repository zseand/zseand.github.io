import * as THREE from "./three.module.js";
import * as options from "./options.module.js";

let spheres = [];
let sphereIdx = 0;

const sphereGeometry = new THREE.SphereGeometry(options.SPHERE_RADIUS, 32, 32);
const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x888855,
    roughness: 0.8,
    metalness: 0.5
});


export function reset_all() {
    if (0 < spheres.length) {
        for (var $i = 0; $i < spheres.length; $i++) {
            scene.remove(spheres[$i]);
        }
    }
    for (let i = 0; i < options.MAX_SPHERES; i++) {
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
        spheres.push({
            mesh: sphere,
            collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
            velocity: new THREE.Vector3()
        });
    }
    console.log("reset_spheres runned");
}