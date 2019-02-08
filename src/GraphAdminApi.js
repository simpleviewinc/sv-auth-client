const { query, nullToUndefined } = require("./utils.js");

class GraphAdminApi {
	constructor({ graphUrl, name, context }) {
		this.graphUrl = graphUrl;
		this.name = name;
		this.context = context;
	}
	async find({ filter, options, fields, context }) {
		const method = this.name;
		
		context = context || this.context;
		
		const variables = {
			filter,
			options,
			acct_id : context.acct_id
		};
		
		const response = await query({
			query : `
				query($acct_id: String!, $filter: admin_${method}_filter, $options: auth_options) {
					admin(acct_id: $acct_id) {
						${method}(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this.graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[this.name];
		
		nullToUndefined(returnData)
		
		return returnData;
	}
	async upsert({ input, fields, context }) {
		const method = `${this.name}_upsert`;
		
		context = context || this.context;
		
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
			url : this.graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async remove({ filter, fields, context }) {
		const method = `${this.name}_remove`;
		
		context = context || this.context;
		
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
			url : this.graphUrl,
			token : context.token
		});
		
		const returnData = response.admin[method];
		
		nullToUndefined(returnData);
		
		return returnData;
	}
}

module.exports = GraphAdminApi;