var chai = require('chai');
var expect = chai.expect;
var sinonChai = require('sinon-chai');
var sinon = require('sinon');
chai.use(sinonChai);
var flow = require('../lib/flow');

describe("Flow", function() {
	describe("#_flatten()", function() {
		it("should throw a TypeError if receiver is not an object", function() {
			expect(function() { flow._flatten(123, [], []); }).to.throw(TypeError);
		});

		it("should throw a TypeError if tasks is not a function or an array", function() {
			expect(function() { flow._flatten(this, 123, []); }).to.throw(TypeError);
		});

		it("should throw a TypeError if tasks an array of non-functions", function() {
			expect(function() { flow._flatten(this, [123], []); }).to.throw(TypeError);
		});

		it("should throw a TypeError if result is not an array", function() {
			expect(function() { flow._flatten(this, [], 123); }).to.throw(TypeError);
		});

		it("should do assign result if tasks is a function", function() {
			var tasks = function() {};
			var result = [];
			var receiver = {};
			flow._flatten(receiver, tasks, result);
			expect(result).to.have.length(1);
			for (var i = 0; i < result.length; i++) {
				expect(result[i]).to.be.a('function');
			}
		});

		it("should do assign result if tasks is a [] of functions", function() {
			var a = {};
			a.task1 = function() {
				if (this === receiver) {
					console.log('first');
				}	
			};
			a.task2 = function() {
				if (this === receiver) {
					console.log('second');
				}	
			};
			a.task3 = function() {
				if (this === receiver) {
					console.log('third');
				}	
			};
			sinon.spy(a, 'task1');
			sinon.spy(a, 'task2');
			sinon.spy(a, 'task3');
			//sinon.spy(console, 'log');
			var tasks = [[a.task1, a.task2], a.task3];
			var result = [];
			var receiver = { name: 'sunjian' };
			flow._flatten(receiver, tasks, result);
			for (var i = 0; i < result.length; i++) {
				result[i]();
			}	
			expect(a.task1).to.have.been.calledBefore(a.task2);
			expect(a.task2).to.have.been.calledBefore(a.task3);
			expect(a.task3).to.have.been.called;
			expect(console.log).to.have.been.calledWith('first');
			expect(console.log).to.have.been.calledWith('second');
			expect(console.log).to.have.been.calledWith('third');
		});
	});

	describe("#serial()", function() {
		it("should throw a TypeError if receiver is not an object", function() {
			expect(function() { flow.serial(123, []); }).to.throw(TypeError);
		});

		it("should throw a TypeError if tasks is not a function or an array", function() {
			expect(function() { flow.serial(this, 123); }).to.throw(TypeError);
		});

		it("should throw a TypeError if tasks an array of non-functions", function() {
			expect(function() { flow.serial(this, [123]); }).to.throw(TypeError);
		});

		it("should throw a TypeError if next is not a functions", function() {
			expect(function() { flow.serial(this, [], 123); }).to.throw(TypeError);
		});

		it("should call all the tasks in order by the right receiver if inputs are in the right types", function() {
			var receiver = {name: 'sunjian'};
			var a = {};
			a.task1 = function(next) {
				if (this === receiver) {
					console.log(11);
				}
				if (next) next();
			};
			a.task2 = function(next) {
				if (this === receiver) {
					console.log(22);
				}
				if (next) next();
			};
			a.task3 = function(next) {
				if (this === receiver) {
					console.log(33);
				}
				if (next) next();
			};
			sinon.spy(a, 'task1');
			sinon.spy(a, 'task2');
			sinon.spy(a, 'task3');
			
			var tasks = [[a.task1, a.task2], a.task3];
			flow.serial(receiver, tasks);
			expect(a.task1).to.have.been.calledBefore(a.task2);
			expect(a.task2).to.have.been.calledBefore(a.task3);
			expect(a.task3).to.have.been.called;
			expect(console.log).to.have.been.calledWith(11);
			expect(console.log).to.have.been.calledWith(22);
			expect(console.log).to.have.been.calledWith(33);

		});
	});
});






