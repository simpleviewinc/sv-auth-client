const GraphServer = require("./GraphServer");
const privateMap = new WeakMap();

function AuthClientPrivate({ graphUrl, cacheDuration = 1000 * 60 * 60 }) {
	this.graphServer = new GraphServer({ graphUrl });
	this.cache = {};
	this.interval = setInterval(() => {
		const now = Date.now();
		for(var i in cache) {
			if (cache[i].created + (1000 * 60 * 60) < now) {
				delete cache[i];
			}
		}
	}, cacheDuration);
}

function AuthClient({ graphUrl, cacheDuration }) {
	privateMap[this] = new AuthClientPrivate({ graphUrl, cacheDuration });
}

Object.defineProperty(AuthClient.prototype, "cacheLength", {
	get : function() {
		return Object.keys(privateMap[this].cache).length;
	}
});

AuthClient.prototype.close = function() {
	clearInterval(privateMap[this].interval);
}

AuthClient.prototype.clearCache = function() {
	privateMap[this].cache = {};
}

AuthClient.prototype.getUser = async function({ acct_id, token }) {
	const { cache, graphServer } = privateMap[this];
	
	const cacheKey = `${token}_${acct_id}`;
	const cacheEntry = cache[cacheKey];
	if (cacheEntry !== undefined) {
		const cacheResult = await graphServer.users.check_token_cache({
			token,
			date : cacheEntry.created,
			acct_id,
			fields : `success message`
		});
		
		if (cacheResult.success === true) {
			return cacheEntry.user;
		}
	}
	
	const userResult = await graphServer.users.current({
		token,
		acct_id,
		fields : `
			success
			message
			doc {
				id
				acct_id
				firstname
				lastname
				email
				roles {
					id
					name
				}
				permissionJson
				active
			}
		`
	});
	
	if (userResult.success === false) {
		// if the user pull fails then either the user is wrong, the token is wrong
		// bottom line is that the current request should fail
		return;
	}
	
	cache[cacheKey] = {
		user : userResult.doc,
		created : new Date()
	}
	
	return userResult.doc;
}

module.exports = AuthClient;