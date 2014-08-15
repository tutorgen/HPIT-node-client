var chai = require('chai');
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
chai.use(sinonChai);
var expect = chai.expect;
var nock = require('nock');
var request_mixin = require('../lib/request_mixin');
var settings = require('../lib/settings');


describe("Request_mixin", function() {
	var entity_id = 'fdsaf';
	var api_key = 'fafd';
	var err_cb = function(err, status) {
		if (err) throw err;
		if (status !== 200) {
			throw Error(status + " error");
		}
	};
	var results = new request_mixin(entity_id, api_key, err_cb);
	describe("#request_mixin()", function() {
		it("should create an object with expected properties", function() {	
			expect(results).to.have.a.property("entity_id", entity_id);
			expect(results).to.have.a.property("api_key", api_key);
			expect(results).to.have.a.property("cookieJar");
			expect(results).to.have.a.property("cookie", null);
			expect(results).to.have.a.property("connected", false);		
			expect(results).to.have.a.property("err_cb", err_cb);
			expect(results).to.have.a.property("__proto__");

			var proto = results.__proto__;
			expect(proto).to.have.a.property("_post_data");
			expect(proto).to.have.a.property("_get_data");
			expect(proto).to.have.a.property("connect");
			expect(proto).to.have.a.property("disconnect");
			expect(proto).to.have.a.property("send_log_entry");
			expect(proto).to.have.a.property("pre_connect");
			expect(proto).to.have.a.property("post_connect");
			expect(proto).to.have.a.property("pre_disconnect");
			expect(proto).to.have.a.property("post_disconnect");
		});
	});
	describe("#err_cb()", function() {
		it("should throw no errors when statusCode is 200", function() {
			expect(function() { results.err_cb(null, 200); }).to.not.throw(Error);
		});
		it("should throw an error when statusCode is not 200", function() {
			expect(function() { results.err_cb(null, 404); }).to.throw(Error);
		});
		it("should throw an error when err is not null", function() {
			expect(function() { results.err_cb(new Error(), 200); }).to.throw(Error);
		});
	});
	describe("#_post_data()", function() {
		it("should post data to a certain url", function(done) {
			var path = '/';
			var data = 'fdasf';
			nock(settings.HPIT_URL_ROOT).post(path).reply(200, data);
			results._post_data(path, data, function(err, response, body) {
				expect(body).to.equal(data);
				expect(response).to.have.a.property('statusCode', 200);
				done();
			});
		});
	});	

	describe("#_get_data()", function() {
		it("should get data from a certain url", function(done) {
			var path = '/';
			var data = 'fdasf';
			nock(settings.HPIT_URL_ROOT).get(path).reply(200, data);
			results._get_data(path, function(err, response, body) {
				expect(body).to.equal(data);
				expect(response).to.have.a.property('statusCode', 200);
				done();
			});
		});
	});	

	describe("#connect()", function() {
		it("should connect to the server successfully", function(done) {
			var path = '/connect';
			nock(settings.HPIT_URL_ROOT).post(path).reply(200);
			sinon.spy(results, 'err_cb');
			results.connect(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.connected).to.equal(true);
				done();
			});
			
		});
	});

	describe("#disconnect()", function() {
		it("should disconnect from the server successfully", function(done) {
			var path = '/disconnect';
			nock(settings.HPIT_URL_ROOT).post(path).reply(200);
			results.disconnect(function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				expect(results.connected).to.equal(false);
				done();
			});
			
		});
	});

	describe("#send_log_entry()", function() {
		it("should send a text to the server successfully", function(done) {
			var path = '/log';
			var text = 'fasd';
			nock(settings.HPIT_URL_ROOT).post(path).reply(200);
			results.send_log_entry(text, function() {
				expect(results.err_cb).to.have.been.calledWith(null, 200);
				done();
			});	
		});

		it("should throw a TypeError if text is not a string", function() {
			var text = 432;
			expect(function() { results.send_log_entry(text); }).to.throw(TypeError);
		});
	});

	describe("#pre_connect()", function() {
		it("done should be called", function(done) {
			results.pre_connect(done);
		});
	});
	describe("#post_connect()", function() {
		it("done should be called", function(done) {
			results.post_connect(done);
		});
	});
	describe("#pre_disconnect()", function() {
		it("done should be called", function(done) {
			results.pre_disconnect(done);
		});
	});
	describe("#post_disconnect()", function() {
		it("done should be called", function(done) {
			results.post_disconnect(done);
		});
	});
});









