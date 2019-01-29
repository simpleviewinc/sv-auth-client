const { query } = require("./utils");

class GraphServer {
	constructor({ graphUrl }) {
		this.graphUrl = graphUrl;
	}
	async test_reset_data() {
		const response = await query({
			query : `
				mutation {
					auth {
						test_reset_data {
							success
							message
						}
					}
				}
			`,
			url : this.graphUrl
		});
		
		return response.auth.test_reset_data;
	}
	async users_check_token_cache({ token, date }) {
		const response = await query({
			query : `
				query($token: String!, $date: auth_date!) {
					auth {
						users_check_token_cache(token: $token, date: $date) {
							success
							message
						}
					}
				}
			`,
			variables : {
				token,
				date
			},
			url : this.graphUrl
		});
		
		return response.auth.users_check_token_cache;
	}
	async users_current({ token, acct_id }) {
		const response = await query({
			query : `
				query($token: String!, $acct_id: String!) {
					auth {
						users_current(token: $token, acct_id: $acct_id) {
							success
							message
							doc {
								acct_id
								firstname
								lastname
								email
								roles {
									id
									name
								}
								permissionJson
								active
							}
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
		
		return response.auth.users_current;
	}
	async users_login({ email, password }) {
		const response = await query({
			query : `
				query($email: String!, $password : String!) {
					auth {
						users_login(email: $email, password: $password) {
							success
							message
							token
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
		
		return response.auth.users_login;
	}
}

module.exports = GraphServer;