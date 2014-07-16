var utils = require('./utils');
utils = new utils;
function request_mixin() {
	_post_data = utils._post_data;
	_get_data = utils._get_data;
	_add_hooks = utils._add_hooks;
	_try_hook = utils._try_hook;
	this.connect = function() { _add_hooks(this, ['connect', 'disconnect', '_try_hook']); };
	this.disconnect = function() {};
	this.send_log_entry = function(text) {};
}

module.exports = request_mixin;