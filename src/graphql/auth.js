const { query } = require("../utils.js");

class Auth {
	constructor({ graphUrl, name, context }) {
		this.graphUrl = graphUrl;
		this.context = context;
	}
	async current({ acct_id, fields, context }) {
		context = context || this.context;
		
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
			url : this.graphUrl,
			token : context.token
		});
		
		return result.auth.current;
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
			url : this.graphUrl
		});
		
		return result.auth.update_password;
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
			url : this.graphUrl
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
			url : this.graphUrl
		});
		
		return result.auth.login_google;
	}
	async check_token_cache({ date, acct_id, fields, context }) {
		context = context || this.context;
		
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
			url : this.graphUrl,
			token : context.token
		});
		
		return result.auth.check_token_cache;
	}
}

module.exports = Auth;