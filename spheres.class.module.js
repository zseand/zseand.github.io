import * as THREE from "./three.module.js";
import { class_options } from "./options.class.module.js";
import { basic_run_data } from './basic_run_data.class.module.js';

class class_spheres {
    spheres = [];
    sphere_id = 0;
    geometry = false;
    material = false;
    radius = .2;
    curr_num = 0;
    max_count = 0;
    radius = 1;
    color_material = "#FFFFFF";

    constructor(_options) {
        var $tmp = Object.keys(_options);
        for (var $i = 0; $i < $tmp.length; $i++) {
            this[$tmp[$i]] = _options[$tmp[$i]];
        }
    }
}

class_spheres.prototype.init = function (_) {
    this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    this.material = new THREE.MeshStandardMaterial({
        color: this.color_material,
        roughness: 0.8,
        metalness: 0.5
    });
    for (let i = 0; i < this.max_count; i++) {
        const sphere = new THREE.Mesh(this.geometry, this.material);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.name = "sphere_" + i;
        this.spheres.push(
            {
                mesh: sphere,
                collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0),
                    this.radius
                ), velocity: new THREE.Vector3()
            });
        _.scene.add(sphere);
    }
    return _;
};

class_spheres.prototype.reset_all = function () {
    if (0 < this.spheres.length) {
        for (var $i = 0; $i < this.spheres.length; $i++) {
            this._.scene.remove(this._.getObjectByName(this.spheres[$i].name));
        }
    }
    this.init();
    console.log("reset_spheres runned");
}
class_spheres.prototype.player_sphere_collision = function (_, sphere) {
    var $player = _.player;
    const center = _.vector_1.addVectors(
        $player.collider.start,
        $player.collider.end).multiplyScalar(0.5);
    const sphere_center = sphere.collider.center;
    const r = $player.collider.radius + sphere.collider.radius;
    const r2 = r * r;
    for (const point of [$player.collider.start, $player.collider.end, center]) {
        const d2 = point.distanceToSquared(sphere_center);
        if (d2 < r2) {
            const normal = _.vector_1.subVectors(point, sphere_center).normalize();
            const v1 = _.vector_2.copy(normal).multiplyScalar(normal.dot($player.velocity));
            const v2 = _.vector_3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));
            $player.velocity.add(v2).sub(v1);
            sphere.velocity.add(v1).sub(v2);
            const d = (r - Math.sqrt(d2)) / 2;
            sphere_center.addScaledVector(normal, -d);
        }
    }
    return _;
}

class_spheres.prototype.collisions = function (_) {
    for (let i = 0, length = this.spheres.length; i < length; i++) {
        const s1 = this.spheres[i];
        for (let j = i + 1; j < length; j++) {
            const s2 = this.spheres[j];
            const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
            const r = s1.collider.radius + s2.collider.radius;
            const r2 = r * r;
            if (d2 < r2) {
                const normal = _.vector_1.subVectors(s1.collider.center, s2.collider.center).normalize();
                const v1 = _.vector_2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
                const v2 = _.vector_3.copy(normal).multiplyScalar(normal.dot(s2.velocity));
                s1.velocity.add(v2).sub(v1);
                s2.velocity.add(v1).sub(v2);
                const d = (r - Math.sqrt(d2)) / 2;
                s1.collider.center.addScaledVector(normal, d);
                s2.collider.center.addScaledVector(normal, -d);
            }
        }
    }
    return _;
}

class_spheres.prototype.update = function (_) {
    for (var $i = 0; $i < this.spheres.length; $i++) {
        var sphere = this.spheres[$i];

        sphere.collider.center.addScaledVector(sphere.velocity, _.delta_time);
        const result = _.world_octree.sphereIntersect(sphere.collider);
        if (result) {
            sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
            sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
        } else {
            sphere.velocity.y -= _.options.gravity * _.delta_time;
        }
        const damping = Math.exp(-1.5 * _.delta_time) - 1;
        sphere.velocity.addScaledVector(sphere.velocity, damping);
        _ = this.player_sphere_collision(_, sphere);
        sphere.mesh.position.copy(sphere.collider.center);
    }
    _ = this.collisions(_);
    return _;
}

class_spheres.prototype.throw_ball = function (_) {
    console.log("player.throw_ball ");
    var $player = _.player;
    var $sphere = this.spheres[this.sphere_id];
    _.camera.getWorldDirection($player.direction);
    $sphere.collider.center.copy(
        $player.collider.end
    ).addScaledVector(
        $player.direction,
        $player.collider.radius * 1.5
    );
    // throw the ball with more force if we hold the button longer, and if we move forward
    const impulse = 15 + 30 * (1 - Math.exp((_.mouse_time - performance.now()) * 0.001));
    $sphere.velocity.copy($player.direction).multiplyScalar(impulse);
    $sphere.velocity.addScaledVector($player.velocity, 2);
    this.sphere_id = (this.sphere_id + 1) % this.spheres.length;
    return _;
};



export { class_spheres };