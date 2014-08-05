var message_sender_mixin = require('./message_sender_mixin');
var EventEmitter = require('events').EventEmitter;
var flow = require('./flow');
var utils = require('./utils');
utils = new utils();

function plugin(entity_id, api_key, options) {
	var opts = options || {};
	message_sender_mixin.call(this, entity_id, api_key);
	this.wildcard_callback = opts.wildcard_callback;
	this.transaction_callback = undefined;
	this.callbacks = {};
	this.poll_wait = opts.poll_wait || 5000;
	this.loop = true;
}


plugin.prototype = Object.create(message_sender_mixin.prototype);
plugin.prototype._poll = function(next) {
	var self = this;
	this._get_data('plugin/message/list', function(err, response, body) {
		var messages = body['messages'];
		self._dispatch(messages, next);		
	});
};
	
plugin.prototype._handle_transactions = function(next) {
	var self = this;
	this._get_data('plugin/transaction/list', function(err, response, body) {
		var transaction_data = body['transactions'];
		var tasks = [];
		for (var i in transaction_data) {
			var item = transaction_data[i];
			if (self.transaction_callback) {
				self.transaction_callback(item);
				(function(i) {
					var task = function(next) {
						self.transaction_callback(i, next);
					};
					tasks.push(task);
				})(item);
			} else {
				var task = function(next) {
					console.log('No transactions callbacks available');
					next();
				};
				tasks.push(task);
			}
		}
		flow.serial(self, tasks, next);	
	});
};
	
plugin.prototype._dispatch = function(message_data, next) {
	var self = this;
	var tasks = [];
	flow.serial(self, [
			self.pre_dispatch_messages,
			function(next) {
				for (var i in message_data) {
					var message_item = message_data[i];
					var message = message_item['message_name'];
					var payload = message_item['message'];
					payload['message_id'] = message_item['message_id'];
					payload['sender_entity_id'] = message_item['sender_entity_id'];
					if (self.callbacks[message]) {
						(function(msg, pld) {
							var task = function(next) {
								self.callbacks[msg](pld, next);
							};
							tasks.push(task);
						})(message, payload);
					} else if (self.wildcard_callback){
						(function(pld) {
							var task = function(next) {
								self.wildcard_callback(pld, next);
							};
							tasks.push(task);
						})(payload);					
					} else {
						var task = function(next) {
							console.log('No callbacks available');
							next();
						};
						tasks.push(task);
					}
				}
				flow.serial(self, tasks, next);					
			},
			self.post_dispatch_messages
		], next);
};

plugin.prototype.register_transaction_callback = function(callback, next) {
	if (typeof(callback) != 'function') {
		return console.log('The callback submitted is not callable.')
	}
	this._post_data('plugin/subscribe', {
		message_name: 'transaction'
	}, next);
	this.transaction_callback = callback;
};
plugin.prototype.clear_transaction_callback = function(next) {
	this._post_data('plugin/unsubscribe', {
		message_name: 'transaction'
	}, next);
	this.transaction_callback = undefined;
};
plugin.prototype.list_subscriptions = function(next) {
	var self = this;
	this._get_data('plugin/subscription/list', function(err, response, body) {
		if (err) throw err;
		var subscriptions = body['subscriptions'];
		for (var i in subscriptions) {
			var sub = subscriptions[i];
			if (!(sub in self.callbacks)) {
				self.callbacks[sub] = undefined;
			}
		}
		console.log('list subscriptions');
		if (next) {
			next();
		}	
	});
};
plugin.prototype.subscribe = function(messages, next) {
	var self = this;
	var tasks = [];
	for (var message_name in messages) {
		(function(msg_nm) {
			var task = function(next) {
				self._post_data('plugin/subscribe', {
					message_name: msg_nm
				}, function(err, response, body) {
					next();
				});
			};
			tasks.push(task);
		})(message_name);
		this.callbacks[message_name] = messages[message_name];
	}
	flow.serial(self, tasks, next);
};
plugin.prototype.unsubscribe = function(message_names, next) {
	for (var i in message_names) {
		var message_name = message_names[i];
		if ((this.callbacks).indexOf(message_name) !== -1) {
			this._post_data('plugin/unsubscribe', {
				message_name: message_name
			}, next);
			delete this.callbacks[message_name];
		} 
	}
};
plugin.prototype.work = function(next) {
	var self = this;
	flow.serial(self, [
			function(next) {
				flow.serial(self, [
						self.pre_poll_messages,
						self._poll,
						self.post_poll_messages,
						self.pre_handle_transactions,
						self._handle_transactions,
						self.post_handle_transactions,
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
plugin.prototype.start = function() { 
	var self = this;
	this.loop = true;
	flow.serial(self, [
			self.connect,
			self.list_subscriptions,
			self.work
		]);	
};
plugin.prototype.stop = function() { 
	this.loop = false;
	this.disconnect();
};
plugin.prototype.isRunning = function() { 
	return this.connected; 
};
plugin.prototype.send_response = function(message_id, payload, next) {
	this._post_data('response', {
		message_id: message_id,
		payload: payload
	}, next);
};
plugin.prototype.pre_poll_messages = function(next) { 
	setTimeout(function() {
		console.log('pre_poll_messages');
		if (next) {
			next();
		}	
	}, 600);
};
plugin.prototype.post_poll_messages = function(next) { 
	setTimeout(function() {
		console.log('post_poll_messages');
		if (next) {
			next();
		}	
	}, 500);
};
plugin.prototype.pre_dispatch_messages = function(next) { 
	setTimeout(function() {
		console.log('pre_dispatch_messages');
		if (next) {
			next();
		}	
	}, 400);
};
plugin.prototype.post_dispatch_messages = function(next) { 
	setTimeout(function() {
		console.log('post_dispatch_messages');
		if (next) {
			next();
		}	
	}, 300);
};
plugin.prototype.pre_handle_transactions = function(next) { 
	setTimeout(function() {
		console.log('pre_handle_transactions');
		if (next) {
			next();
		}	
	}, 200); 
};
plugin.prototype.post_handle_transactions = function(next) { 
	setTimeout(function() {
		console.log('post_handle_transactions');
		if (next) {
			next();
		}	
	}, 100);
};
module.exports = plugin;