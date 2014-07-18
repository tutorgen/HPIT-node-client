var request_mixin = require('./request_mixin');
var utils = require('./utils');
utils = new utils();

function message_sender_mixin() {
	this._poll_response = function(callback) {
		var response_list_url = utils.HPIT_URL_ROOT;
		if (!this._try_hook('pre_poll_responses')) {
			return false;
		}
		this._get_data(response_list_url, callback);
		if (!this._try_hook('post_poll_responses')) {
			return false;
		}
	};
	this._dispatch_responses = function(responses) {
		if (!this._try_hook('pre_dispatch_responses')) {
			return false;
		}
		for (var i in responses) {
			var res = responses[i];
			var message_id = res['message']['message_id'];
			if (!message_id) {
				console.log('Invalid response from HPIT. No message id supplied in response');
			}
			var response_payload = res['response'];
			if (!response_payload) {
				console.log('Invalid response from HPIT. No response payload supplied');
			}
			if (!this.response_callbacks[message_id]) {
				console.log('No callback registered for message id: ' + message_id);
			}
		}
		if (!this._try_hook('post_dispatch_responses')) {
			return false;
		}
		return true;
	};
	this.send = function(message_name, payload, callback) {
		if (message_name === "transaction") {
			console.log("Cannot use message_name 'transaction'.  Use send_transaction() method for datashop transactions.");
		}
		message_url = utils.HPIT_URL_ROOT;
		(function(self) {
			self._post_data(message_url, {
				name: message_name,
				payload: payload
			}, function(err, response, body) {

				if (callback) {
					self.response_callbacks[body['message_id']] = callback;
				}
			});
		}(this));
	};
	this.send_transaction = function(payload, callback) {
		message_url = utils.HPIT_URL_ROOT;
		(function(self) {
			self._post_data(message_url, {
				payload: payload
			}, function(err, response, body) {

				if (callback) {
					self.response_callbacks[body['message_id']] = callback;
				}
			});
		}(this));
	};

	////////////////
	//initialization
	////////////////
	this.response_callbacks = {};
	this._add_hooks(['pre_poll_responses', 'post_poll_responses', 'pre_dispatch_responses', 'post_dispatch_responses']);
}

message_sender_mixin.prototype = new request_mixin;
module.exports = message_sender_mixin;