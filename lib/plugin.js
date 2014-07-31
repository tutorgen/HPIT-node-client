var message_sender_mixin = require('./message_sender_mixin');
var EventEmitter = require('events').EventEmitter;
var flow = require('./flow');
flow = new flow();
var utils = require('./utils');
utils = new utils();

function plugin(entity_id, api_key, wildcard_callback) {
	
	this._poll = function(next) {
		var self = this;
		this._get_data('plugin/message/list', function(err, response, body) {
			var messages = body['messages'];
			self._dispatch(messages, next);
			
		});
	};
	
	this._handle_transactions = function(next) {
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
	
	this._dispatch = function(message_data, next) {
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

	this.register_transaction_callback = function(callback) {
		if (typeof(callback) != 'function') {
			return console.log('The callback submitted is not callable.')
		}
		this._post_data('plugin/subscribe', {
			message_name: 'transaction'
		});
		this.transaction_callback = callback;
	};
	this.clear_transaction_callback = function() {
		this._post_data('plugin/unsubscribe', {
			message_name: 'transaction'
		});
		this.transaction_callback = undefined;
	};
	this.list_subscriptions = function(next) {
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
			next();
		});
	};
	this.subscribe = function(messages, next) {
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
	this.unsubscribe = function(message_names) {
		for (var i in message_names) {
			var message_name = message_names[i];
			if ((this.callbacks).indexOf(message_name) !== -1) {
				this._post_data('plugin/unsubscribe', {
					message_name: message_name
				});
				delete this.callbacks[message_name];
			} 
		}
	};
	this.work = function(next) {
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
					setTimeout(function() {
						self.ee.emit('loop');
					}, self.poll_wait);				
				}

			], next);	
	};
	this.start = function() { 
		var self = this;
		flow.serial(self, [
				self.connect,
				self.list_subscriptions,
				function(next) {
					self.work();
					self.ee.on('loop', function() {
						self.work();
					});
				}
			]);
		
	};
	this.stop = function() { 
		this.ee.removeAllListeners('loop');
		this.disconnect();
	};
	this.isRunning = function() { 
		return this.connected; 
	};
	this.send_response = function(message_id, payload) {
		this._post_data('response', {
			message_id: message_id,
			payload: payload
		});
	};


	////////////////
	//initialization
	////////////////
	this.entity_id = entity_id;
	this.api_key = api_key;
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