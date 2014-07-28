var nimble = require('nimble');
var flow = function() {
	var flatten = function(tasks, result) {
		if (typeof tasks === 'function') {
			result.push(tasks);
			return;
		}
		for (var i = 0; i < tasks.length; i++) {
			flatten(tasks[i], result);
		}
	};
	this.serial = function(tasks) {
		var result = [];
		flatten(tasks, result);
		this.series(result);
	};
};

flow.prototype.series = nimble.series;

module.exports = flow;
