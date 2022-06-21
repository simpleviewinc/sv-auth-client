const { URLSearchParams } = require("url");
const { request : axios } = require("axios");
const { createHash, randomBytes } = require("crypto");

const liveAuthUrl = "https://auth.simpleviewinc.com/";

function oauth2CreateKeyHash(key) {
	return createHash("sha256").update(key).digest("base64");
}

function oauth2CreateLoginUrl({ authUrl = liveAuthUrl, client_id, redirect_uri, redirectUrl, sv_auth_params, state, code_verifier }) {
	const redirectParams = new URLSearchParams({ redirectUrl });

	const params = new URLSearchParams({
		response_type: "code",
		code_challenge_method: "S256",
		client_id,
		redirect_uri: `${redirect_uri}?${redirectParams.toString()}`,
		state,
		code_challenge: oauth2CreateKeyHash(code_verifier)
	});

	if (sv_auth_params) {
		params.set("sv_auth_params", JSON.stringify(sv_auth_params));
	}

	return `${authUrl}oauth2/login/?${params.toString()}`;
}

function oauth2CreateRandomKey() {
	return randomBytes(32).toString("hex");
}

async function oauth2Token({ authUrl = liveAuthUrl, ...params }) {
	const rtn = await axios({
		url: `${authUrl}oauth2/token/`,
		method: "POST",
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		data: new URLSearchParams(params).toString()
	});

	return {
		token: rtn.data.access_token,
		refresh_token: rtn.data.refresh_token
	}
}

module.exports = {
	oauth2CreateKeyHash,
	oauth2CreateLoginUrl,
	oauth2CreateRandomKey,
	oauth2Token
}