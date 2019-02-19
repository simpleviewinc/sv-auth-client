function GraphServer({ graphUrl, prefixes, context = {} }) {
	this.context = context;
	
	prefixes.forEach(name => {
		const Prefix = require(`./prefixes/${name}`);
		this[name] = new Prefix({ graphUrl, name, graphServer : this });
	});
}

module.exports = GraphServer;