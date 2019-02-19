const Products = require("./admin/products");
const Roles = require("./admin/roles");
const Users = require("./admin/users");

const apis = {
	products : Products,
	roles : Roles,
	users : Users
}

class AdminPrefix {
	constructor({ graphUrl, graphServer }) {
		this.name = "admin";
		
		for(let [name, Api] of Object.entries(apis)) {
			const api = new Api({ graphUrl, name, graphServer : graphServer });
			this[name] = api.find.bind(api);
			this[`${name}_upsert`] = api.upsert.bind(api);
			this[`${name}_remove`] = api.remove.bind(api);
		}
	}
}

module.exports = AdminPrefix;