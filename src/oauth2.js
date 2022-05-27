const { URLSearchParams } = require("url");
const { request : axios } = require("axios");
const { createHash, randomBytes } = require("crypto");

async function oauth2AuthorizeCode({ auth_url, client_id, redirect_uri, code, code_verifier }) {
	const params = new URLSearchParams({
		grant_type: "authorization_code",
		client_id,
		redirect_uri,
		code,
		code_verifier
	});

	const rtn = await axios({
		url: `${auth_url}oauth2/token/`,
		method: "POST",
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		data: params.toString()
	});

	return {
		token: rtn.data.access_token,
		refresh_token: rtn.data.refresh_token
	}
}

function oauth2CreateKeyHash(key) {
	return createHash("sha256").update(key).digest("base64");
}

function oauth2CreateLoginUrl({ auth_url, client_id, redirect_uri, redirectUrl, sv_auth_params, state, code_verifier }) {
	const redirectParams = new URLSearchParams({ redirectUrl });

	const params = new URLSearchParams({
		response_type: "code",
		code_challenge_method: "S256",
		client_id,
		redirect_uri: `${redirect_uri}?${redirectParams.toString()}`,
		state,
		code_challenge: oauth2CreateKeyHash(code_verifier),
		sv_auth_params: JSON.stringify(sv_auth_params)
	});

	return `${auth_url}oauth2/login/?${params.toString()}`;
}

function oauth2CreateRandomKey() {
	return randomBytes(32).toString("hex");
}

async function oauth2GetNewTokens({ auth_url, refresh_token }) {
	const params = new URLSearchParams({
		grant_type: "refresh_token",
		refresh_token
	});

	const rtn = await axios({
		url: `${auth_url}oauth2/token/`,
		method: "POST",
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		data: params.toString()
	});

	return {
		token: rtn.data.access_token,
		refresh_token: rtn.data.refresh_token
	}
}

async function oauth2GetToken({ auth_url, client_id, req, res }) {
	const { state, code, redirectUrl } = req.query;

	const { protocol, hostname, originalUrl } = req;

	const redirect_uri = `${protocol}://${hostname}${originalUrl}`;
	if (req.session.state !== state) {
		throw new Error("State returned does not match stored state.");
	}

	const { token, refresh_token } = await oauth2AuthorizeCode({ auth_url, client_id, redirect_uri, code, code_verifier: req.session.code_verifier });

	req.session.token = token;
	req.session.refresh_token = refresh_token;

	return res.redirect(302, redirectUrl);
}

function oauth2Login({ auth_url, client_id, redirect_uri, sv_auth_params, req, res }) {
	req.session.state = oauth2CreateRandomKey();

	req.session.code_verifier = oauth2CreateRandomKey();

	const { protocol, hostname, originalUrl, session } = req;

	const redirectUrl = `${protocol}://${hostname}${originalUrl}`;

	const loginUrl = oauth2CreateLoginUrl({ auth_url, client_id, redirect_uri, redirectUrl, sv_auth_params, state: session.state, code_verifier: session.code_verifier });

	return res.redirect(302, loginUrl);
}

async function oauth2RefreshToken({ auth_url, req }) {
	const { token, refresh_token } = await oauth2GetNewTokens({
		auth_url,
		refresh_token: req.session.refresh_token
	});

	req.session.token = token;
	req.session.refresh_token = refresh_token;

	return;
} 

module.exports = {
	oauth2AuthorizeCode,
	oauth2CreateKeyHash,
	oauth2CreateLoginUrl,
	oauth2CreateRandomKey,
	oauth2GetToken,
	oauth2GetNewTokens,
	oauth2Login,
	oauth2RefreshToken
}