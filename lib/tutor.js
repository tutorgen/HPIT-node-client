var message_sender_mixin = require('./message_sender_mixin');
var flow = require('./flow');
var utils = require('./utils');
utils = new utils();

function tutor(entity_id, api_key, callback, options) {
	var opts = options || {};
	message_sender_mixin.call(this, entity_id, api_key);
	this.callback = callback;	
	this.loop = true;
	this.poll_wait = opts.poll_wait || 5000;
	for (var key in opts) {
		this[key] = opts[key];
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
				if (self.loop) {
					setTimeout(function() {
						if (self.loop) {
							self.work(next);
						}						
					}, self.poll_wait);
				}
			}
		], next);	
};
tutor.prototype.start = function() { 
	var self = this;
	this.loop = true;
	flow.serial(self, [
			self.connect,
			self.work
		]);
};
tutor.prototype.stop = function() { 
	this.loop = false;
	this.disconnect();
};
tutor.prototype.isRunning = function() { 
	return this.connected; 
};
module.exports = tutor;