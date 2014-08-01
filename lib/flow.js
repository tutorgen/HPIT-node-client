var flow = require('nimble');
(function(exports) {
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
	exports.serial = function(caller, tasks, next) {
		var result = [];
		flatten(caller, tasks, result);
		flow.series(result, next);
	};

})(typeof exports === 'undefined' ? this._ = this._ || {}: exports);
