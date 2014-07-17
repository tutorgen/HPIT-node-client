var message_sender_mixin = require('./message_sender_mixin');
var utils = require('./utils');
utils = new utils();

function tutor() {
	var running = false;
	this.start = function() { running = true; console.log('tutor starts...'); };
	this.stop = function() { running = false; console.log('tutor stops...'); };
	this.isRunning = function() { return running; };
}

tutor.prototype = new message_sender_mixin;
module.exports = tutor;