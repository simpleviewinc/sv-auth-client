const GraphApi = require("../GraphApi");
const { query } = require("../utils.js");

class Users {
	constructor({ graphUrl, name }) {
		this.graphUrl = graphUrl;
		this.api = new GraphApi({ graphUrl, name });
	}
	find(args) {
		return this.api.find(args);
	}
	upsert(args) {
		return this.api.upsert(args);
	}
	remove(args) {
		return this.api.remove(args);
	}
	async current({ token, acct_id, fields }) {
		const result = await query({
			query : `
				query($token: String!, $acct_id: String!) {
					auth {
						users_current(token: $token, acct_id: $acct_id) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token,
				acct_id
			},
			url : this.graphUrl
		});
		
		return result.auth.users_current;
	}
	async update_password({ token, new_pass, fields }) {
		const result = await query({
			query : `
				mutation($token: String!, $new_pass: String!) {
					auth {
						users_update_password(token: $token, new_pass: $new_pass) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token,
				new_pass
			},
			url : this.graphUrl
		});
		
		return result.auth.users_update_password;
	}
	async login({ email, password, fields }) {
		const result = await query({
			query : `
				query($email: String!, $password: String!) {
					auth {
						users_login(email: $email, password: $password) {
							${fields}
						}
					}
					
				}
			`,
			variables : {
				email,
				password
			},
			url : this.graphUrl
		});
		
		return result.auth.users_login;
	}
	async login_google({ token, fields }) {
		const result = await query({
			query : `
				query($token: String!) {
					auth {
						users_login_google(token: $token) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token
			},
			url : this.graphUrl
		});
		
		return result.auth.users_login_google;
	}
	async check_token_cache({ token, date, acct_id, fields }) {
		const result = await query({
			query : `
				query($token: String!, $date: auth_date!, $acct_id: String!) {
					auth {
						users_check_token_cache(token: $token, date: $date, acct_id: $acct_id) {
							${fields}
						}
					}
				}
			`,
			variables : {
				token,
				date,
				acct_id
			},
			url : this.graphUrl
		});
		
		return result.auth.users_check_token_cache;
	}
}

module.exports = Users;