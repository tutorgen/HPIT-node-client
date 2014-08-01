var request = require('request');
var flow = require('./flow');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');
utils = new utils();

function request_mixin() {
	this.entity_id = "";
	this.api_key = "";
	this.ee = new EventEmitter();
	this.cookieJar = request.jar();
	this.cookie = undefined;
	this.connected = false;
}

request_mixin.prototype._post_data = function(path, data, callback) {
	this.cookie = this.cookieJar.getCookies(utils.HPIT_URL_ROOT)[0] || request.cookie('session=null');
	this.cookieJar.setCookie(this.cookie, utils.HPIT_URL_ROOT);
	var url = utils.HPIT_URL_ROOT + path;
	var options = {
		url: url,
		method: "POST",
		body: data,
		jar: this.cookieJar,
		json: true
	};
	request(options, callback);
};
	
request_mixin.prototype._get_data = function(path, callback) {
	this.cookie = this.cookieJar.getCookies(utils.HPIT_URL_ROOT)[0] || request.cookie('session=null');
	this.cookieJar.setCookie(this.cookie, utils.HPIT_URL_ROOT);
	var url = utils.HPIT_URL_ROOT + path;
	var options = {
		url: url,
		method: "GET",
		jar: this.cookieJar,
		json: true
	};
	request(options, callback);
};
	
request_mixin.prototype.connect = function(next) {
	var self = this;
	flow.serial(self, [
			self.pre_connect,
			function(next) {
				self._post_data('connect', {
					entity_id: self.entity_id,
					api_key: self.api_key
				}, function(err, response, body) {
					if (err) throw err;
					self.connected = true;
					console.log('connected to HPIT server');
					next();
				});
			},
			self.post_connect
		], next);
};
	
request_mixin.prototype.disconnect = function(next) {
	var self = this;
	flow.serial(self, [
			self.pre_disconnect,
			function(next) {
				self._post_data('disconnect', {
				entity_id: self.entity_id,
				api_key: self.api_key,
				}, function(err, response, body) {
					if (err) throw err;
					self.connected = false;
					console.log('disconnected from HPIT server');
					next();
				});
			},
			self.post_disconnect,
		], next);
};
	
request_mixin.prototype.send_log_entry = function(text, callback) {
	this._post_data('log', {
		log_entry: text
	}, callback);
};
request_mixin.prototype.pre_connect = function(next) { 
	setTimeout(function() {
		console.log('pre_connect');
		next();
	}, 300);
};
request_mixin.prototype.post_connect = function(next) { 
	setTimeout(function() {
		console.log('post_connect');
		next();
	}, 300);
};
request_mixin.prototype.pre_disconnect = function(next) { 
	setTimeout(function() {
		console.log('pre_disconnect');
		next();
	}, 300);
};
request_mixin.prototype.post_disconnect = function(next) { 
	setTimeout(function() {
		console.log('post_disconnect');
		next();
	}, 300);
};
module.exports = request_mixin;