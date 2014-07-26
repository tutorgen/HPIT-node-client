var hpit = require('../index');
hpit = new hpit();

function student_activity_logging_tutor() {
	this.work = function() {
		var activity = {subject: "I", verb: "made", object: "it"};
		this.send(
				message_name = "activity_logging",
				payload = activity
			);
	};

}


student_activity_logging_tutor.prototype = hpit.create_tutor(
		entity_id = "047f25f1-99fd-4425-9508-9cb21a0955e2",
		api_key = "0cf68ca2df0e770280d3aacef378ab02"
	);
module.exports = student_activity_logging_tutor;