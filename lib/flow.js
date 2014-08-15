var flow = require('nimble');
(function(exports) {
	exports._flatten = function(receiver, tasks, result) {
		/*
			receiver --> object
			tasks --> function or [] of functions
			result --> []
		*/
		if (receiver && typeof receiver !== 'object') {
			throw TypeError('receiver is not an object');
		}
		if (typeof tasks !== 'function' && toString.call(tasks) !== '[object Array]') {
			throw TypeError('tasks is not a function or an array');
		}
		if (toString.call(result) !== '[object Array]') {
			throw TypeError('result is not an array');
		}
		if (typeof tasks === 'function') {

			result.push(tasks.bind(receiver));
			return;
		}
		for (var i = 0; i < tasks.length; i++) {
			this._flatten(receiver, tasks[i], result);
		}
	};
	exports.serial = function(receiver, tasks, next) {
		/*
			receiver --> object
			tasks --> function or a [] of functions
			next -> function or undefined
		*/
		if (receiver && typeof receiver !== 'object') {
			throw TypeError('receiver is not an object');
		}
		if (typeof tasks !== 'function' && toString.call(tasks) !== '[object Array]') {
			throw TypeError('tasks is not a function or an array');
		}
		if (next && typeof next !== 'function') {
			throw TypeError('next is not a function');
		}
		var result = [];
		this._flatten(receiver, tasks, result);

		flow.series(result, next);

	};

})(typeof exports === 'undefined' ? this._ = this._ || {}: exports);
