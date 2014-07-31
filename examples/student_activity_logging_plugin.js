var hpit = require('../index');
hpit = new hpit();

function student_activity_logging_plugin() {
	this.post_connect = function(next) { 
		var self = this;
		self.subscribe({
			activity_logging: self.log_student_activity_callback
		}, next);
	};

	this.log_student_activity_callback = function(message, next) {
		console.log(message);
		next();
	};

}


student_activity_logging_plugin.prototype = hpit.create_plugin(
		entity_id = "6bf92c7e-353e-47c2-9690-e3a3c8f24602",
		api_key = "8abb98929495403a73b3c5a00b4b1a92"
	);

module.exports = student_activity_logging_plugin;