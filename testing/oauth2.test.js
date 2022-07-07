const assert = require("assert");
const { testArray } = require("@simpleview/mochalib");
const { decode } = require("jsonwebtoken");
const { deepCheck } = require("@simpleview/assertlib");

const testServers = require("../src/testServers");

const {
	oauth2CreateKeyHash,
	oauth2CreateLoginUrl,
	oauth2CreateRandomKey,
	oauth2CreateLogoutUrl,
	oauth2GetTokens,
	oauth2GetTokensFromRefresh
} = require("../src/oauth2");

const AUTH_URL = "https://auth.kube.simpleview.io/";

describe(__filename, function() {
	before(async function() {
		this.timeout(5000);

		await testServers.init();
	});

	describe("oauth2CreateLoginUrl", function() {
		const tests = [
			{
				name: "Minimum arguments",
				args: {
					args: {
						client_id: "test",
						redirect_uri: "https://www.google.com/",
						state: "state1",
						code_verifier: "code1"
					},
					result: "https://auth.simpleviewinc.com/oauth2/login/?response_type=code&code_challenge_method=S256&client_id=test&redirect_uri=https%3A%2F%2Fwww.google.com%2F&state=state1&code_challenge=s19FleZLSSuuY05Trmzttz76FXCeZvTm7qruf8lBhJc%3D"
				}
			},
			{
				name: "With all args",
				args: {
					args: {
						authUrl: "https://auth.local.simpleviewinc.com/",
						client_id: "test2",
						redirect_uri: "https://www.google.com/?key=something",
						state: "state2",
						code_verifier: "code2",
						sv_auth_params: {
							product: "product2",
							account_name: "account2"
						}
					},
					result: "https://auth.local.simpleviewinc.com/oauth2/login/?response_type=code&code_challenge_method=S256&client_id=test2&redirect_uri=https%3A%2F%2Fwww.google.com%2F%3Fkey%3Dsomething&state=state2&code_challenge=688Dj7Yi%2Bn8RZ2XJGtt59M1JwDxdChfMXsqAkNkPcMg%3D&sv_auth_params=%7B%22product%22%3A%22product2%22%2C%22account_name%22%3A%22account2%22%7D"
				}
			}
		]

		testArray(tests, function(test) {
			const result = oauth2CreateLoginUrl({
				...test.args
			});

			assert.strictEqual(result, test.result);
		});
	});

	describe("oauth2CreateKeyHash", function() {
		const tests = [
			{
				name: "test",
				args: {
					key: "test",
					result: "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg="
				}
			},
			{
				name: "test2",
				args: {
					key: "test2",
					result: "YDA64iuZiGG847KPM+7BvnWKITyGyTwHbb6fVYwRx1I="
				}
			}
		]

		testArray(tests, function(test) {
			const result = oauth2CreateKeyHash(test.key);
			assert.strictEqual(result, test.result);
		})
	});

	describe("oauth2CreateLogoutUrl", function() {
		const tests = [
			{
				name: "Minimum arguments",
				args: {
					args: {
						redirect_uri: "https://www.google.com/"
					},
					result: "https://auth.simpleviewinc.com/logout/?redirectUrl=https%3A%2F%2Fwww.google.com%2F"
				}
			},
			{
				name: "With all args",
				args: {
					args: {
						authUrl: "https://auth.local.simpleviewinc.com/",
						redirect_uri: "https://www.google.com/?key=something",
						sv_auth_params: {
							product: "product2",
							account_name: "account2"
						}
					},
					result: "https://auth.local.simpleviewinc.com/logout/?redirectUrl=https%3A%2F%2Fwww.google.com%2F%3Fkey%3Dsomething&product=product2&account_name=account2"
				}
			}
		]

		testArray(tests, function(test) {
			const result = oauth2CreateLogoutUrl({
				...test.args
			});

			assert.strictEqual(result, test.result);
		});
	});

	describe("oauth2CreateRandomKey", function() {
		it("oauth2CreateRandomKey should create random string", async () => {
			const result = oauth2CreateRandomKey();

			assert.strictEqual(typeof result, "string");
			assert.strictEqual(result.length, 64);

			const result2 = oauth2CreateRandomKey();

			assert.strictEqual(typeof result2, "string");
			assert.strictEqual(result2.length, 64);

			assert.notStrictEqual(result, result2);
		});
	});

	describe("oauth2GetTokens", function() {
		const tests = [
			{
				name: "Should get valid tokens",
				args: {
					args: {
						authUrl: AUTH_URL,
						client_id: "cms",
						redirect_uri: "https://test.simpleviewcms.com/oauth2/callback/",
						code: "test_code",
						code_verifier: "test_code_challenge0"
					},
					token: {
						email: "test0@test.com",
						iat: { type: "number" },
						exp: { type: "number" }
					},
					refreshToken: {
						email: "test0@test.com",
						iat: { type: "number" }
					}
				}
			},
			{
				name: "Should throw with error",
				args: {
					args: {
						authUrl: AUTH_URL,
						client_id: "bogus",
						redirect_uri: "https://test.simpleviewcms.com/oauth2/callback/",
						code: "test_code",
						code_verifier: "test_code_challenge0"
					},
					error: "Auth Error: invalid_client"
				}
			},
			{
				name: "Should throw with error and error_description",
				args: {
					args: {
						authUrl: AUTH_URL,
						client_id: "cms",
						redirect_uri: "https://bogus/",
						code: "test_code",
						code_verifier: "test_code_challenge0"
					},
					error: "Auth Error: invalid_grant, redirect_uri is invalid for client"
				}
			},
			{
				name: "Should throw with invalid authUrl",
				args: {
					args: {
						authUrl: "https://www.google.com/",
						client_id: "cms",
						redirect_uri: "https://test.simpleviewcms.com/oauth2/callback/",
						code: "test_code",
						code_verifier: "test_code_challenge0"
					},
					error: "Auth Error: Request failed with status code 404"
				}
			}
		]

		testArray(tests, async function(test) {
			const fn = () => oauth2GetTokens(test.args);

			if (test.error) {
				return assert.rejects(fn, { message: test.error });
			}

			const result = await fn();

			if (test.token !== undefined) {
				const token = decode(result.token);
				deepCheck(token, test.token, {
					allowExtraKeys: false
				});
			}

			if (test.refreshToken !== undefined) {
				const token = decode(result.refresh_token);
				deepCheck(token, test.refreshToken, {
					allowExtraKeys: false
				});
			}
		});
	});

	describe("oauth2GetTokensFromRefresh", function() {
		it("should get tokens from a refresh_token", async function() {
			const result = await oauth2GetTokens({
				authUrl: AUTH_URL,
				client_id: "crm",
				redirect_uri: "https://test.simpleviewcrm.com/oauth2/callback/",
				code: "test_code",
				code_verifier: "test_code_challenge1"
			});

			const newResult = await oauth2GetTokensFromRefresh({
				authUrl: AUTH_URL,
				refresh_token: result.refresh_token
			});

			const decoded = decode(newResult.token);
			deepCheck(decoded, {
				email: "test1@test.com",
				iat: { type: "number" },
				exp: { type: "number" }
			}, { allowExtraKeys: false })
		});
	});
});
