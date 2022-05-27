const assert = require("assert");

const {
	oauth2CreateKeyHash,
	oauth2CreateLoginUrl,
	oauth2CreateRandomKey
} = require("../src/oauth2");

describe(__filename, function() {
	it("oauth2CreateKeyHash should create key hash", async () => {
		const result = oauth2CreateKeyHash("test");

		assert.strictEqual(result, "n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=");
	});

	it("oauth2CreateRandomKey should create random string", async () => {
		const result = oauth2CreateRandomKey();

		assert.strictEqual(typeof result, "string");

		assert.strictEqual(result.length, 64);
	});

	it("oauth2CreateLoginUrl should create url", async () => {
		const result = oauth2CreateLoginUrl({
			auth_url: "https://auth.kube.simpleview.io/",
			client_id: "cms",
			redirect_uri: "https://test.simpleviewcms.com/oauth2/callback/",
			redirectUrl: "http://test.simpleviewcms.com/",
			state: "teststate",
			code_verifier: "test",
			sv_auth_params: {
				acct_id: 9132,
				product: "cms"
			}
		});

		assert.strictEqual(result, "https://auth.kube.simpleview.io/oauth2/login/?response_type=code&code_challenge_method=S256&client_id=cms&redirect_uri=https%3A%2F%2Ftest.simpleviewcms.com%2Foauth2%2Fcallback%2F%3FredirectUrl%3Dhttp%253A%252F%252Ftest.simpleviewcms.com%252F&state=teststate&code_challenge=n4bQgYhMfWWaL%2BqgxVrQFaO%2FTxsrC4Is0V1sFbDwCgg%3D&sv_auth_params=%7B%22acct_id%22%3A9132%2C%22product%22%3A%22cms%22%7D");
	});
});