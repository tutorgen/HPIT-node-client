var message_sender_mixin = require('./message_sender_mixin');
var flow = require('./flow');
var settings = require('./settings');

function tutor(entity_id, api_key, callback, err_cb, options) {
	/* 
		entity_id --> string
	   	api_key --> string 
	   	callback --> function
	   	options --> object(dict)
	*/
	if (entity_id && typeof entity_id !== 'string') {
		throw TypeError('entity_id is not a string');
	}
	if (api_key && typeof api_key !== 'string') {
		throw TypeError('api_key is not a string');
	}
	if (callback && typeof callback !== 'function') {
		throw TypeError('callback is not a function');
	}
	if (err_cb && typeof err_cb !== 'function') {
		throw TypeError('err_cb is not a function');
	}
	options = options || {};
	if (typeof options !== 'object') {
		throw TypeError('options is not a dict object');
	}
	
	message_sender_mixin.call(this, entity_id, api_key, err_cb);
	this.callback = callback;	
	this.loop = true;
	this.poll_wait = options.poll_wait || 5000;
	for (var key in options) {
		this[key] = options[key];
	}
}

tutor.prototype = Object.create(message_sender_mixin.prototype);
tutor.prototype.work = function(next) {
	/*
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
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
						} else {
							next();
						}					
					}, self.poll_wait);
				} else {
					next();
				}
			}
		], next);	
};
tutor.prototype.start = function() { 
	var self = this;
	this.loop = true;
	flow.serial(self, [
			self.pre_connect,
			self.connect,
			self.post_connect,
			self.work
		]);
};
tutor.prototype.stop = function() { 
	this.loop = false;
	var self = this;
	flow.serial(self, [
			self.pre_disconnect,
			self.disconnect,
			self.post_disconnect
		]);
};
tutor.prototype.isRunning = function() { 
	return this.connected; 
};
module.exports = tutor;