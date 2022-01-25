import * as THREE from './three.module.js';
import Capsule from "./math/Capsule.js";
import Options from './options.class.module.js';
import basic_run_data from './basic_run_data.class.module.js';

class Player {
    camera = false;
    collider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
    can_jump = false;
    controls_locked = false;
    id = "?";
    in_height = 0;
    move_backward = false;
    move_forward = false;
    move_left = false;
    move_right = false;
    on_floor = false;
    direction = new THREE.Vector3();
    velocity = new THREE.Vector3();
    _ = new basic_run_data;
    opt = new Options;
    constructor(_, _opt) {
        if (_) {
            if (_.camera) {
                this.camera = _.camera;
            }
            this._ = _;
        }
        if (_opt) {
            this.opt = _opt;
        }
    }
};


Player.prototype.get_forward_vector = function () {
    if (this.camera) {
        this.camera.getWorldDirection(this.direction);
    }
    this.direction.y = 0;
    this.direction.normalize();
    return this.direction;
}

Player.prototype.get_side_vector = function () {
    if (this.camera) {
        this.camera.getWorldDirection(this.direction);
    }
    this.direction.y = 0;
    this.direction.normalize();
    this.direction.cross(this.camera.up);
    return this.direction;
}

Player.prototype.set_camera = function (_) {
    this.camera = _;
    return true;
}

Player.prototype.update = function (deltaTime) {
    let damping = Math.exp(-4 * deltaTime) - 1;
    if (!this.on_floor) {
        this.velocity.y -= this.opt.gravity * deltaTime;
        // small air resistance
        damping *= 0.1;
    }
    this.velocity.addScaledVector(this.velocity, damping);
    const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime);
    this.collider.translate(deltaPosition);
    this.collisions();
    this.camera.position.copy(this.collider.end);
}

Player.prototype.collisions = function () {
    const result = this._.world_octree.capsuleIntersect(this.collider);
    this.on_floor = false;
    if (result) {
        this.on_floor = result.normal.y > 0;
        if (!this.on_floor) {
            this.velocity.addScaledVector(result.normal, -result.normal.dot(velocity));
        }
        this.collider.translate(result.normal.multiplyScalar(result.depth));
    }
}

Player.prototype.get_state = function () {
    return {
        move_backward: this.move_backward,
        move_forward: this.move_forward,
        move_left: this.move_left,
        move_right: this.move_right,
        on_floor: this.on_floor,
        direction: this.direction,
    };
}



export { Player };
