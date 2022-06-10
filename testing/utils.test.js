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

	describe("validateAuthUrl", function() {
		const tests = [
			{
				name: "return true for live url",
				args: {
					authUrl: "https://auth.simpleviewinc.com/",
					result: true
				}
			},
			{
				name: "return true for dev url",
				args: {
					authUrl: "https://auth.dev.simpleviewinc.com/",
					result: true
				}
			},
			{
				name: "return true for qa url",
				args: {
					authUrl: "https://auth.qa.simpleviewinc.com/",
					result: true
				}
			},
			{
				name: "return true for local url",
				args: {
					authUrl: "https://auth.kube.simpleview.io/",
					result: true
				}
			},
			{
				name: "return true for test url",
				args: {
					authUrl: "http://sv-auth-pull-0-ui-service.default.svc.cluster.local/",
					result: true
				}
			},
			{
				name: "throw error for url not in list",
				args: {
					authUrl: "https://auth.invalid.simpleviewinc.com/",
					error: "authUrl must be one of https://auth.simpleviewinc.com/, https://auth.dev.simpleviewinc.com/, https://auth.qa.simpleviewinc.com/, https://auth.kube.simpleview.io/"
				}
			},
			{
				name: "throw error for blank url",
				args: {
					authUrl: "",
					error: "authUrl must be one of https://auth.simpleviewinc.com/, https://auth.dev.simpleviewinc.com/, https://auth.qa.simpleviewinc.com/, https://auth.kube.simpleview.io/"
				}
			},
			{
				name: "throw error for undefined url",
				args: {
					error: "authUrl must be one of https://auth.simpleviewinc.com/, https://auth.dev.simpleviewinc.com/, https://auth.qa.simpleviewinc.com/, https://auth.kube.simpleview.io/"
				}
			},
		];

		mochaLib.testArray(tests, async function(test) {
			let result;
			try {
				result = utils.validateAuthUrl(test.authUrl);
			} catch (e) {
				assert.strictEqual(e.message, test.error);
				return;
			}

			assert.deepStrictEqual(result, test.result);
		});
	});

});