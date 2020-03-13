const Products = require("./admin/Products");
const Roles = require("./admin/Roles");
const Users = require("./admin/Users");
const { query, nullToUndefined } = require("@simpleview/sv-graphql-client");

const apis = {
	products : Products,
	roles : Roles,
	users : Users
}

class AdminPrefix {
	constructor({ graphUrl, graphServer }) {
		this.name = "admin";
		
		this._graphUrl = graphUrl;
		this._graphServer = graphServer;
		
		for(let [name, Api] of Object.entries(apis)) {
			const api = new Api({ graphUrl, name, graphServer : graphServer });
			this[name] = api.find.bind(api);
			this[`${name}_upsert`] = api.upsert.bind(api);
			this[`${name}_remove`] = api.remove.bind(api);
		}
	}
	async users_import({fields, context }) {
		context = context || this._graphServer.context;
		
		const variables = {
			acct_id : context.acct_id
		}
		
		const response = await query({
			query : `
				mutation($acct_id: String!) {
					admin(acct_id: $acct_id) {
						users_import{
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin.users_import;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async users_send_invitation({ input, fields, context }) {
		context = context || this._graphServer.context;
		
		const variables = {
			input,
			acct_id : context.acct_id
		}
		
		const response = await query({
			query : `
				mutation($acct_id: String!, $input: admin_users_send_invitation_input!) {
					admin(acct_id: $acct_id) {
						users_send_invitation(input: $input){
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = response.admin.users_send_invitation;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
	async setup({ context, fields }) {
		context = context || this._graphServer.context;
		
		const variables = {
			acct_id : context.acct_id
		}
		
		const result = await query({
			query : `
				mutation($acct_id: String!) {
					admin(acct_id: $acct_id) {
						setup {
							${fields}
						}
					}
				}
			`,
			variables,
			url : this._graphUrl,
			token : context.token
		});
		
		const returnData = result.admin.setup;
		
		nullToUndefined(returnData);
		
		return returnData;
	}
}

module.exports = AdminPrefix;