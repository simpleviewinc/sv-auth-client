const { query, nullToUndefined } = require("./utils.js");

function GraphApi({ graphUrl, name }) {
	this.graphUrl = graphUrl;
	this.name = name;
}

GraphApi.prototype.find = async function({ filter, options, fields }) {
	const method = this.name;
	
	const variables = {
		filter,
		options
	};
	
	const response = await query({
		query : `
			query($filter: auth_${method}_filter, $options: auth_options) {
				auth {
					${method}(filter: $filter, options: $options) {
						${fields}
					}
				}
			}
		`,
		variables,
		url : this.graphUrl
	});
	
	const returnData = response.auth[this.name];
	
	nullToUndefined(returnData)
	
	return returnData;
}

GraphApi.prototype.upsert = async function({ input, fields }) {
	const method = `${this.name}_upsert`;
	
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
		url : this.graphUrl
	});
	
	return response.auth[method];
}

GraphApi.prototype.remove = async function({ filter, fields }) {
	const method = `${this.name}_remove`;
	
	const variables = {
		filter
	}
	
	const response = await query({
		query : `
			mutation($filter: auth_${method}_filter) {
				auth {
					${method}(filter: $filter) {
						${fields}
					}
				}
			}
		`,
		variables,
		url : this.graphUrl
	});
}

module.exports = GraphApi;