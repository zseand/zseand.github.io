import * as THREE from "./three.module.js";
import Options from "./options.class.module.js";
import basic_run_data from './basic_run_data.class.module.js';

class Spheres {
    spheres = [];
    sphereIdx = 0;
    sphere_material = new THREE.MeshStandardMaterial({
        color: 0x888855,
        roughness: 0.8,
        metalness: 0.5
    });
    _ = new basic_run_data;
    opt = new Options();
    sphere_geometry = new THREE.SphereGeometry(this.opt.SPHERE_RADIUS, 32, 32);
    curr_num = 0;

    constructor(_, _opt) {
        this._ = _;
        if (_opt) {
            this.opt = _opt;

        }
    }
}

Spheres.prototype.reset_all = function () {
    if (0 < this.spheres.length) {
        for (var $i = 0; $i < this.spheres.length; $i++) {
            this._.scene.remove(this.spheres[$i]);
        }
    }
    for (let i = 0; i < this.opt.sphere_max_count; i++) {
        var sphere = new THREE.Mesh(this.sphere_geometry, this.sphere_material);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        console.log(this._.scene.add);
        debugger;//37
        this._.scene.add(sphere);
        this.spheres.push({
            mesh: sphere,
            collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), this.opt.sphere_radius),
            velocity: new THREE.Vector3()
        });
        console.log("Sphere added");
    }
    console.log("reset_spheres runned");
}
Spheres.prototype.player_sphere_collision = function (sphere) {
    var player = window.get_player();
    //debugger//49
    const center = this._.vector_1.addVectors(
        player.collider.start,
        player.collider.end).multiplyScalar(0.5);
    const sphere_center = sphere.collider.center;
    const r = player.collider.radius + sphere.collider.radius;
    const r2 = r * r;
    for (const point of [player.collider.start, player.collider.end, center]) {
        const d2 = point.distanceToSquared(sphere_center);
        if (d2 < r2) {
            const normal = this._.vector_1.subVectors(point, sphere_center).normalize();
            const v1 = this._.vector_2.copy(normal).multiplyScalar(normal.dot(player.velocity));
            const v2 = this._.vector_3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));
            player.velocity.add(v2).sub(v1);
            sphere.velocity.add(v1).sub(v2);
            const d = (r - Math.sqrt(d2)) / 2;
            sphere_center.addScaledVector(normal, -d);
        }
    }
}

Spheres.prototype.collisions = function () {
    for (let i = 0, length = this.spheres.length; i < length; i++) {
        const s1 = this.spheres[i];
        for (let j = i + 1; j < length; j++) {
            const s2 = this.spheres[j];
            const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;
            if (d2 < r2) {
                const normal = this._.vector_1.subVectors(s1.collider.center, s2.collider.center).normalize();
                const v1 = this._.vector_2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
                const v2 = this._.vector_3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
                s1.velocity.add(v2).sub(v1);
                s2.velocity.add(v1).sub(v2);
                const d = (r - Math.sqrt(d2)) / 2;
                s1.collider.center.addScaledVector(normal, d);
                s2.collider.center.addScaledVector(normal, -d);
            }
        }
    }
}

Spheres.prototype.update = function (deltaTime) {
    for (var $i = 0; $i < this.spheres.length; $i++) {
        var sphere = this.spheres[$i];
        sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);
        const result = this._.world_octree.sphereIntersect(sphere.collider);
        if (result) {
            sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
            sphere.velocity.y -= this.opt.gravity * deltaTime;
        }
        const damping = Math.exp(-1.5 * deltaTime) - 1;
        sphere.velocity.addScaledVector(sphere.velocity, damping);
        this.player_sphere_collision(sphere);
        sphere.mesh.position.copy(sphere.collider.center);
    }
    this.collisions();
}

Spheres.prototype.throw_ball = function (player) {
    if (0 < this.spheres.length) {
        const sphere = this.spheres[this.sphereIdx];
        this._.camera.getWorldDirection(player.direction);
        sphere.collider.center.copy(
            player.collider.end
        ).addScaledVector(
            player.direction,
            player.collider.radius * 1.5
        );
        // throw the ball with more force if we hold the button longer, and if we move forward
        const impulse = 15 + 30 * (1 - Math.exp((_.mouse_time - performance.now()) * 0.001));
        sphere.velocity.copy(player.direction).multiplyScalar(impulse);
        sphere.velocity.addScaledVector(player.velocity, 2);
        this.sphereIdx = (this.sphereIdx + 1) % this.spheres.length;
        console.log("Ball throwed");
    } else {
        console.log("No spheres");
    }
};


export default Spheres;