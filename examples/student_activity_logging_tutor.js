var hpit = require('../index');

function student_activity_logging_tutor(entity_id, api_key, callback, options) {
	hpit.tutor.call(this, entity_id, api_key, callback, options);
}


student_activity_logging_tutor.prototype = Object.create(hpit.tutor.prototype);
student_activity_logging_tutor.prototype.work = function() {
	var activity = {subject: "I", verb: "made", object: "it"};
	this.send(
			message_name = "activity_logging",
			payload = activity
		);
};
module.exports = student_activity_logging_tutor;
