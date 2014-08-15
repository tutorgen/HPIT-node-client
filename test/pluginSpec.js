var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
chai.use(sinonChai);
var expect = chai.expect;
var nock = require('nock');
var plugin = require('../lib/plugin');
var message_sender_mixin = require('../lib/message_sender_mixin');
var settings = require('../lib/settings');
var flow = require('../lib/flow');


describe("Plugin", function() {
	var entity_id = 'fdsaf';
	var api_key = 'fafd';
	var err_cb = function(err, status) {
		if (err) throw err;
		if (status !== 200) {
			throw Error(status + " error");
		}
	}
	var options = {
		wildcard_callback: function(payload, next) {
			if (next) next();
		}
	};
	var results = new plugin(entity_id, api_key, err_cb, options);
	describe("#plugin()", function() {
		it("should throw TypeError if entity_id is not a string", function() {
			expect(function() { plugin(123, 'sfd', function() {}); }).to.throw(TypeError);
		});
		it("should throw TypeError if api_key is not a string", function() {
			expect(function() { plugin('afd', 123, function() {}); }).to.throw(TypeError);
		});
		it("should throw TypeError if err_cb is not a function", function() {
			expect(function() { plugin('fdas', 'sfd', 123); }).to.throw(TypeError);
		});
		it("should throw TypeError if options is not a dict object", function() {
			expect(function() { plugin('fdas', 'sfd', function(){}, 123); }).to.throw(TypeError);
		});

		sinon.spy(message_sender_mixin, 'call');
		it("should create an object with expected properties", function() {		
			var results = new plugin(entity_id, api_key, err_cb, options);
			expect(message_sender_mixin.call).to.have.been.calledWith(results, entity_id, api_key, err_cb);
			expect(results).to.have.a.property('wildcard_callback');
			expect(results).to.have.a.property('callbacks');
			expect(results).to.have.a.property('poll_wait');
			expect(results).to.have.a.property('loop');
			expect(results).to.have.a.property('__proto__');

			var proto = results.__proto__;
			expect(proto).to.have.a.property('_poll');
			expect(proto).to.have.a.property('_handle_transactions');
			expect(proto).to.have.a.property('_dispatch');
			expect(proto).to.have.a.property('_dispatch_messages');
			expect(proto).to.have.a.property('register_transaction_callback');
			expect(proto).to.have.a.property('clear_transaction_callback');
			expect(proto).to.have.a.property('list_subscriptions');
			expect(proto).to.have.a.property('subscribe');
			expect(proto).to.have.a.property('unsubscribe');
			expect(proto).to.have.a.property('work');
			expect(proto).to.have.a.property('start');
			expect(proto).to.have.a.property('stop');
			expect(proto).to.have.a.property('isRunning');
			expect(proto).to.have.a.property('send_response');
			expect(proto).to.have.a.property('pre_poll_messages');
			expect(proto).to.have.a.property('post_poll_messages');
			expect(proto).to.have.a.property('pre_dispatch_messages');
			expect(proto).to.have.a.property('post_dispatch_messages');
			expect(proto).to.have.a.property('pre_handle_transactions');
			expect(proto).to.have.a.property('post_handle_transactions');
			expect(proto).to.have.a.property('__proto__');

			var proto1 = proto.__proto__;
			expect(proto1).to.equal(message_sender_mixin.prototype);
		});
	});

	describe("#_poll()", function() {
		it("should throw a TypeError if next is not a function", function() {
			expect(function() { results._poll(123); }).to.throw(TypeError);
		});
		
		it("done should be called, err_cb should be called with 200", function(done) {
			var path = '/plugin/message/list';
			var data = {
				messages: []
			};
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			sinon.spy(results, 'err_cb');
			results._poll(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				done();
			});
		});
	});
	
	describe("#_handle_transactions()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results._handle_transactions(123); }).to.throw(TypeError);
		});
		
		it("err_cb should be called with 200, transaction_callback should be called", function(done) {
			var path = '/plugin/transaction/list';
			var data = {
				transactions: ['i', 'made', 'it']
			};
			results.transaction_callback = function(item, next) {
				if (next) next();
			};
			sinon.spy(results, 'transaction_callback');
			//results.err_cb = sinon.spy();
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			results._handle_transactions(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.transaction_callback).to.have.been.calledWith('i');
				expect(results.transaction_callback).to.have.been.calledWith('made');
				expect(results.transaction_callback).to.have.been.calledWith('it');
				done();
			});
		});

		
		it("err_cb should be called with 200, transaction_callback is not called", function(done) {
			results.transaction_callback = null;
			var path = '/plugin/transaction/list';
			var data = {
				transactions: ['i', 'made', 'it']
			};
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			results._handle_transactions(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(console.log).to.have.been.calledWith('No transactions callbacks available');
				done();
			});
		});
	});

	describe("#_dispatch()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results._dispatch([], 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if messages is not an array", function() {
			expect(function() { results._dispatch(12); }).to.throw(TypeError);
		});
		it("a bunch of methods should be called in order if messages of the right type are provided", function(done) {
			results.wildcard_callback = null;
			sinon.spy(results, 'pre_dispatch_messages');
			sinon.spy(results, '_dispatch_messages');
			sinon.spy(results, 'post_dispatch_messages');
			var messages = [{
				message_name: 'fasd',
				message: 'fdsf',
				message_id: 'fads',
				sender_entity_id: 'fsad'
			}];
			results._dispatch(messages, function() {
				expect(results.pre_dispatch_messages).to.have.been.calledBefore(results._dispatch_messages);
				expect(results._dispatch_messages).to.have.been.calledBefore(results.post_dispatch_messages);
				expect(results.post_dispatch_messages).to.have.been.called;
				expect(results._dispatch_messages).to.have.been.calledWith(messages);
				done();
			});
			
		});
	});

	describe("#_dispatch_messages()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results._dispatch_messages([], 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if messages is not an array", function() {
			expect(function() { results._dispatch_messages(12); }).to.throw(TypeError);
		});

		it("results.callbacks should be called if messages of the right type are provided", function(done) {
			var messages = [{
				message_name: 'greeting',
				message: {},
				message_id: 'fas',
				sender_entity_id: 'fdsaf',
			}];
			var callback = function(payload, next) {
				console.log('payload');
				if (next) next();
			};
			results.callbacks = {'greeting': callback};
			sinon.spy(results.callbacks, 'greeting'); 			
			results._dispatch_messages(messages, function() {
				expect(results.callbacks['greeting']).to.have.been.calledWith({message_id: 'fas', sender_entity_id: 'fdsaf'});
				done();
			});	
		});

		it("results.wildcard_callback should be called if messages of the right type are provided", function(done) {
			results.callbacks = {};
			var messages = [{
				message_name: 'greeting',
				message: {},
				message_id: 'fas',
				sender_entity_id: 'fdsaf',
			}];
			var callback = function(payload, next) {
				console.log('payloa');
				if (next) next();
			};
			results.wildcard_callback = callback; 	
			sinon.spy(results, 'wildcard_callback');		
			results._dispatch_messages(messages, function() {
				expect(results.wildcard_callback).to.have.been.calledWith({message_id: 'fas', sender_entity_id: 'fdsaf'});
				done();
			});	
		});
		it("console.log should be called if messages of the right type are provided", function(done) {
			results.wildcard_callback = null;
			results.callbacks = {};
			var messages = [{
				message_name: 'greeting',
				message: {},
				message_id: 'fas',
				sender_entity_id: 'fdsaf',
			}];
			results._dispatch_messages(messages, function() {
				expect(console.log).to.have.been.calledWith('No callbacks available');
				done();
			});	
		});
	});

	describe("#register_transaction_callback()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.register_transaction_callback(function() {}, 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if callback is not a function", function() {
			expect(function() { results.register_transaction_callback(123); }).to.throw(TypeError);
		});

		it("err_cb should be called with 200 and results.transaction_callback should be assigned", function(done) {
			var path = '/plugin/subscribe';
			var data = {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			var callback = function() {};
			//sinon.spy(results, 'err_cb');
			results.register_transaction_callback(callback, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.transaction_callback).to.equal(callback);
				done();
			});
		});
	});

	describe("#clear_transaction_callback()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.clear_transaction_callback(123); }).to.throw(TypeError);
		});
		
		it("err_cb should be called with 200 and results.transaction_callback should be assigned to undefined", function(done) {
			var path = '/plugin/unsubscribe';
			var data = {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			//sinon.spy(results, 'err_cb');
			results.clear_transaction_callback(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.transaction_callback).to.equal(undefined);
				done();
			});
		});
	});

	describe("#list_subscriptions()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.list_subscriptions(123); }).to.throw(TypeError);
		});
		
		it("err_cb should be called with 200", function(done) {
			var path = '/plugin/subscription/list';
			var data = {
				subscriptions: ['yesterday', 'today', 'tomorrow']
			};
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			//sinon.spy(results, 'err_cb');
			results.list_subscriptions(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.callbacks).to.have.a.property('yesterday', null);
				expect(results.callbacks).to.have.a.property('today', null);
				expect(results.callbacks).to.have.a.property('tomorrow', null);
				expect(console.log).to.have.been.calledWith('list subscriptions');
				done();
			});
		});
	});

	describe("#subscribe()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.subscribe({}, 123); }).to.throw(TypeError);
		});
		
		it("should throw a TypeError if messages is not a dict object", function() {
			expect(function() { results.subscribe(123); }).to.throw(TypeError);
		});

		it("should throw a TypeError if messages's values are not functions", function() {
			var messages = {
				i: 'first'
			};
			expect(function() { results.subscribe(messages); }).to.throw(TypeError);
		});

		it("err_cb should be called with 200 and results.callbacks should be assigned", function(done) {
			var path = '/plugin/subscribe';
			var data = {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			var callback = function() {};
			var messages = {
				i: callback
			};
			//sinon.spy(results, 'err_cb');
			results.subscribe(messages, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.callbacks).to.have.a.property('i', callback);
				done();
			});
		});
	});

	describe("#unsubscribe()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.subscribe(['afdsa'], 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if message_names is not a []", function() {
			expect(function() { results.unsubscribe(123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if message_names' values are not strings", function() {
			expect(function() { results.unsubscribe([1, 2]); }).to.throw(TypeError);
		});
		
		it("should call results.err_cb with 200 and unsubscribe successfully", function(done) {
			var path = '/plugin/unsubscribe';
			var data = {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			results.callbacks = {
				i: function() {}
			};
			var message_names = ['i'];
			//sinon.spy(results, 'err_cb');
			results.unsubscribe(message_names, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.callbacks).to.not.have.a.property('i');
				done();
			});
		});
	});

	describe("#work()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.work(123); }).to.throw(TypeError);
		});
		it("should call a bunch of methods multiple times", function(done) {
			this.timeout(50000);
			var pass = function(next) {
				if(next) next();
			}
			setTimeout(function() {
				results.loop = false;
			}, 10000);
			results.pre_poll_messages = sinon.spy(pass);
			results._poll = sinon.spy(pass);
			results.post_poll_messages = sinon.spy(pass);
			results.pre_handle_transactions = sinon.spy(pass);
			results._handle_transactions = sinon.spy(pass);
			results.post_handle_transactions = sinon.spy(pass);
			results.pre_poll_responses = sinon.spy(pass);
			results._poll_responses = sinon.spy(pass);
			results.post_poll_responses = sinon.spy(pass);
			results.work(function() {
				expect(results.pre_poll_messages).to.have.been.calledBefore(results._poll);
				expect(results._poll).to.have.been.calledBefore(results.post_poll_messages);
				expect(results.post_poll_messages).to.have.been.calledBefore(results.pre_handle_transactions);
				expect(results.pre_handle_transactions).to.have.been.calledBefore(results._handle_transactions);
				expect(results._handle_transactions).to.have.been.calledBefore(results.post_handle_transactions);
				expect(results.post_handle_transactions).to.have.been.calledBefore(results.pre_poll_responses);
				expect(results.pre_poll_responses).to.have.been.calledBefore(results._poll_responses);
				expect(results._poll_responses).to.have.been.calledBefore(results.post_poll_responses);
				expect(results.post_poll_responses).to.have.been.called;
				done();
			});
		});
	});

	describe("#start()", function() {
		it("results.loop should be set true and a bunch of methods are called", function() {
			var pass = function(next) {
				if(next) next();
			}
			results.pre_connect = sinon.spy(pass);
			results.connect = sinon.spy(pass);
			results.post_connect = sinon.spy(pass);
			results.list_subscriptions = sinon.spy(pass);
			results.work = sinon.spy(pass);
			results.start();
			expect(results.loop).to.equal(true);
			expect(results.pre_connect).to.have.been.calledBefore(results.connect);
			expect(results.connect).to.have.been.calledBefore(results.post_connect);
			expect(results.post_connect).to.have.been.calledBefore(results.list_subscriptions);
			expect(results.list_subscriptions).to.have.been.calledBefore(results.work);
			expect(results.work).to.have.been.called;
		});
	});

	describe("#stop()", function() {
		it("results.loop should be set false and a bunch of methods are called", function() {
			var pass = function(next) {
				if(next) next();
			}
			results.pre_disconnect = sinon.spy(pass);
			results.disconnect = sinon.spy(pass);
			results.post_disconnect = sinon.spy(pass);
			results.stop();
			expect(results.loop).to.equal(false);
			expect(results.pre_disconnect).to.have.been.calledBefore(results.disconnect);
			expect(results.disconnect).to.have.been.calledBefore(results.post_disconnect);
			expect(results.post_disconnect).to.have.been.called;
		});
	});

	describe("#isRunning()", function() {
		it("should always return results.connected", function() {
			expect(results.isRunning()).to.equal(results.connected);
		});
	});

	describe("#send_response()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.send_response('fsda', {}, 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if message_id is not a string", function() {
			expect(function() { results.send_response(123, {}); }).to.throw(TypeError);
		});
		it("should throw a TypeError if payload is not a dict object", function() {
			expect(function() { results.send_response('fdsa', 123); }).to.throw(TypeError);
		});
		
		it("should call err_cb with 200", function(done) {
			var path = '/response';
			var data = {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			//sinon.spy(results, 'err_cb');
			results.send_response('fsad', {}, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				done();
			});
		});
	});

	describe("#pre_poll_messages()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.pre_poll_messages(123); }).to.throw(TypeError);
		});
		sinon.spy(console, 'log');
		it("done should be called", function(done) {
			
			results.pre_poll_messages(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
	describe("#post_poll_messages()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.post_poll_messages(123); }).to.throw(TypeError);
		});
		it("done should be called", function(done) {
			results.post_poll_messages(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
	describe("#pre_dispatch_messages()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.pre_dispatch_messages(123); }).to.throw(TypeError);
		});
		it("done should be called", function(done) {
			results.pre_dispatch_messages(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
	describe("#post_dispatch_messages()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.post_dispatch_messages(123); }).to.throw(TypeError);
		});
		it("done should be called", function(done) {
			results.post_dispatch_messages(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
	describe("#pre_handle_transactions()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.pre_handle_transactions(123); }).to.throw(TypeError);
		});
		it("done should be called", function(done) {
			results.pre_handle_transactions(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
	describe("#post_handle_transactions()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results.post_handle_transactions(123); }).to.throw(TypeError);
		});
		it("done should be called", function(done) {
			results.post_handle_transactions(function() {
				expect(console.log).to.have.been.called;
				done();
			});
		});
	});
});









