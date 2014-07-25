var message_sender_mixin = require('./message_sender_mixin');
var EventEmitter = require('events').EventEmitter;
var flow = require('nimble');
var utils = require('./utils');
utils = new utils();

function plugin(entity_id, api_key, wildcard_callback) {
	
	this._poll = function(next) {
		self._get_data('plugin/message/list', function(err, response, body) {
			var messages = body['messages'];
			self.ee.once('_dispatch', function() {
				next();
			});
			self._dispatch(messages, '_dispatch');
			
		});
	};
	
	this._handle_transactions = function(next) {
		self._get_data('plugin/transaction/list', function(err, response, body) {
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
			tasks.push(function() {
				self.ee.emit('_handle_transactions');
			});
			self.ee.once('_handle_transactions', function() {
				console.log('sunjian2');
				next();
			});
			flow.series(tasks);	
		});
	};
	
	this._dispatch = function(message_data, nextOne) {
		var nextEvent = nextOne || null;
		var tasks = [];
		flow.series([
				self.pre_dispatch_messages,
				function(next) {
					for (var i in message_data) {
						var message_item = message_data[i];
						var message = message_item['message_name'];
						var payload = message_item['message'];
						payload['message_id'] = message_item['message_id'];
						payload['sender_entity_id'] = message_item['sender_entity_id'];
						if (self.callbacks[messsage]) {
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
					tasks.push(function() {
						self.ee.emit('_dispatch_1');
					});
					self.ee.once('_dispatch_1', function() {
						console.log('sunjian1');
						next();
					});
					flow.series(tasks);					
				},
				self.post_dispatch_messages,
				function(next) {
					self.ee.emit(nextEvent);
				}
			]);

	};

	this.register_transaction_callback = function(callback) {
		if (typeof(callback) != 'function') {
			return console.log('The callback submitted is not callable.')
		}
		self._post_data('plugin/subscribe', {
			message_name: 'transaction'
		});
		self.transaction_callback = callback;
	};
	this.clear_transaction_callback = function() {
		self._post_data('plugin/unsubscribe', {
			message_name: 'transaction'
		});
		self.transaction_callback = undefined;
	};
	this.list_subscriptions = function(nextOne) {
		var nextEvent = nextOne || null;
		self._get_data('plugin/subscription/list', function(err, response, body) {
			if (err) throw err;
			var subscriptions = body['subscriptions'];
			for (var i in subscriptions) {
				var sub = subscriptions[i];
				if (!(sub in self.callbacks)) {
					self.callbacks[sub] = undefined;
				}
			}
			console.log('list subscriptions');
			self.ee.emit(nextEvent);
		});
	};
	this.subscribe = function(messages) {
		for (var messsage_name in messages) {
			self._post_data('plugin/subscribe', {
				message_name: message_name
			});
			self.callbacks[message_name] = messages[message_name];
		}
	};
	this.unsubscribe = function(message_names) {
		for (var i in message_names) {
			var message_name = message_names[i];
			if ((self.callbacks).indexOf(message_name) !== -1) {
				self._post_data('plugin/unsubscribe', {
					message_name: message_name
				});
				delete self.callbacks[message_name];
			} 
		}
	};
	this.work = function(nextOne) {
		var nextEvent = nextOne || null;
		flow.series([
				function(next) {
					//self.pre_poll_messages
					self.ee.once('end', function() {
						next();
					});
					flow.series([
							self.pre_poll_messages,
							self._poll,
							self.post_poll_messages,
							self.pre_handle_transactions,
							self._handle_transactions,
							self.post_handle_transactions,
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
		self.connect('list_subscriptions');
		self.ee.once('list_subscriptions', function() {
			self.list_subscriptions('loop');
		});
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
	this.send_response = function(message_id, payload) {
		self._post_data('response', {
			message_id: message_id,
			payload: payload
		});
	};


	////////////////
	//initialization
	////////////////
	var self = this;
	this.entity_id = JSON.stringify(entity_id);
	this.api_key = JSON.stringify(api_key);
	this.wildcard_callback = wildcard_callback;
	this.transaction_callback = undefined;
	this.callbacks = {};
	this.poll_wait = 5000;
	this.pre_poll_messages = function(next) { 
		setTimeout(function() {
			console.log('pre_poll_messages');
			next();
		}, 600);
	};
	this.post_poll_messages = function(next) { 
		setTimeout(function() {
			console.log('post_poll_messages');
			next();
		}, 500);
	};
	this.pre_dispatch_messages = function(next) { 
		setTimeout(function() {
			console.log('pre_dispatch_messages');
			next();
		}, 400);
	};
	this.post_dispatch_messages = function(next) { 
		setTimeout(function() {
			console.log('post_dispatch_messages');
			next();
		}, 300);
	};
	this.pre_handle_transactions = function(next) { 
		setTimeout(function() {
			console.log('pre_handle_transactions');
			next();
		}, 200); 
	};
	this.post_handle_transactions = function(next) { 
		setTimeout(function() {
			console.log('post_handle_transactions');
			next();
		}, 100);
	};


}













plugin.prototype = new message_sender_mixin;
module.exports = plugin;