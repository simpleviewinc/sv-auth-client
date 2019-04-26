const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

class TestItems {
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
				query($filter: auth_test_items_filter, $options: auth_options) {
					auth {
						test_items(filter: $filter, options: $options) {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.auth.test_items;
		
		nullToUndefined(returnData)
		
		return returnData;
	}
}

module.exports = TestItems;