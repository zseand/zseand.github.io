import * as LILGUI from './lil-gui.module.min.js';

class class_options {
    color_ambient_light = "#6688cc";
    color_background = "#00EE00";
    color_directional_light = "#ffffaa";
    color_fill_light_1 = "#ff9999";
    color_fill_light_2 = "#8888ff";
    gravity = 30;
    gravity_scrool_change_value = 1;
    html_container = "container";
    stat_enabled = true;
    modules = {
        sphere: {
            max_count: 2,
            radius: .2,
            color_material: "#FF0000"
        },
    };
    player = {
        jump_value: 350,
        speed_delta_on_floor: 120,
        speed_delta_on_fly: 10,
        steps_per_frame: 5
    };
};



class_options.prototype.init = function (_dat) {
    const lilgui = new LILGUI.GUI();
    var $t = Object.keys(_dat);
    for (var $i = 0; $i < $t.length; $i++) {
        var $added = false;
        if ($t[$i] != "init") {
            if (typeof _dat[$t[$i]] == "string") {
                if (-1 < _dat[$t[$i]].indexOf("#")) {
                    lilgui.addColor(_dat, $t[$i]);
                    $added = true;
                }
            }
            if (!$added) {
                lilgui.add(_dat, $t[$i]).listen();
            }
        }
    }

}

export { class_options };