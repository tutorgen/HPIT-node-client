var message_sender_mixin = require('./message_sender_mixin');
var utils = require('./utils');
utils = new utils();

function plugin(entity_id, api_key, wildcard_callback) {
	this._poll = function(callback) {
		var list_message_url = utils.HPIT_URL_ROOT;
		(function(self) {
			self._get_data(list_message_url, callback);
		}(this));
	};
	this._handle_transactions = function() {
		var list_transaction_url = utils.HPIT_URL_ROOT;
		(function(self) {
			self._get_data(list_transaction_url, function(err, response, body) {
				var transaction_data = body['transactions'];
				for (var i in transaction_data) {
					var item = transaction_data[i];
					if (self.transaction_callback) {
						self.transaction_callback(item);
					}
				}
			});
		}(this));
		return true;
	};
	this._dispatch = function(message_data) {
		if (!this._try_hook('pre_dispatch_messages')) {
			return false;
		}
		for (var i in message_data) {
			var message_item = message_data[i];
			var message = message_item['message_name'];
			var payload = message_item['message'];
			payload['message_id'] = message_item['message_id'];
			payload['sender_entity_id'] = message_item['sender_entity_id'];
			if (this.callbacks[messsage]) {
				this.callbacks[messsage](payload);
			} else if (this.wildcard_callback){
				this.wildcard_callback(payload);
			} else {
				console.log('No callbacks available');
			}
		}
		if (!this._try_hook('post_dispatch_messages')) {
			return false;
		}
		return true;
	};
	this.post_connect = function() {};
	this.register_transaction_callback = function(callback) {};
	this.clear_transaction_callback = function() {};
	this.list_subscriptions = function() {};
	this.subscribe = function(messages) {};
	this.ubsubsribe = function(message_names) {};
	this.start = function() { running = true; console.log('plugin starts...'); };
	this.stop = function() { running = false; console.log('plugin stops...'); };
	this.isRunning = function() { return running; };
	this.send_response = function(message_id, payload) {};


	////////////////
	//initialization
	////////////////
	this.run_loop = true;
	this.entity_id = entity_id;
	this.api_key = api_key;
	this.wildcard_callback = wildcard_callback;
	this.transaction_callback = undefined;
	this.callbacks = {};
	this.poll_wait = 500;
	this.time_last_poll = undefined;
	this._add_hooks(['pre_poll_messages', 'post_poll_messages', 
					'pre_dispatch_messages', 'post_dispatch_messages',
					'pre_handle_transactions', 'post_handle_transactions']);
}

plugin.prototype = new message_sender_mixin;
module.exports = plugin;