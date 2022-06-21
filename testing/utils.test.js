const assert = require("assert");
const mochaLib = require("@simpleview/mochalib");

const utils = require("../src/utils");

describe(__filename, function() {
	describe("canIds", function() {
		const tests = [
			{
				name : "return false if no bindings",
				args : {
					bindings : {},
					perm : "foo",
					node_type : "foo",
					result : false
				}
			},
			{
				name : "return true if true",
				args : {
					bindings : { foo : true },
					perm : "foo",
					node_type : "bar",
					result : true
				}
			},
			{
				name : "return false if lacking specified binding",
				args : {
					bindings : { foo : true },
					perm : "bar",
					node_type : "bar",
					result : false
				}
			},
			{
				name : "return false if the node_type doesn't exist",
				args : {
					bindings : { foo : { bar : ["1", "2"] } },
					perm : "foo",
					node_type : "baz",
					result : false
				}
			},
			{
				name : "return the array if perm and node_type exist",
				args : {
					bindings : { foo : { bar : ["1","2"] } },
					perm : "foo",
					node_type : "bar",
					result : ["1", "2"]
				}
			}
		];

		mochaLib.testArray(tests, async function(test) {
			const result = utils.canIds(test.perm, test.node_type, test.bindings);

			assert.deepStrictEqual(result, test.result);
		});
	});
});