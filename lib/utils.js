var request = require('request');
function utils() {
	this._post_data = function(url, data) {
		var options = {
			url: url,
			method: "POST",
			body: data,
			json: true
		};
		request(options, function(err, response, body) {
			console.log(err);
			//console.log(response);
			console.log(body);
		});
	};
	this._get_data = function(url) {
		request(url, function(err, response, body) {
			console.log(body);
		});
	};
	this._add_hooks = function(self, hooks) {
		//hooks is a list
		for (hook in hooks) {
			if (!(hooks[hook] in self)) {
				self[hooks[hook]] = undefined;
				console.log('haha');
			} 
			
		}
	};
	this._try_hook = function(self, hook_name) {
		hook = self[hook_name];
		if (hook) {
			return hook();
		}
		return true;
	};
	this._poll_response = function() {};
	this._dispatch_responses = function(responses) {};
	this._poll = function() {};
	this._handle_transactions = function() {};
	this._dispatch = function(message_data) {};

}

module.exports = utils;