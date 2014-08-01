var message_sender_mixin = require('./message_sender_mixin');
var flow = require('./flow');
var utils = require('./utils');
utils = new utils();

function tutor(entity_id, api_key, callback, attrs) {
	message_sender_mixin.call(this, entity_id, api_key);
	this.callback = callback;
	this.poll_wait = 5000;
	for (var key in attrs) {
		this[key] = attrs[key];
	}
}

tutor.prototype = Object.create(message_sender_mixin.prototype);
tutor.prototype.work = function(next) {
	var self = this;
	flow.serial(self, [
			function(next) {
				flow.serial(self, [
						self.pre_poll_responses,
						self._poll_responses,
						self.post_poll_responses,
					], next);				
			},
			function(next) {
				setTimeout(function() {
					self.ee.emit('loop');
				}, self.poll_wait);				
			}
		], next);	
};
tutor.prototype.start = function() { 
	var self = this;
	flow.serial(self, [
			self.connect,
			function(next) {
				self.work();
				self.ee.on('loop', function() {
					self.work();
				});
			}
		]);
};
tutor.prototype.stop = function() { 
	this.ee.removeAllListeners('loop');
	this.disconnect();
};
tutor.prototype.isRunning = function() { 
	return this.connected; 
};
module.exports = tutor;