//@ts-check
const { request : axios } = require("axios");
const { createHash, randomBytes } = require("crypto");

const liveAuthUrl = "https://auth.simpleviewinc.com/";

function oauth2CreateKeyHash(key) {
	return createHash("sha256").update(key).digest("base64");
}

/**
 * Generate a login URL
 * @param {object} args
 * @param {string} args.authUrl - URL of Auth
 * @param {string} args.client_id - Registered client_id
 * @param {string} args.redirect_uri - The URL auth will redirect to to handle oauth2 verification
 * @param {object} args.sv_auth_params - Params to append to the login request such as product, account_name, account_id
 * @param {string} args.state - Unique state key to identify this transaction
 * @param {string} args.code_verifier - Code verifier used to generate code_challenge
 * @returns {string}
 */
function oauth2CreateLoginUrl({
	authUrl = liveAuthUrl,
	client_id,
	redirect_uri,
	sv_auth_params,
	state,
	code_verifier
}) {
	const params = new URLSearchParams({
		response_type: "code",
		code_challenge_method: "S256",
		client_id,
		redirect_uri,
		state,
		code_challenge: oauth2CreateKeyHash(code_verifier)
	});

	if (sv_auth_params) {
		params.set("sv_auth_params", JSON.stringify(sv_auth_params));
	}

	return `${authUrl}oauth2/login/?${params.toString()}`;
}

/**
 * Generates a logout URL
 * @param {object} args
 * @param {string} args.authUrl - URL of Auth
 * @param {string} args.redirect_uri - The URL auth will redirect after login
 * @param {object} args.sv_auth_params - Params to append to the login request such as product, account_name, account_id
 * @returns {string}
 */
function oauth2CreateLogoutUrl({
	authUrl = liveAuthUrl,
	redirect_uri,
	sv_auth_params = {}
}) {
	const url = new URL(`${authUrl}logout/`);
	url.searchParams.set("redirectUrl", redirect_uri);

	for (const [key, value] of Object.entries(sv_auth_params)) {
		url.searchParams.set(key, value);
	}

	return url.toString();
}

/**
 * Generate an oauth2 random identifier
 */
function oauth2CreateRandomKey() {
	return randomBytes(32).toString("hex");
}

/**
 * Internal function to retreive tokens from the server
 * @param {object} args
 * @param {string} args.authUrl - URL of Auth
 * @param {object} args.params - Params to add to the request
 * @returns {Promise<{ token: string, refresh_token: string }>}
 */
async function _oauth2GetTokens({
	authUrl = liveAuthUrl,
	params
}) {
	let rtn;
	try {
		rtn = await axios({
			url: `${authUrl}oauth2/token/`,
			method: "POST",
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			data: new URLSearchParams(params).toString()
		});
	} catch (e) {
		if (e.response?.data?.error) {
			const errData = e.response.data;
			const terms = [errData.error, errData.error_description];
			throw new Error(`Auth Error: ${terms.filter(val => val).join(", ")}`);
		}

		throw new Error(`Auth Error: ${e.message}`);
	}

	return {
		token: rtn.data.access_token,
		refresh_token: rtn.data.refresh_token
	}
}

async function oauth2GetTokens({
	authUrl,
	client_id,
	redirect_uri,
	code,
	code_verifier
}) {
	return _oauth2GetTokens({
		authUrl,
		params: {
			client_id,
			grant_type: "authorization_code",
			redirect_uri,
			code,
			code_verifier
		}
	})
}

async function oauth2GetTokensFromRefresh({
	authUrl,
	refresh_token
}) {
	return _oauth2GetTokens({
		authUrl,
		params: {
			grant_type: "refresh_token",
			refresh_token
		}
	});
}

module.exports = {
	oauth2CreateKeyHash,
	oauth2CreateLoginUrl,
	oauth2CreateLogoutUrl,
	oauth2CreateRandomKey,
	oauth2GetTokens,
	oauth2GetTokensFromRefresh
}
