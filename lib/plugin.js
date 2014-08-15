var message_sender_mixin = require('./message_sender_mixin');
var EventEmitter = require('events').EventEmitter;
var flow = require('./flow');
var settings = require('./settings');

function plugin(entity_id, api_key, err_cb, options) {
	/* 
		entity_id --> string
	   	api_key --> string 
	   	err_cb --> function
	   	options --> object(dict)
	*/
	if (entity_id && typeof entity_id !== 'string') {
		throw TypeError('entity_id is not a string');
	}
	if (api_key && typeof api_key !== 'string') {
		throw TypeError('api_key is not a string');
	}
	if (err_cb && typeof err_cb !== 'function') {
		throw TypeError('err_cb is not a function');
	}
	options = options || {};
	if (typeof options !== 'object') {
		throw TypeError('options is not a dict object');
	}
	
	message_sender_mixin.call(this, entity_id, api_key, err_cb);
	this.wildcard_callback = options.wildcard_callback;
	this.transaction_callback = null;
	this.callbacks = {};
	this.poll_wait = options.poll_wait || 5000;
	this.loop = true;
}


plugin.prototype = Object.create(message_sender_mixin.prototype);
plugin.prototype._poll = function(next) {
	/*
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	var self = this;
	this._get_data('/plugin/message/list', function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		var messages = body['messages'];
		if (next) self._dispatch(messages, next);		
	});
};
	
plugin.prototype._handle_transactions = function(next) {
	/*
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	var self = this;
	this._get_data('/plugin/transaction/list', function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		var transaction_data = body['transactions'];
		var tasks = [];
		for (var i = 0, n = transaction_data.length; i < n; i++) {
			var item = transaction_data[i];
			if (self.transaction_callback) {
				(function(itm) {
					var task = function(next) {
						self.transaction_callback(itm, next);
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

plugin.prototype._dispatch = function(messages, next) {
	/*
		messages-->[]
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	if (toString.call(messages) !== '[object Array]') {
		throw TypeError('messages is not an array');
	}
	if (messages) {
		var self = this;
		flow.serial(self, [
				self.pre_dispatch_messages,
				function(next) {
					self._dispatch_messages(messages, next);
				},
				self.post_dispatch_messages
			], next);
	} else {
		if (next) next();
	}
};
plugin.prototype._dispatch_messages = function(messages, next) {
	/*
		messages-->[]
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	if (toString.call(messages) !== '[object Array]') {
		throw TypeError('messages is not an array');
	}
	var tasks = [];
	var self = this;
	for (var i in messages) {
		var message_item = messages[i];
		var message = message_item['message_name'];
		var payload = message_item['message'];
		payload['message_id'] = message_item['message_id'];
		payload['sender_entity_id'] = message_item['sender_entity_id'];
		if (self.callbacks[message]) {
			(function(m, p) {
				var task = function(next) {
					self.callbacks[m](p, next);
				};
				tasks.push(task);
			})(message, payload);
			
		} else if (self.wildcard_callback){
			(function(p) {
				var task = function(next) {
					self.wildcard_callback(p, next);
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
};

plugin.prototype.register_transaction_callback = function(callback, next) {
	/* 
		callback --> function
		next --> function
	*/
	var self = this;
	if (typeof callback !== 'function') {
		throw TypeError('callback is not a function');
	}
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	this._post_data('/plugin/subscribe', {
		message_name: 'transaction'
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		self.transaction_callback = callback;
		if (next) next();
	});	
};
plugin.prototype.clear_transaction_callback = function(next) {
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	var self = this;
	this._post_data('/plugin/unsubscribe', {
		message_name: 'transaction'
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		self.transaction_callback = undefined;
		if (next) next();
	});
};
plugin.prototype.list_subscriptions = function(next) {
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	var self = this;
	this._get_data('/plugin/subscription/list', function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		var subscriptions = body['subscriptions'];
		for (var i in subscriptions) {
			var sub = subscriptions[i];
			if (!(sub in self.callbacks)) {
				self.callbacks[sub] = null;
			}
		}
		console.log('list subscriptions');
		if (next) next();
	});
};
plugin.prototype.subscribe = function(messages, next) {
	/*	
		messages --> {}
		next --> function
	*/
	if (typeof messages !== 'object') {
		throw TypeError('messages is not a dict object');
	}
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	var self = this;
	var tasks = [];
	for (var message_name in messages) {
		if (typeof messages[message_name] !== 'function') {
			throw TypeError('value should be a function');
		}
		(function(mn) {
			var task = function(next) {
				self._post_data('/plugin/subscribe', {
					message_name: mn
				}, function(err, response, body) {
					response = response || {};
					self.err_cb(err, response.statusCode);
					self.callbacks[mn] = messages[mn];
					if (next) next();
				});
			};
			tasks.push(task);

		})(message_name);
				
	}
	flow.serial(self, tasks, next);
};
plugin.prototype.unsubscribe = function(message_names, next) {
	/* 
		message_names --> [] of strings
		next --> function
	*/
	var self = this;
	var tasks = [];
	if (toString.call(message_names) !== '[object Array]') {
		throw TypeError('message_names is not an array');
	}
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	for (var i in message_names) {
		var message_name = message_names[i];
		if (typeof message_names[i] !== 'string') {
			throw TypeError('value should be a string');
		}
		if (message_name in this.callbacks) {
			(function(mn) {
				var task = function(next) {
					self._post_data('/plugin/unsubscribe', {
						message_name: mn
					}, function(err, response, body) {
						response = response || {};
						self.err_cb(err, response.statusCode);
						delete self.callbacks[mn];
						if (next) next();
					});
				}	
				tasks.push(task);	
			})(message_name);
			
		} 
	}
	flow.serial(self, tasks, next);
};
plugin.prototype.work = function(next) {
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
plugin.prototype.start = function() { 
	var self = this;
	this.loop = true;
	flow.serial(self, [
			self.pre_connect,
			self.connect,
			self.post_connect,
			self.list_subscriptions,
			self.work
		]);	
};
plugin.prototype.stop = function() { 
	this.loop = false;
	var self = this;
	flow.serial(self, [
			self.pre_disconnect,
			self.disconnect,
			self.post_disconnect
		]);
};
plugin.prototype.isRunning = function() { 
	return this.connected; 
};
plugin.prototype.send_response = function(message_id, payload, next) {
	/* 
		message_id --> string
		payload --> {}
		next --> function
	*/
	var self = this;
	if (typeof message_id !== 'string') {
		throw TypeError('message_id is not a string');
	}
	if (typeof payload !== 'object') {
		throw TypeError('payload is not a dict object');
	}
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	this._post_data('/response', {
		message_id: message_id,
		payload: payload
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		if (next) next();
	});
};
plugin.prototype.pre_poll_messages = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('pre_poll_messages');
		if (next) next();	
	}, 600);
};
plugin.prototype.post_poll_messages = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('post_poll_messages');
		if (next) next();
	}, 500);
};
plugin.prototype.pre_dispatch_messages = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('pre_dispatch_messages');
		if (next) next();	
	}, 400);
};
plugin.prototype.post_dispatch_messages = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('post_dispatch_messages');
		if (next) next();
	}, 300);
};
plugin.prototype.pre_handle_transactions = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('pre_handle_transactions');
		if (next) next();
	}, 200); 
};
plugin.prototype.post_handle_transactions = function(next) { 
	/* 
		next --> function
	*/
	if (next && typeof next !== 'function') {
		throw TypeError('next is not a function');
	}
	setTimeout(function() {
		console.log('post_handle_transactions');
		if (next) next();	
	}, 100);
};
module.exports = plugin;