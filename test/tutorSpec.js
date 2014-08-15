var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
chai.use(sinonChai);
var expect = chai.expect;
var nock = require('nock');
var tutor = require('../lib/tutor');
var message_sender_mixin = require('../lib/message_sender_mixin');
var settings = require('../lib/settings');
var flow = require('../lib/flow');


describe("Tutor", function() {
	var entity_id = 'fdsaf';
	var api_key = 'fafd';
	var callback = function() {};
	var err_cb = function(err, status) {
		if (err) throw err;
		if (status !== 200) {
			throw Error(status + " error");
		}
	};
	
	describe("#tutor()", function() {
		it("should throw TypeError if entity_id is not a string", function() {
			expect(function() { tutor(123, 'sfd', function() {}, function() {}); }).to.throw(TypeError);
		});
		it("should throw TypeError if api_key is not a string", function() {
			expect(function() { tutor('afd', 123, function() {}); }).to.throw(TypeError);
		});
		it("should throw TypeError if callback is not a function", function() {
			expect(function() { tutor('fdas', 'sfd', 123, function() {}); }).to.throw(TypeError);
		});
		it("should throw TypeError if err_cb is not a function", function() {
			expect(function() { tutor('fdas', 'sfd', function() {}, 123); }).to.throw(TypeError);
		});
		it("should throw TypeError if options is not a dict object", function() {
			expect(function() { tutor('fdas', 'sfd', function(){}, function() {}, 123); }).to.throw(TypeError);
		});
		message_sender_mixin.call = sinon.spy();
		var options = {
			wildcard_callback: callback
		};
		
		it("should create an object with expected properties", function() {
			var result = new tutor(entity_id, api_key, callback, err_cb, options);
			expect(message_sender_mixin.call).to.have.been.calledWith(result, entity_id, api_key, err_cb);
			expect(result).to.have.a.property('wildcard_callback', callback);
			expect(result).to.have.a.property('callback');
			expect(result).to.have.a.property('poll_wait', 5000);
			expect(result).to.have.a.property('loop', true);
			expect(result).to.have.a.property('__proto__');

			var proto = result.__proto__;
			expect(proto).to.have.a.property('work');
			expect(proto).to.have.a.property('start');
			expect(proto).to.have.a.property('stop');
			expect(proto).to.have.a.property('isRunning');
			expect(proto).to.have.a.property('__proto__');

			var proto1 = proto.__proto__;
			expect(proto1).to.equal(message_sender_mixin.prototype);
		});
	});	
	
	describe("#work()", function() {
		it("should throw a TypeError if next is not a function", function() {
			var results = new tutor(entity_id, api_key, callback, err_cb);
			expect(function() { results.work(12); }).to.throw(TypeError);
		});	
		it("should call a bunch of methods multiple times", function(done) {
			var results = new tutor(entity_id, api_key, callback, err_cb);
			this.timeout(50000);
			var pass = function(next) {
				if(next) next();
			}
			setTimeout(function() {
				results.loop = false;
			}, 10000);
			results.pre_poll_responses = sinon.spy(pass);
			results._poll_responses = sinon.spy(pass);
			results.post_poll_responses = sinon.spy(pass);
			results.work(function() {
				expect(results.pre_poll_responses).to.have.been.calledBefore(results._poll_responses);
				expect(results._poll_responses).to.have.been.calledBefore(results.post_poll_responses);
				expect(results.post_poll_responses).to.have.been.called;
				done();
			});
		});
	});

	describe("#start()", function() {
		
		it("results.loop should be set true and a bunch of methods are called", function() {
			var results = new tutor(entity_id, api_key, callback, err_cb);
			var pass = function(next) {
				if(next) next();
			}
			results.pre_connect = sinon.spy(pass);
			results.connect = sinon.spy(pass);
			results.post_connect = sinon.spy(pass);
			results.work = sinon.spy(pass);
			results.start();
			expect(results.loop).to.equal(true);
			expect(results.pre_connect).to.have.been.calledBefore(results.connect);
			expect(results.connect).to.have.been.calledBefore(results.post_connect);
			expect(results.post_connect).to.have.been.calledBefore(results.work);
			expect(results.work).to.have.been.called;
		});
	});

	describe("#stop()", function() {
		
		it("results.loop should be set false and a bunch of methods are called", function() {
			var results = new tutor(entity_id, api_key, callback, err_cb);
			var pass = function(next) {
				if(next) next();
			}
			results.pre_disconnect = sinon.spy(pass);
			results.disconnect = sinon.spy(pass);
			results.post_disconnect = sinon.spy(pass);
			results.stop();
			expect(results.loop).to.equal(false);
			expect(results.pre_disconnect).to.have.been.calledBefore(results.connect);
			expect(results.disconnect).to.have.been.calledBefore(results.post_connect);
			expect(results.post_disconnect).to.have.been.called;
		});
	});

	describe("#isRunning()", function() {
		
		it("should always return results.connected", function() {
			var results = new tutor(entity_id, api_key, callback, err_cb);
			expect(results.isRunning()).to.equal(results.connected);
		});
	});
});









