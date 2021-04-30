const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class OauthClients {
	constructor({ graphUrl, graphServer }) {
		this._graphUrl = graphUrl;
		this._graphServer = graphServer;
	}
	async find({ filter, options, fields, context }) {
		context = context || this._graphServer.context;
		
		const variables = {
			filter,
			options
		};
		
		const response = await query({
			query : `
				query($filter: auth_oauth_clients_filter, $options: auth_oauth_clients_options) {
					auth {
						oauth_clients(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.auth.oauth_clients;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async upsert({ input, fields, context }) {
		context = context || this._graphServer.context;
		
		const variables = {
			input
		}
		
		const response = await query({
			query : `
				mutation($input: auth_oauth_clients_upsert!) {
					auth {
						oauth_clients_upsert(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.auth.oauth_clients_upsert;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async remove({ filter, fields, context }) {
		context = context || this._graphServer.context;
		
		const variables = {
			filter
		}
		
		const response = await query({
			query : `
				mutation($filter: auth_oauth_clients_remove_filter!) {
					auth {
						oauth_clients_remove(filter: $filter) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});

		const returnData = response.auth.oauth_clients_remove;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
}

module.exports = OauthClients;