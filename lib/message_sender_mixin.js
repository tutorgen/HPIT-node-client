var request_mixin = require('./request_mixin');
var flow = require('./flow');
flow = new flow();
var utils = require('./utils');
utils = new utils();

function message_sender_mixin() {
	this._poll_responses = function(next) {
		var self = this;
		this._get_data('response/list', function(err, response, body) {
			var responses = body['responses'];
			self._dispatch_responses(responses, next);
		});

	};

	this._dispatch_responses = function(responses, next) {
		var self = this;
		var tasks = [];
		flow.serial(self, [
			self.pre_dispatch_responses,
			function(next) {
				for (var i in responses) {
					var res = responses[i];
					var message_id = res['message']['message_id'];
					if (!message_id) {
						console.log('Invalid response from HPIT. No message id supplied in response');
						continue;
					}
					var response_payload = res['response'];
					if (!response_payload) {
						console.log('Invalid response from HPIT. No response payload supplied');
						continue;
					}
					if (!self.response_callbacks[message_id]) {
						console.log('No callback registered for message id: ' + message_id);
					} else {
						(function(msg_id, res_pld) {
							var task = function(next) {
								self.response_callbacks[msg_id](res_pld, next);
							};
							tasks.push(task);
						})(message_id, response_payload);
					}
				}
				flow.serial(self, tasks, next);				
			},
			self.post_dispatch_responses,
		], next);
	};
	this.send = function(message_name, payload, callback) {
		var self = this;
		if (message_name === "transaction") {
			console.log("Cannot use message_name 'transaction'.  Use send_transaction() method for datashop transactions.");
		}
		this._post_data('message', {
			name: message_name,
			payload: payload
		}, function(err, response, body) {
			if (callback) {
				self.response_callbacks[body['message_id']] = callback;
			}
		});
	};
	this.send_transaction = function(payload, callback) {
		var self = this;
		this._post_data('transaction', {
			payload: payload
		}, function(err, response, body) {
			if (callback) {
				self.response_callbacks[body['message_id']] = callback;
			}
		});
	};

	////////////////
	//initialization
	////////////////
	this.response_callbacks = {};
	this.pre_poll_responses = function(next) { 
		setTimeout(function() {
			console.log('pre_poll_responses');
			next();
		}, 300);
	};
	this.post_poll_responses = function(next) { 
		setTimeout(function() {
			console.log('post_poll_responses');
			next();
		}, 300);
	};
	this.pre_dispatch_responses = function(next) { 
		setTimeout(function() {
			console.log('pre_dispatch_responses');
			next();
		}, 300);
	};
	this.post_dispatch_responses = function(next) { 
		setTimeout(function() {
			console.log('post_dispatch_responses');
			next();
		}, 300);
	};
}


message_sender_mixin.prototype = new request_mixin;
module.exports = message_sender_mixin;