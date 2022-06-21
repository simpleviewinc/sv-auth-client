// const assert = require("assert");
// const { testArray } = require("@simpleview/mochalib");

// const {
// 	oauth2AuthorizeCode,
// 	oauth2Callback,
// 	oauth2CreateKeyHash,
// 	oauth2CreateLoginUrl,
// 	oauth2CreateRandomKey,
// 	oauth2GetNewTokens,
// 	oauth2Login,
// 	oauth2RefreshToken
// } = require("../src/oauth2");

// describe(__filename, function() {
// 	it("oauth2CreateKeyHash should create key hash", async () => {
// 		const result = oauth2CreateKeyHash("test");

// 		assert.strictEqual(result, "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=");
// 	});

// 	it("oauth2CreateRandomKey should create random string", async () => {
// 		const result = oauth2CreateRandomKey();

// 		assert.strictEqual(typeof result, "string");

// 		assert.strictEqual(result.length, 64);
// 	});

// 	it("oauth2CreateLoginUrl should create url", async () => {
// 		const result = oauth2CreateLoginUrl({
// 			authUrl: "https://auth.kube.simpleview.io/",
// 			client_id: "cms",
// 			redirect_uri: "https://test.simpleviewcms.com/oauth2/callback/",
// 			redirectUrl: "http://test.simpleviewcms.com/",
// 			state: "teststate",
// 			code_verifier: "test",
// 			sv_auth_params: {
// 				acct_id: 9132,
// 				product: "cms"
// 			}
// 		});

// 		assert.strictEqual(result, "https://auth.kube.simpleview.io/oauth2/login/?response_type=code&code_challenge_method=S256&client_id=cms&redirect_uri=https%3A%2F%2Ftest.simpleviewcms.com%2Foauth2%2Fcallback%2F%3FredirectUrl%3Dhttp%253A%252F%252Ftest.simpleviewcms.com%252F&state=teststate&code_challenge=n4bQgYhMfWWaL%2BqgxVrQFaO%2FTxsrC4Is0V1sFbDwCgg%3D&sv_auth_params=%7B%22acct_id%22%3A9132%2C%22product%22%3A%22cms%22%7D");
// 	});

// 	describe("functions should throw error with invalid authUrl", function() {
// 		const tests = [
// 			{
// 				name: "oauth2AuthorizeCode",
// 				args: {
// 					query: async () => oauth2AuthorizeCode({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 			{
// 				name: "oauth2Callback",
// 				args: {
// 					query: async () => oauth2Callback({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 			{
// 				name: "oauth2CreateLoginUrl",
// 				args: {
// 					query: () => oauth2CreateLoginUrl({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 			{
// 				name: "oauth2GetNewTokens",
// 				args: {
// 					query: async () => oauth2GetNewTokens({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 			{
// 				name: "oauth2Login",
// 				args: {
// 					query: () => oauth2Login({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 			{
// 				name: "oauth2RefreshToken",
// 				args: {
// 					query: async () => oauth2RefreshToken({ authUrl: "https://auth.invalid.simpleviewinc.com" })
// 				}
// 			},
// 		];

// 		testArray(tests, async function(test) {
// 			try {
// 				await test.query();
// 			} catch (e) {
// 				assert.strictEqual(e.message, "authUrl must be one of https://auth.simpleviewinc.com/, https://auth.dev.simpleviewinc.com/, https://auth.qa.simpleviewinc.com/, https://auth.kube.simpleview.io/");
// 				return;
// 			}

// 			assert.strictEqual(true, false);
// 		});
// 	});
// });