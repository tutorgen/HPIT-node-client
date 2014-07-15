var tutor = require('./tutor');
var plugin = require('./plugin');
function hpit() {
	//private functions
	this.plugin = new plugin;
	this.tutor = new tutor;
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




