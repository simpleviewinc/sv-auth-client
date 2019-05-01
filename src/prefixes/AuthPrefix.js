const Accounts = require("./auth/Accounts");
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
	async reset_password_start({ email, redirectUrl, fields }) {
		const result = await query({
			query : `
				mutation($email: String!, $redirectUrl: String!) {
					auth {
						reset_password_start(email: $email, redirectUrl: $redirectUrl) {
							${fields}
						}
					}
				}
			`,
			variables : {
				email,
				redirectUrl
			},
			url : this._graphUrl
		});
		
		return result.auth.reset_password_start;
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
	async login({ email, password, fields }) {
		const result = await query({
			query : `
				query($email: String!, $password: String!) {
					auth {
						login(email: $email, password: $password) {
							${fields}
						}
					}
					
				}
			`,
			variables : {
				email,
				password
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
	async login_service_account({ email, private_key, fields }) {
		const result = await query({
			query : `
				query($email: String!, $private_key: String!) {
					auth {
						login_service_account(email: $email, private_key: $private_key) {
							${fields}
						}
					}
				}
			`,
			variables : {
				email,
				private_key
			},
			url : this._graphUrl
		});
		
		return result.auth.login_service_account;
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
	async reset_data() {
		const rtn = await query({
			query : `
				mutation {
					auth {
						test_reset_data {
							success
						}
					}
				}
			`,
			url : this._graphUrl
		});
		
		return rtn.auth.test_reset_data;
	}
	async test_items(...args) {
		return this._testItems.find(...args);
	}
}

module.exports = AuthPrefix;