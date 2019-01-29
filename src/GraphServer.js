function GraphServer({ graphUrl }) {
	["account_products", "accounts", "roles", "test", "users"].forEach(name => {
		const Api = require(`${__dirname}/graphql/${name}`);
		this[name] = new Api({ graphUrl, name });
	});
}

module.exports = GraphServer;