var request = require('request');
var flow = require('./flow');
var settings = require('./settings');

function request_mixin(entity_id, api_key, err_cb) {
	this.entity_id = entity_id;
	this.api_key = api_key;
	this.cookieJar = request.jar();
	this.cookie = null;
	this.connected = false;
	this.err_cb = err_cb || (function(err, status) {
		if (err) throw err;
		if (status !== 200) {
			throw Error(status + " error");
		}
	});
}

request_mixin.prototype._post_data = function(path, data, callback) {
	this.cookie = this.cookieJar.getCookies(settings.HPIT_URL_ROOT)[0] || request.cookie('session=null');
	this.cookieJar.setCookie(this.cookie, settings.HPIT_URL_ROOT);
	var url = settings.HPIT_URL_ROOT + path;
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
	this.cookie = this.cookieJar.getCookies(settings.HPIT_URL_ROOT)[0] || request.cookie('session=null');
	this.cookieJar.setCookie(this.cookie, settings.HPIT_URL_ROOT);
	var url = settings.HPIT_URL_ROOT + path;
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
	self._post_data('/connect', {
		entity_id: self.entity_id,
		api_key: self.api_key
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		self.connected = true;
		console.log('connected to HPIT server');
		if (next) next();
	});
}
	
request_mixin.prototype.disconnect = function(next) {
	var self = this;
	self._post_data('/disconnect', {
		entity_id: self.entity_id,
		api_key: self.api_key,
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		self.connected = false;
		console.log('disconnected from HPIT server');
		if (next) next();
	});
};
	
request_mixin.prototype.send_log_entry = function(text, next) {
	/*
		text --> string
	*/
	var self = this;
	if (typeof text !== 'string') {
		throw TypeError('text is not a string');
	}
	this._post_data('/log', {
		log_entry: text
	}, function(err, response, body) {
		response = response || {};
		self.err_cb(err, response.statusCode);
		if (next) next();
	});
};
request_mixin.prototype.pre_connect = function(next) { 
	setTimeout(function() {
		console.log('pre_connect');
		if (next) next();		
	}, 300);
};
request_mixin.prototype.post_connect = function(next) { 
	setTimeout(function() {
		console.log('post_connect');
		if (next) next();
	}, 300);
};
request_mixin.prototype.pre_disconnect = function(next) { 
	setTimeout(function() {
		console.log('pre_disconnect');
		if (next) next();
	}, 300);
};
request_mixin.prototype.post_disconnect = function(next) { 
	setTimeout(function() {
		console.log('post_disconnect');
		if (next) next();	
	}, 300);
};
module.exports = request_mixin;