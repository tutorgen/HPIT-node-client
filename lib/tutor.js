var message_sender_mixin = require('./message_sender_mixin');
var flow = require('nimble');
var utils = require('./utils');
utils = new utils();

function tutor(entity_id, api_key, callback, attrs) {
	this.work = function(nextOne) {
		var nextEvent = nextOne || null;
		flow.series([
				function(next) {
					//self.pre_poll_messages
					self.ee.once('end', function() {
						next();
					});
					flow.series([
							self.pre_poll_responses,
							self._poll_responses,
							self.post_poll_responses,
							function(next) {
								self.ee.emit('end');
							}
						]);				
				},
				function(next) {
					setTimeout(function() {
						self.ee.emit(nextEvent);
					}, self.poll_wait);				
				}

			]);	
	};
	this.start = function() { 
		var self = this;
		self.connect('loop');
		self.ee.on('loop', function() {
			self.work('loop');
		});
	};
	this.stop = function() { 
		self.ee.removeAllListeners('loop');
		self.disconnect();
	};
	this.isRunning = function() { 
		return self.connected; 
	};

	////////////////
	//initialization
	////////////////
	var self = this;
	this.entity_id = entity_id;
	this.api_key = api_key;
	this.callback = callback;
	this.poll_wait = 5000;
	for (var key in attrs) {
		this[key] = attrs[key];
	}
}

tutor.prototype = new message_sender_mixin;
module.exports = tutor;