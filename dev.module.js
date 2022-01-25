let g = {};


export function log(_str) {
	if (typeof _str != "number" && typeof _str != "string") {
		_str = JSON.stringify(_str, null, 4);
	}
	$("#log_bar").prepend(_str + "<br>");
}

export function info(_str) {
	if (typeof _str != "number" && typeof _str != "string") {
		_str = JSON.stringify(_str, null, 4);
	}
	$("#info_bar").html(_str);
	this.log(_str);
}

export function clear() {
	$("#info_bar").html("cleared");
}



export function link_globals(_globals) {
	g = _globals;
	return true;
};