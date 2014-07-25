var request = require('request');
var flow = require('nimble');
var EventEmitter = require('events').EventEmitter;
var utils = require('./utils');
utils = new utils();

function request_mixin() {
	
	this._post_data = function(path, data, callback) {
		self.cookie = self.cookieJar.getCookies(utils.HPIT_URL_ROOT)[0] || request.cookie('session=null');
		self.cookieJar.setCookie(self.cookie, utils.HPIT_URL_ROOT);
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
	
	this._get_data = function(path, callback) {
		self.cookie = self.cookieJar.getCookies(utils.HPIT_URL_ROOT)[0] || request.cookie('session=null');
		self.cookieJar.setCookie(self.cookie, utils.HPIT_URL_ROOT);
		var url = utils.HPIT_URL_ROOT + path;
		var options = {
			url: url,
			method: "GET",
			jar: this.cookieJar,
			json: true
		};
		request(options, callback);
	};
	
	this.connect = function(nextOne) {
		var nextEvent = nextOne || null;
		flow.series([
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
				self.post_connect,
				function(next) {
					self.ee.emit(nextEvent);
					next();
				}
			]);

	};
	
	this.disconnect = function(nextOne) {
		var nextEvent = nextOne || null;
		flow.series([
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
				function(next) {
					self.ee.emit(nextEvent);
					next();
				}
			]);
		
	};
	
	this.send_log_entry = function(text, callback) {
		self._post_data('log', {
			log_entry: text
		}, callback);
	};
	
	/////////////////
	//initialization
	/////////////////
	var self = this;
	this.entity_id = "";
	this.api_key = "";
	this.ee = new EventEmitter();
	this.cookieJar = request.jar();
	this.cookie = undefined;
	this.connected = false;
	this.pre_connect = function(next) { 
		setTimeout(function() {
			console.log('pre_connect');
			next();
		}, 300);
	};
	this.post_connect = function(next) { 
		setTimeout(function() {
			console.log('post_connect');
			next();
		}, 300);
	};
	this.pre_disconnect = function(next) { 
		setTimeout(function() {
			console.log('pre_disconnect');
			next();
		}, 300);
	};
	this.post_disconnect = function(next) { 
		setTimeout(function() {
			console.log('post_disconnect');
			next();
		}, 300);
	};
}

module.exports = request_mixin;