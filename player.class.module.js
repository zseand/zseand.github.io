import * as THREE from './three.module.js';
import Capsule from "./math/Capsule.js";


class class_player {
    collider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);
    can_jump = false;
    controls_locked = false;
    id = "?";
    in_height = 0;
    available_actions = ["throw_ball"];
    selected_actions = {
        mouseup: false,
        mousedown: false,
    };
    move_backward = false;
    move_forward = false;
    move_left = false;
    move_right = false;
    on_floor = false;
    direction = new THREE.Vector3();
    velocity = new THREE.Vector3();
    constructor(_opt) {
        if (_opt) {
            this.opt = _opt;
        }
    }

};

class_player.prototype.init = function (_) {
    if (_) {
        this._ = _;
    }
    this.selected_actions.mouseup = function (_, _event) {
        _ = _.modules.spheres.throw_ball(_, _event);
        return _;
    };//default
    return _;
}

class_player.prototype.get_forward_vector = function (_) {
    if (_.camera) {
        _.camera.getWorldDirection(this.direction);
    }
    this.direction.y = 0;
    this.direction.normalize();
    return this.direction;
}

class_player.prototype.get_side_vector = function (_) {
    if (_.camera) {
        _.camera.getWorldDirection(this.direction);
    }
    this.direction.y = 0;
    this.direction.normalize();
    this.direction.cross(_.camera.up);
    return this.direction;
}

class_player.prototype.update = function (_) {
    let damping = Math.exp(- 4 * _.delta_time) - 1;
    if (!this.on_floor) {
        this.velocity.y -= this.opt.gravity * _.delta_time;
        // small air resistance
        damping *= 0.1;
    }
    this.velocity.addScaledVector(this.velocity, damping);
    const deltaPosition = this.velocity.clone().multiplyScalar(_.delta_time);
    this.collider.translate(deltaPosition);
    //playerCollisions();
    var result = _.world_octree.capsuleIntersect(this.collider);
    this.on_floor = false;
    if (result) {
        this.on_floor = result.normal.y > 0;
        if (!this.on_floor) {
            this.velocity.addScaledVector(result.normal, - result.normal.dot(this.velocity));
        }
        this.collider.translate(result.normal.multiplyScalar(result.depth));
    }
    //end collisions
    _.camera.position.copy(this.collider.end);
    return _;
}
/*
class_player.prototype.collisions = function () {
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
*/

class_player.prototype.get_state = function () {
    return {
        move_backward: this.move_backward,
        move_forward: this.move_forward,
        move_left: this.move_left,
        move_right: this.move_right,
        on_floor: this.on_floor,
        direction: this.direction,
    };
}

class_player.prototype.controls = function (_) {
    console.log("class_player.prototype.controls");
    // gives a bit of air control
    const speedDelta = _.delta_time * (this.on_floor ? 25 : 8);
    if (_.key_states['KeyW']) {
        this.velocity.add(this.get_forward_vector(_).multiplyScalar(speedDelta));
    }
    if (_.key_states['KeyS']) {
        this.velocity.add(this.get_forward_vector(_).multiplyScalar(- speedDelta));
    }
    if (_.key_states['KeyA']) {
        this.velocity.add(this.get_side_vector(_).multiplyScalar(- speedDelta));
    }
    if (_.key_states['KeyD']) {
        this.velocity.add(this.get_side_vector(_).multiplyScalar(speedDelta));
    }
    if (this.on_floor) {
        if (_.key_states['Space']) {
            this.velocity.y = 15;
        }
    }
    document.getElementById("info_bar").innerHTML = JSON.stringify(_.key_states);
    return _;
}

class_player.prototype.teleport_if_ob = function () {
    if (this._.camera.position.y <= -25) {
        this.collider.start.set(0, 0.35, 0);
        this.collider.end.set(0, 1, 0);
        this.collider.radius = 0.35;
        this._.camera.position.copy(this.collider.end);
        this._.camera.rotation.set(0, 0, 0);
    }
}


class_player.prototype.do_mouseup_action = function (_event) {
    if (this.selected_actions.mouseup) {
        return this.selected_actions.mouseup(this._, _event);
    }
};

class_player.prototype.do_mousedown_action = function (_event) {
    if (this.selected_actions.mousedown) {
        return this.selected_actions.mousedown(this._, _event);
    }
};


export { class_player };
