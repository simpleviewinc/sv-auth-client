const express = require("express");
const supertest = require("supertest");
const cookieSession = require("cookie-session");
const cookie = require("cookie");
const assert = require("assert");
const { decode } = require("jsonwebtoken");
const { deepCheck } = require("@simpleview/assertlib");

const testServers = require("../src/testServers");

const {
	oauth2CreateKeyHash,
	oauth2GetTokens
} = require("../src/oauth2");
const Oauth2Express = require("../src/Oauth2Express");

const AUTH_URL = "https://auth.kube.simpleview.io/";

const oauth2 = new Oauth2Express({
	authUrl: AUTH_URL,
	client_id: "cms"
});

const app = express();

app.set("trust proxy", 1);

app.use(cookieSession({
	name: "session",
	secret: "test",
	sameSite: "none",
	secure: false,
	signed: false
}));

app.get("/", oauth2.middleware, function(req, res) {
	res.send("get /");
});

app.post("/", oauth2.middleware, function(req, res) {
	res.send("post /");
});

app.get("/no_auth/", function(req, res) {
	res.send("none");
});

oauth2.applyMiddleware(app);

function getSessionFromHeaders(headers) {
	const cookies = cookie.parse(headers["set-cookie"][0]);
	return JSON.parse(Buffer.from(cookies.session, "base64").toString());
}

function getHeaderFromSession(sessionData) {
	return `session=${Buffer.from(JSON.stringify(sessionData)).toString("base64")}`
}

describe(__filename, function() {
	before(async function() {
		this.timeout(10000);

		await testServers.init();
	});

	it("should allow access to a no auth url", async function() {
		const result = await supertest(app).get("/no_auth/");
		assert.strictEqual(result.text, "none");
	});

	describe("middleware", function() {
		it("should redirect without session to login", async function() {
			const result = await supertest(app).get("/");
			const sessionData = getSessionFromHeaders(result.headers);

			deepCheck(sessionData, {
				oauth2: {
					type: "initial",
					state: { type: "string" },
					code_verifier: { type: "string" }
				}
			});

			const url = new URL(result.headers.location);
			deepCheck(Object.fromEntries(url.searchParams), {
				response_type: "code",
				code_challenge_method: "S256",
				client_id: "cms",
				redirect_uri: "http://127.0.0.1/oauth2/callback/?redirectUrl=http%3A%2F%2F127.0.0.1%2F",
				state: sessionData.oauth2.state,
				code_challenge: oauth2CreateKeyHash(sessionData.oauth2.code_verifier)
			}, {
				allowExtraKeys: false
			});
		});

		it("should not redirect if the session is valid", async function() {
			const sessionData = {
				oauth2: {
					type: "logged_in",
					created: Date.now(),
					token_created: Date.now(),
					token: "token",
					refresh_token: "refresh_token",
					email: "test0@test.com"
				}
			}
			const result = await supertest(app)
				.get("/")
				.set("Cookie", getHeaderFromSession(sessionData))
			;

			assert.strictEqual(result.text, "get /");
			// No cookie means that the session wasn't modified
			assert.strictEqual(result.headers["set-cookie"], undefined);
		});

		it("should refresh if the session is expiring", async function() {
			const { refresh_token } = await oauth2GetTokens({
				authUrl: AUTH_URL,
				client_id: "crm",
				redirect_uri: "https://test.simpleviewcrm.com/oauth2/callback/",
				code: "test_code",
				code_verifier: "test_code_challenge1"
			});

			const originalCreated = Date.now();
			const originalTokenCreated = new Date(2011).getTime();

			const sessionData = {
				oauth2: {
					type: "logged_in",
					created: originalCreated,
					token_created: originalTokenCreated,
					token: "token",
					refresh_token,
					email: "test0@test.com"
				}
			}
			const result = await supertest(app)
				.get("/")
				.set("Cookie", getHeaderFromSession(sessionData))
			;

			assert.strictEqual(result.text, "get /");

			// ensure that the bogus token in the session has been replaced
			const newSession = getSessionFromHeaders(result.headers);
			assert.notStrictEqual(newSession.oauth2.token_created, originalTokenCreated);
			deepCheck(decode(newSession.oauth2.token), {
				email: "test1@test.com",
				iat: { type: "number" },
				exp: { type: "number" }
			}, {
				allowExtraKeys: false
			});
		});
	});

	describe("callback", function() {
		it("should log the user in", async function() {
			const sessionData = {
				oauth2: {
					type: "initial",
					state: "new",
					code_verifier: "test_code_challenge0"
				}
			}

			const params = new URLSearchParams({
				state: "new",
				code: "test_code",
				redirectUrl: "https://www.google.com/"
			});

			const result = await supertest(app)
				.get(`/oauth2/callback/?${params.toString()}`)
				.set("X-Forwarded-Proto", "https")
				.set("Host", "test.simpleviewcms.com")
				.set("Cookie", getHeaderFromSession(sessionData))
			;

			assert.strictEqual(result.headers.location, "https://www.google.com/")
			assert.strictEqual(result.status, 302);

			const newSession = getSessionFromHeaders(result.headers);
			deepCheck(newSession, {
				oauth2: {
					type: "logged_in",
					created: { type: "number" },
					token_created: { type: "number" },
					token: { type: "string" },
					refresh_token: { type: "string" },
					email: "test0@test.com"
				}
			}, {
				allowExtraKeys: false
			});
		});
	});
});
