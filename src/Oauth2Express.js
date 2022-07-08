//@ts-check
const { decode } = require("jsonwebtoken");
const { asyncWrap } = require("@simpleview/express-async-handler");

const {
	oauth2CreateLoginUrl,
	oauth2CreateLogoutUrl,
	oauth2CreateRandomKey,
	oauth2GetTokens,
	oauth2GetTokensFromRefresh
} = require("../src/oauth2");

class Oauth2Express {
	/**
	 * @param {object} args
	 * @param {string} args.authUrl - URL to use for Auth
	 * @param {string} args.client_id - Your registered client_id declared at the same Auth.
	 * @param {string} [args.callbackPath] - The callback path on your express app that will handle the callback from Auth.
	 * @param {string} [args.logoutPath] - The logout path on your express app that will handle logging the user out and sending them back to the login screen.
	 * @param {import("./types").CreateParams} [args.createParams] - Transforms a request object into an object with "product", "account_id", and/or "account_name" for using within auth.
	 * @param {string} [args.sessionKey] - Key to store the declared session
	*/
	constructor({
		authUrl = "https://auth.simpleviewinc.com/",
		client_id,
		callbackPath = "/oauth2/callback/",
		logoutPath = "/logout/",
		createParams,
		sessionKey = "session"
	}) {
		const validUrls = [
			"https://auth.simpleviewinc.com/",
			"https://auth.dev.simpleviewinc.com/",
			"https://auth.qa.simpleviewinc.com/",
			"https://auth.kube.simpleview.io/"
		]

		if (validUrls.indexOf(authUrl) === -1 && !/http[^.]+.ui-service.default.svc.cluster.local/.test(authUrl)) {
				throw new Error("authUrl must be one of " + validUrls.join(", "));
		}

		if (!client_id) {
			throw new Error("client_id is required.")
		}

		this.authUrl = authUrl;
		this.client_id = client_id;
		this.callbackPath = callbackPath;
		this.logoutPath = logoutPath;
		this.createParams = createParams;
		this.sessionKey = sessionKey;

		this.middleware = asyncWrap(middleware.bind(this));
		this.callback = asyncWrap(callback.bind(this));
		this.logout = asyncWrap(logout.bind(this));
	}
	/**
	 * Apply callback and logout middleware to the application
	 * @param {import("express").Application} app
	 */
	applyMiddleware(app) {
		app.get(this.callbackPath, this.callback);
		app.get(this.logoutPath, this.logout);
	}
}

/**
 * @this {Oauth2Express}
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
async function middleware(req, res, next) {
	const session = req[this.sessionKey];
	/**
	 * @type {import("./types").UnknownSession}
	 */
	const oauth2 = session?.oauth2;

	// If we don't have a token or a refresh_token than we need to redirect to Auth to log the user in
	if (!oauth2) {
		if (req.method !== "GET") {
			throw new Error("User is not authorized to access this resource.");
		}

		/** @type {import("./types").InitialSession} */
		const newAuth = {
			type: "initial",
			state:  oauth2CreateRandomKey(),
			code_verifier:  oauth2CreateRandomKey()
		}

		req[this.sessionKey].oauth2 = newAuth;

		const { protocol, hostname, originalUrl } = req;

		const redirect_uri = new URL(`${protocol}://${hostname}${this.callbackPath}`);
		redirect_uri.searchParams.set("redirectUrl", `${protocol}://${hostname}${originalUrl}`);

		const loginUrl = oauth2CreateLoginUrl({
			authUrl: this.authUrl,
			client_id: this.client_id,
			redirect_uri: redirect_uri.toString(),
			sv_auth_params: this.createParams && this.createParams(req),
			state: newAuth.state,
			code_verifier: newAuth.code_verifier
		});

		return res.redirect(302, loginUrl);
	}

	if (oauth2.type === "initial") {
		throw new Error("Invalid session state.");
	}

	if (oauth2.type === "logged_in") {
		// If the token is older than 1 day we refresh
		if (Date.now() - oauth2.token_created > 1000 * 60 * 60 * 24) {
			const result = await oauth2GetTokensFromRefresh({
				authUrl: this.authUrl,
				refresh_token: oauth2.refresh_token
			});

			oauth2.token = result.token;
			oauth2.refresh_token = result.refresh_token;
			oauth2.token_created = Date.now();
		}
	}

	return next();
}

/**
 * @this {Oauth2Express}
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function callback(req, res) {
	const {
		state,
		code,
		redirectUrl,
		error,
		error_description
	} = req.query;

	if (error) {
		throw new Error(`${error}${error_description ? ": " + error_description : ""}`);
	}

	const session = req[this.sessionKey];
	/**
	 * @type {import("./types").InitialSession}
	*/
	const oauth2 = session?.oauth2;

	if (!oauth2 || !oauth2.code_verifier || !oauth2.state) {
		throw new Error("Session does not exist.");
	}

	if (session.oauth2.state !== state) {
		throw new Error("State returned does not match stored state.");
	}

	if (!code) {
		throw new Error("No code is present on the query string.");
	}

	if (!redirectUrl) {
		throw new Error("No redirectUrl is present on the query string.");
	}

	const { protocol, hostname, originalUrl } = req;

	const redirect_uri = `${protocol}://${hostname}${originalUrl}`;

	const { token, refresh_token } = await oauth2GetTokens({
		authUrl: this.authUrl,
		client_id: this.client_id,
		redirect_uri,
		code,
		code_verifier: session.oauth2.code_verifier
	});

	/** @type {import("./types").LoggedInSession} */
	const newSession = {
		type: "logged_in",
		created: Date.now(),
		token_created: Date.now(),
		token,
		refresh_token,
		email: /** @type {object} */ (decode(token)).email
	}
	session.oauth2 = newSession;

	return res.redirect(302, /** @type {string} */ (redirectUrl));
}

/**
 * @this {Oauth2Express}
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
function logout(req, res) {
	delete req[this.sessionKey].oauth2;

	const { protocol, hostname, query } = req;
	const redirectUrl = /** @type {string} */ (query.redirectUrl) ?? `${protocol}://${hostname}/`

	const logoutUrl = oauth2CreateLogoutUrl({
		authUrl: this.authUrl,
		redirect_uri: redirectUrl,
		sv_auth_params: this.createParams && this.createParams(req),
	});

	return res.redirect(302, logoutUrl);
}

module.exports = Oauth2Express;
