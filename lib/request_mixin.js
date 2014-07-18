var request = require('request');
var utils = require('./utils');
utils = new utils();

function request_mixin() {
	this._post_data = function(url, data, callback) {
		var options = {
			url: url,
			method: "POST",
			body: data,
			json: true
		};
		this.session(options, callback);
	};
	this._get_data = function(url, callback) {
		this.session(url, callback);
	};
	this._add_hooks = function(hooks) {
		//hooks is a list
		for (hook in hooks) {
			if (!(hooks[hook] in this)) {
				this[hooks[hook]] = undefined;
			} 
			
		}
	};
	this._try_hook = function(hook_name) {
		hook = this[hook_name];
		if (hook) {
			return hook();
		}
		return true;
	};
	this.connect = function() {
		this._try_hook('pre_connect');
		this._post_data(utils.HPIT_URL_ROOT, {
			entity_id: this.entity_id,
			api_key: this.api_key
		});
		this.connected = true;
		this._try_hook('post_connect');
		return this.connected;
	};
	this.disconnect = function() {
		this._try_hook('pre_disconnect');
		this._post_data(utils.HPIT_URL_ROOT, {
			entity_id: this.entity_id,
			api_key: this.api_key
		});
		this.connected = false;
		this._try_hook('post_disconnect');
		return this.connected;
	};
	this.send_log_entry = function(text, callback) {
		this._post_data(utils.HPIT_URL_ROOT, {
			log_entry: text
		}, callback);
	};
	
	/////////////////
	//initialization
	/////////////////
	this.entity_id = "";
	this.api_key = "";
	this.session = request.defaults({jar: true});
	this.connected = false;
	this._add_hooks(['pre_connect', 'post_connect', 'pre_disconnect', 'post_disconnect']);

}

module.exports = request_mixin;