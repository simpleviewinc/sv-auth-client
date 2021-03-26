const assert = require("assert");
const fs = require("fs");
const { GraphServer } = require("@simpleview/sv-graphql-client");

const { AdminPrefix, AuthPrefix } = require("../");

const graphUrl = "https://graphql.kube.simpleview.io/link/auth-v2/";

const prefixes = [AdminPrefix, AuthPrefix];
const authGraphServer = new GraphServer({ graphUrl, prefixes })

const init = async function() {
	const serviceJson = JSON.parse(fs.readFileSync(`${__dirname}/../auth_test.serviceAccount.json`));
	const serviceLogin = await authGraphServer.auth.login_service_account({
		input : {
			email : serviceJson.client_email,
			private_key : serviceJson.private_key
		},
		fields : `success message token`
	});
	
	assert.strictEqual(serviceLogin.success, true);

	authGraphServer.context.token = serviceLogin.token;

	const resetResult = await authGraphServer.auth.test_reset_data({
		context : {
			token : serviceLogin.token,
		},
		fields : `success message`
	});

	assert.strictEqual(resetResult.success, true);

	const login1 = await authGraphServer.auth.login({
		input : {
			email : "test0@test.com",
			password : "test"
		},
		fields : `success message token`
	});

	assert.strictEqual(login1.success, true);

	servers.acct0test0.context.token = login1.token;
}

const servers = {
	init,
	authGraphServer,
	acct0test0 : new GraphServer({
		graphUrl,
		prefixes,
		context : {
			acct_id : "test-0"
		}
	})
}

module.exports = servers;