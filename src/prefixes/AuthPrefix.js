const Accounts = require("./auth/Accounts");
const OauthClients = require("./auth/OauthClients");
const TestItems = require("./auth/TestItems");
const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class AuthPrefix {
	constructor({ graphUrl, graphServer }) {
		this.name = "auth";
		
		this._graphUrl = graphUrl;
		this._graphServer = graphServer;
		
		this._accounts = new Accounts({
			graphUrl,
			name : "accounts",
			graphServer
		});

		this._oauthClients = new OauthClients({
			graphUrl,
			name : "oauth_clients",
			graphServer
		});

		this._testItems = new TestItems({
			graphUrl,
			name : "test_items",
			graphServer
		})
	}
	async accounts(...args) {
		return this._accounts.find(...args);
	}
	async accounts_upsert(...args) {
		return this._accounts.upsert(...args);
	}
	async accounts_remove(...args) {
		return this._accounts.remove(...args);
	}
	async account_public({ filter, fields, context }) {
		context = context || this._graphServer.context;
		
		const result = await query({
			query : `
				query($filter: auth_account_public_filter!) {
					auth {
						account_public(filter: $filter) {
							${fields}
						}
					}
				}
			`,
			variables : {
				filter
			},
			url : this._graphUrl
		});
		
		const returnData = result.auth.account_public;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async accounts_sync({ fields, context }) {
		context = context || this._graphServer.context;

		const result = await query({
			query : `
				mutation {
					auth {
						accounts_sync {
							${fields}
						}
					}
				}
			`,
			url : this._graphUrl,
			token : context.token
		});

		const returnData = result.auth.accounts_sync;
		
		nullToUndefined(returnData);

		return returnData;
	}
	async accounts_email_setup({ fields, context }) {
		context = context || this._graphServer.context;

		return await query({
			query : `
				mutation {
					auth {
						accounts_email_setup {
							${fields}
						}
					}
				}
			`,
			url : this._graphUrl,
			token : context.token,
			key : "auth.accounts_email_setup",
			clean : true
		});
	}
	async oauth_clients(...args) {
		return this._oauthClients.find(...args);
	}
	async oauth_clients_upsert(...args) {
		return this._oauthClients.upsert(...args);
	}
	async oauth_clients_remove(...args) {
		return this._oauthClients.remove(...args);
	}
	async current({ acct_id, fields, context }) {
		context = context || this._graphServer.context;
		
		const result = await query({
			query : `
				query($acct_id: String!) {
					auth {
						current(acct_id: $acct_id) {
							${fields}
						}
					}
				}
			`,
			variables : {
				acct_id
			},
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = result.auth.current;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async reset_password_start({ input, fields }) {
		const result = await query({
			query : `
				mutation($input : auth_reset_password_start_input!) {
					auth {
						reset_password_start(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables : {
				input
			},
			url : this._graphUrl
		});
		
		const returnData = result.auth.reset_password_start;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async update_password({ token, new_pass, fields }) {
		const result = await query({
			query : `
				mutation($token: String!, $new_pass: String!) {
					auth {
						update_password(token: $token, new_pass: $new_pass) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token,
				new_pass
			},
			url : this._graphUrl
		});
		
		return result.auth.update_password;
	}
	async refresh_token({ refresh_token, fields }) {
		const result = await query({
			query : `
				query($refresh_token: String!) {
					auth {
						refresh_token(refresh_token: $refresh_token) {
							${fields}
						}
					}
					
				}
			`,
			variables : {
				refresh_token
			},
			url : this._graphUrl
		});
		
		return result.auth.refresh_token;
	}
	async login({ input, fields }) {
		const result = await query({
			query : `
				query($input : auth_login_input!) {
					auth {
						login(input : $input) {
							${fields}
						}
					}
					
				}
			`,
			variables : {
				input
			},
			url : this._graphUrl
		});
		
		return result.auth.login;
	}
	async login_google({ token, fields }) {
		const result = await query({
			query : `
				query($token: String!) {
					auth {
						login_google(token: $token) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token
			},
			url : this._graphUrl
		});
		
		return result.auth.login_google;
	}
	async login_service_account({ input, fields }) {
		const result = await query({
			query : `
				query($input : auth_login_service_account_input!) {
					auth {
						login_service_account(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables : {
				input
			},
			url : this._graphUrl
		});
		
		return result.auth.login_service_account;
	}
	async login_sso_token({ input, fields }) {
		const result = await query({
			query : `
				query($input: auth_login_sso_token_input!) {
					auth {
						login_sso_token(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables : {
				input
			},
			url : this._graphUrl
		});

		return result.auth.login_sso_token;
	}
	async check_token_cache({ date, acct_id, fields, context }) {
		context = context || this._graphServer.context;
		
		const result = await query({
			query : `
				query($date: auth_date!, $acct_id: String!) {
					auth {
						check_token_cache(date: $date, acct_id: $acct_id) {
							${fields}
						}
					}
				}
			`,
			variables : {
				date,
				acct_id
			},
			url : this._graphUrl,
			token : context.token
		});
		
		return result.auth.check_token_cache;
	}
	async test_reset_data({ fields, context }) {
		context = context || this._graphServer.context;

		const result = await query({
			query : `
				mutation {
					auth {
						test_reset_data {
							${fields}
						}
					}
				}
			`,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = result.auth.test_reset_data;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async test_clear_data({ fields, context }) {
		context = context || this._graphServer.context;

		const result = await query({
			query : `
				mutation {
					auth {
						test_clear_data {
							${fields}
						}
					}
				}
			`,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = result.auth.test_clear_data;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async test_items(...args) {
		return this._testItems.find(...args);
	}
	async setup({ context, fields }) {
		context = context || this._graphServer.context;
		
		const result = await query({
			query : `
				mutation {
					auth {
						setup {
							${fields}
						}
					}
				}
			`,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = result.auth.setup;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
}

module.exports = AuthPrefix;