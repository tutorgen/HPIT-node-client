var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
chai.use(sinonChai);
var expect = chai.expect;
var nock = require('nock');
var message_sender_mixin = require('../lib/message_sender_mixin');
var request_mixin = require('../lib/request_mixin');
var settings = require('../lib/settings');
var flow = require('../lib/flow');


describe("Message_sender_mixin", function() {
	var entity_id = 'fdsaf';
	var api_key = 'fafd';
	var err_cb = function(err, status) {
		if (err) throw err;
		if (status !== 200) {
			throw Error(status + " error");
		}
	};
	var results = new message_sender_mixin(entity_id, api_key, err_cb);
	describe("#message_sender_mixin()", function() {
		it("should create an object with expected properties", function() {	
			sinon.spy(request_mixin, 'call');
			var result = new message_sender_mixin(entity_id, api_key, err_cb);
			expect(request_mixin.call).to.have.been.calledWith(result, entity_id, api_key, err_cb);
			expect(results.response_callbacks).to.be.a('object')
			expect(results).to.have.a.property("__proto__");

			var proto = results.__proto__;
			expect(proto).to.have.a.property("_poll_responses");
			expect(proto).to.have.a.property("_dispatch_responses");
			expect(proto).to.have.a.property("send");
			expect(proto).to.have.a.property("send_transaction");
			expect(proto).to.have.a.property("__proto__");


			var proto1 = proto.__proto__;
			expect(proto1).to.equal(request_mixin.prototype);
		});
	});
	
	describe("#_poll_responses()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results._poll_responses(123); }).to.throw(TypeError);
		});
		it("err_cb should be called with 200, done should be called", function(done) {
			var path = '/response/list';
			var data = {
				responses: []
			};
			sinon.spy(results, 'err_cb');
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			results._poll_responses(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				done();
			});
		});
	});

	describe("#_dispatch_responses()", function() {
		it("should throw a TypeError if next is not a function", function() {		
			expect(function() { results._dispatch_responses([], 123); }).to.throw(TypeError);
		});
		it("should throw a TypeError if responses is not an array", function() {		
			expect(function() { results._dispatch_responses(123); }).to.throw(TypeError);
		});
		it("should call err_cb with a TypeError if message_id is not contained in responses", function(done) {		
			var responses = [{
				message: {

				}
			}];
			results.err_cb = sinon.spy();
			results._dispatch_responses(responses, function() {
				expect(results.err_cb).to.have.been.calledWith(new TypeError('Invalid response from HPIT. No message id supplied in response'));
				done();
			});
		});

		it("should call err_cb with a TypeError if response_payload is not contained in responses", function(done) {		
			var responses = [{
				message: {
					message_id: 'fad'
				}
			}];
			results.err_cb = sinon.spy();
			//sinon.spy(console, 'log');
			results._dispatch_responses(responses, function() {
				expect(results.err_cb).to.have.been.calledWith(new TypeError('Invalid response from HPIT. No response payload supplied'));
				expect(console.log).to.have.been.calledWith('No callback registered for message id: fad');
				done();
			});
		});

		it("should call response_callbacks if they are available", function(done) {		
			var a = {};
			a.callback = function(payload, next) {
				console.log('english');
				if (next) next();
			};
			sinon.spy(a, 'callback');
			results.response_callbacks = {
				'fad': a.callback
			};
			var responses = [{
				message: {
					message_id: 'fad'
				},
				response: 'fasdf'
			}];		
			results._dispatch_responses(responses, function() {
				expect(a.callback).to.have.been.calledWith('fasdf');
				done();
			});
		});
	});

	describe("#send()", function() {
		it("should throw a TypeError when message_name is not a string", function() {	
			expect(function() { results.send(123, 'fdsa', function() {}); }).to.throw(TypeError);
		});
		it("should throw a TypeError when message_name is 'transaction'", function() {
			expect(function() { results.send('transaction', 'fdsa', function() {}); }).to.throw(Error);
		});
		it("should throw a TypeError when payload is not a string a dict object", function() {
			expect(function() { results.send('transactio', 123, function() {}); }).to.throw(TypeError);
		});	
		it("should throw a TypeError when callback is not a function", function() {
			expect(function() { results.send('transaction', 'fdsa', 123); }).to.throw(TypeError);
		});	
		
		it("should post data to server successfully", function(done) {
			var path = '/message';
			var data = {
				message_id: 'haf'
			};
			var callback = function() {};
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			//sinon.spy(results, 'err_cb');
			results.send('fsa', 'fsad', callback, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.response_callbacks).to.have.a.property('haf', callback);
				done();
			});
		});

	});

	describe("#send_transaction()", function() {
		it("should throw a TypeError when payload is not a string a dict object", function() {
			expect(function() { results.send_transaction(123, function() {}); }).to.throw(TypeError);
		});	
		it("should throw a TypeError when callback is not a function", function() {
			expect(function() { results.send_transaction('afd', 123); }).to.throw(TypeError);
		});	
		
		it("should post transaction data to server successfully", function(done) {
			var path = '/transaction';
			var data = {
				message_id: 'haf'
			};
			var callback = function() {};
			//sinon.spy(results, 'err_cb');
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			results.send_transaction('fsad', callback, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.response_callbacks).to.have.a.property('haf', callback);
				done();
			});
		});
	});

	describe("#pre_poll_responses()", function() {
		it("done should be called", function(done) {
			results.pre_poll_responses(done);
		});
	});
	describe("#post_poll_responses()", function() {
		it("done should be called", function(done) {
			results.post_poll_responses(done);
		});
	});
	describe("#pre_dispatch_responses()", function() {
		it("done should be called", function(done) {
			results.pre_dispatch_responses(done);
		});
	});
	describe("#post_dispatch_responses()", function() {
		it("done should be called", function(done) {
			results.post_dispatch_responses(done);
		});
	});
});









