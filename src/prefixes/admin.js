const files = [
	"products",
	"roles",
	"users"
]

class AdminPrefix {
	constructor({ graphUrl, graphServer }) {
		files.forEach(name => {
			const Api = require(`./admin/${name}`);
			const api = new Api({ graphUrl, name, graphServer : graphServer });
			
			this[name] = api.find.bind(api);
			this[`${name}_upsert`] = api.upsert.bind(api);
			this[`${name}_remove`] = api.remove.bind(api);
		});
	}
}

module.exports = AdminPrefix;