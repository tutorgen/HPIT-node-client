var request_mixin = require('./request_mixin');
var flow = require('./flow');
var settings = require('./settings');

function message_sender_mixin(entity_id, api_key, err_cb) {
	request_mixin.call(this, entity_id, api_key, err_cb);
	this.response_callbacks = {};
}


message_sender_mixin.prototype = Object.create(request_mixin.prototype);
message_sender_mixin.prototype._poll_responses = function(next) {
	var self = this;
	this._get_data('response/list', function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		var responses = body['responses'];
		if (next) self._dispatch_responses(responses, next);
	});
};

message_sender_mixin.prototype._dispatch_responses = function(responses, next) {
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
message_sender_mixin.prototype.send = function(message_name, payload, callback, next) {
	/*
		message_name --> string
		payload --> string or dict
		callback --> undefined or a function
	*/
	if (typeof message_name !== 'string') {
		throw TypeError('message_id is not a string');
	}
	if (typeof payload !== 'string' && typeof payload !== 'object') {
		throw TypeError('payload is not a string or a dict object');
	}
	if (callback && typeof callback !== 'function') {
		throw TypeError('callback is not a function');
	}
	var self = this;
	if (message_name === "transaction") {
		throw Error("Cannot use message_name 'transaction'.  Use send_transaction() method for datashop transactions.");
	}
	this._post_data('message', {
		name: message_name,
		payload: payload
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		if (callback) {
			self.response_callbacks[body['message_id']] = callback;
		}
		if (next) next();	
	});
};
message_sender_mixin.prototype.send_transaction = function(payload, callback, next) {
	/*
		payload --> string or dict object
		callback --> undefined or function
	*/
	if (typeof payload !== 'string' && typeof payload !== 'object') {
		throw TypeError('payload is not a string or a dict object');
	}
	if (callback && typeof callback !== 'function') {
		throw TypeError('callback is not a function');
	}
	var self = this;
	this._post_data('transaction', {
		payload: payload
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		if (callback) {
			self.response_callbacks[body['message_id']] = callback;
		}
		if (next) next();	
	});
};
message_sender_mixin.prototype.pre_poll_responses = function(next) { 
	setTimeout(function() {
		console.log('pre_poll_responses');
		if (next) next();	
	}, 300);
};
message_sender_mixin.prototype.post_poll_responses = function(next) { 
	setTimeout(function() {
		console.log('post_poll_responses');
		if (next) next();	
	}, 300);
};
message_sender_mixin.prototype.pre_dispatch_responses = function(next) { 
	setTimeout(function() {
		console.log('pre_dispatch_responses');
		if (next) next();	
	}, 300);
};
message_sender_mixin.prototype.post_dispatch_responses = function(next) { 
	setTimeout(function() {
		console.log('post_dispatch_responses');
		if (next) next();	
	}, 300);
};
module.exports = message_sender_mixin;