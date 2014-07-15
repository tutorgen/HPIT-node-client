var message_sender_mixin = require('./message_sender_mixin');
var utils = require('./utils')();
function plugin() {
	var _poll = utils._poll;
	var _handle_transaction = utils._handle_transaction;
	var _dispatch = utils._dispatch;
	var running = false;
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
}

plugin.prototype = new message_sender_mixin;
module.exports = plugin;