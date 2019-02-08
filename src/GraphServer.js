const files = [
	"accounts",
	"products",
	"roles",
	"users",
	"auth",
	"test"
]

function GraphServer({ graphUrl, context = {} }) {
	this.context = context;
	
	files.forEach(name => {
		const Api = require(`${__dirname}/graphql/${name}`);
		this[name] = new Api({ graphUrl, name, context : this.context });
	});
}

module.exports = GraphServer;