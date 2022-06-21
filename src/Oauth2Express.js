const { decode } = require("jsonwebtoken");

const {
	oauth2CreateLoginUrl,
	oauth2CreateRandomKey,
	oauth2Token
} = require("../src/oauth2");

const {
	asyncWrapper
} = require("../src/utils");

class Oauth2Express {
	constructor({ authUrl = "https://auth.simpleviewinc.com/", client_id, callbackPath = "/oauth2/callback/", logoutPath = "/logout/", createParams }) {
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

		Object.assign(this, {
			authUrl,
			client_id,
			callbackPath,
			logoutPath,
			createParams
		});

		this.middleware = asyncWrapper(middleware.bind(this));
		this.callback = asyncWrapper(callback.bind(this));
		this.logout = asyncWrapper(logout.bind(this));
	}

}

async function middleware (req, res, next) {
	if (req.session?.user?.exp - Date.now() / 1000 < 60 * 10) {
		return oauth2Token({
			authUrl: this.authUrl,
			grant_type: "refresh_token",
			refresh_token: req.session.refresh_token
		});
	}

	if (!req.session?.token || !req.session?.refresh_token) {
		req.session.state = oauth2CreateRandomKey();

		req.session.code_verifier = oauth2CreateRandomKey();
	
		const { protocol, hostname, originalUrl, session } = req;

		const loginUrl = oauth2CreateLoginUrl({
			authUrl: this.authUrl,
			client_id: this.client_id,
			redirect_uri: `${protocol}://${hostname}${this.callbackPath}`,
			redirectUrl: `${protocol}://${hostname}${originalUrl}`,
			sv_auth_params: this.createParams && this.createParams(req),
			state: session.state,
			code_verifier: session.code_verifier
		});
	
		return res.redirect(302, loginUrl);
	}

	return next();
}


async function callback(req, res) {
	const { state, code, redirectUrl, error, error_description } = req.query;

	if (error) {
		throw new Error(`${error}${error_description ? ": " + error_description : ""}`);
	}

	if (req.session.state !== state) {
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

	const { token, refresh_token } = await oauth2Token({
		authUrl: this.authUrl,
		grant_type: "authorization_code",
		client_id: this.client_id,
		redirect_uri,
		code,
		code_verifier: req.session.code_verifier
	});

	req.session.token = token;
	req.session.refresh_token = refresh_token;
	req.session.user = decode(token);

	return res.redirect(302, redirectUrl);
}

function logout(req, res) {
	req.session = null;

	const { protocol, hostname } = req;

	const redirectUrl = `${protocol}://${hostname}/`;

	let svAuthParams;
	if (this.createParams) {
		svAuthParams = this.createParams(req);
	}

	const params = new URLSearchParams({
		redirectUrl,
		...svAuthParams
	});

	const authParams = new URLSearchParams({ redirectUrl: `${this.authUrl}?${params.toString()}` });

	return res.redirect(`${this.authUrl}logout/?${authParams.toString()}`);
}

module.exports = Oauth2Express;