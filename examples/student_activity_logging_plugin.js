var hpit = require('../index');

function student_activity_logging_plugin(entity_id, api_key, err_cb, options) {
	hpit.plugin.call(this, entity_id, api_key, err_cb, options);
}


student_activity_logging_plugin.prototype = Object.create(hpit.plugin.prototype);
student_activity_logging_plugin.prototype.post_connect = function(next) { 
	var self = this;
	self.subscribe({
		activity_logging: self.log_student_activity_callback
	}, next);
};
student_activity_logging_plugin.prototype.log_student_activity_callback = function(message, next) {
	console.log(message);
	if (next) next();	
};
module.exports = student_activity_logging_plugin;