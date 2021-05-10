const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class GraphAuthApi {
	constructor({ graphUrl, name, graphServer }) {
		this._graphUrl = graphUrl;
		this._name = name;
		this._graphServer = graphServer;
	}
	async find({ filter, options, fields, context, headers }) {
		const method = this._name;
		
		context = context || this._graphServer.context;
		
		const variables = {
			filter,
			options
		};
		
		const response = await query({
			query : `
				query($filter: auth_${method}_filter, $options: auth_${method}_options) {
					auth {
						${method}(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token,
			headers
		});
		
		const returnData = response.auth[this._name];
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async upsert({ input, fields, context, headers }) {
		const method = `${this._name}_upsert`;
		
		context = context || this._graphServer.context;
		
		const variables = {
			input
		}
		
		const response = await query({
			query : `
				mutation($input: auth_${method}!) {
					auth {
						${method}(input: $input) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token,
			headers
		});
		
		const returnData = response.auth[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async remove({ filter, fields, context, headers }) {
		const method = `${this._name}_remove`;
		
		context = context || this._graphServer.context;
		
		const variables = {
			filter
		}
		
		const response = await query({
			query : `
				mutation($filter: auth_${method}_filter!) {
					auth {
						${method}(filter: $filter) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token,
			headers
		});
		
		const returnData = response.auth[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
}

module.exports = GraphAuthApi;