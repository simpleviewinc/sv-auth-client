const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class GraphAdminApi {
	constructor({ graphUrl, name, graphServer }) {
		this._graphUrl = graphUrl;
		this._name = name;
		this._graphServer = graphServer;
	}
	async find({ filter, options, fields, context }) {
		const method = this._name;
		
		context = context || this._graphServer.context;
		
		const variables = {
			filter,
			options,
			acct_id : context.acct_id
		};
		
		const response = await query({
			query : `
				query($acct_id: String!, $filter: admin_${method}_filter, $options: admin_${method}_options) {
					admin(acct_id: $acct_id) {
						${method}(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[this._name];
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async upsert({ input, fields, context }) {
		const method = `${this._name}_upsert`;
		
		context = context || this._graphServer.context;
		
		const variables = {
			input,
			acct_id : context.acct_id
		}
		
		const response = await query({
			query : `
				mutation($acct_id: String!, $input: admin_${method}!) {
					admin(acct_id: $acct_id) {
						${method}(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async remove({ filter, fields, context }) {
		const method = `${this._name}_remove`;
		
		context = context || this._graphServer.context;
		
		const variables = {
			filter,
			acct_id : context.acct_id
		}
		
		const response = await query({
			query : `
				mutation($acct_id: String!, $filter: admin_${method}_filter) {
					admin(acct_id: $acct_id) {
						${method}(filter: $filter) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async import({fields, context }) {
		const method = `${this._name}_import`;
		
		context = context || this._graphServer.context;
		
		const variables = {
			acct_id : context.acct_id
		}
		
		const response = await query({
			query : `
				mutation($acct_id: String!) {
					admin(acct_id: $acct_id) {
						${method}{
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
}

module.exports = GraphAdminApi;