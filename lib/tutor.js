var message_sender_mixin = require('./message_sender_mixin');
var time = require('time');
var utils = require('./utils');
utils = new utils();

function tutor(entity_id, api_key, callback, attrs) {
	this.start = function() { 
		this.run_loop = true;
		this.connect();
		while (this.run_loop) {
			var cur_time = time.time() * 1000;
			if (cur_time - this.time_last_poll < this.poll_wait) {
				continue;
			}
			this.time_last_poll = cur_time;
			if (!(this._try_hook('pre_poll_responses'))) {
				break;
			}
			(function(self) {
				this._poll_responses(function(err, response, body) {
					var responses = body['responses'];
					if (!(self._dispatch_responses(message_data))) {
						//return false;
					}
				});
			})(this);
			
			if (!(this._try_hook('post_poll_responses'))) {
				break;
			}
		}
		this.disconnect();
		console.log('tutor starts...'); 
	};
	this.stop = function() { 
		this.run_loop = false;
		console.log('tutor stops...'); 
	};
	this.isRunning = function() { 
		return this.connected; 
	};

	////////////////
	//initialization
	////////////////
	this.run_loop = true;
	this.entity_id = JSON.stringify(entity_id);
	this.api_key = JSON.stringify(api_key);
	this.callback = callback;
	this.poll_wait = 500;
	this.time_last_poll = time.time() * 1000;
	for (var key in attrs) {
		this[key] = attrs[key];
	}
}

tutor.prototype = new message_sender_mixin;
module.exports = tutor;