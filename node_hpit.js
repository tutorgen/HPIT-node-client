var tutor = require('./lib/tutor');
var plugin = require('./lib/plugin');
function hpit() {
	//in case users forget to use new keyword
	if (!(this instanceof hpit)) {
		return new hpit();
	}
	this.create_plugin = function(entity_id, api_key, wildcard_callback) {
		return new plugin(entity_id, api_key, wildcard_callback);
	};
	this.create_tutor = function(entity_id, api_key, callback, attrs) {
		return new tutor(entity_id, api_key, callback, attrs);
	};
	this.start = function(entity) {
		entity.start();
	};
	this.stop = function(entity) {
		entity.stop();
	};
	this.status = function(entity) {
		if (entity.isRunning()) {
			return console.log('This entity is running.');
		}
		console.log('This entity is not running.');
	};
}


module.exports = hpit;




