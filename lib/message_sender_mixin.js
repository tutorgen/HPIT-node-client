var utils = require('./utils');
utils = new utils;
var request_mixin = require('./request_mixin');
function message_sender_mixin() {
	_poll_responses = utils._poll_responses;
	_dispatch_responses = utils._dispatch_responses;
	this.send = function(message_name, payload, callback) {};
	this.send_transaction = function(payload, callback) {};
}

message_sender_mixin.prototype = new request_mixin;
module.exports = message_sender_mixin;