const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class Accounts {
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
				query($filter: auth_accounts_filter, $options: auth_accounts_options) {
					auth {
						accounts(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.auth.accounts;
		
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
				mutation($input: auth_accounts_upsert!) {
					auth {
						accounts_upsert(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.auth.accounts_upsert;
		
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
				mutation($filter: auth_accounts_remove_filter!) {
					auth {
						accounts_remove(filter: $filter) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});

		const returnData = response.auth.accounts_remove;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
}

module.exports = Accounts;