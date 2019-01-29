const GraphApi = require("../GraphApi");

class Roles {
	constructor({ graphUrl, name }) {
		this.api = new GraphApi({ graphUrl, name });
	}
	find(args) {
		return this.api.find(args);
	}
	upsert(args) {
		return this.api.upsert(args);
	}
	remove(args) {
		return this.api.remove(args);
	}
}

module.exports = Roles;