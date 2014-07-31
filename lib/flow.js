var nimble = require('nimble');
var flow = function() {
	var flatten = function(caller, tasks, result) {
		if (typeof tasks === 'undefined') {
			return;
		}
		if (typeof tasks === 'function') {

			result.push(tasks.bind(caller));
			return;
		}
		for (var i = 0; i < tasks.length; i++) {
			flatten(caller, tasks[i], result);
		}
	};
	this.serial = function(caller, tasks, next) {
		var result = [];
		flatten(caller, tasks, result);
		this.series(result, next);
	};
};

flow.prototype.series = nimble.series;

module.exports = flow;
