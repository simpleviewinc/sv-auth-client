const { GraphServer } = require("@simpleview/sv-graphql-client");
const AuthPrefix = require("./prefixes/AuthPrefix");
const User = require("./User");

function AuthClient({ graphUrl, cacheDuration = 1000 * 60 * 60 }) {
	this._graphServer = new GraphServer({ graphUrl, prefixes : [AuthPrefix] });
	this._cache = {};
	this._interval = setInterval(() => {
		const now = Date.now();
		for(var i in this._cache) {
			if (this._cache[i].created + cacheDuration > now) {
				delete this._cache[i];
			}
		}
	}, cacheDuration);
}

Object.defineProperty(AuthClient.prototype, "cacheLength", {
	get : function() {
		return Object.keys(this._cache).length;
	}
});

AuthClient.prototype.close = function() {
	clearInterval(this._interval);
}

AuthClient.prototype.clearCache = function() {
	this._cache = {};
}

AuthClient.prototype.getUser = async function({ acct_id, token, headers }) {
	const cacheKey = `${token}_${acct_id}`;
	const cacheEntry = this._cache[cacheKey];
	if (cacheEntry !== undefined) {
		const cacheResult = await this._graphServer.auth.check_token_cache({
			date : new Date(cacheEntry.created).toISOString(),
			acct_id,
			fields : `success message`,
			context : {
				token
			}
		});
		
		if (cacheResult.success === true) {
			return cacheEntry.user;
		}
	}
	
	const userResult = await this._graphServer.auth.current({
		acct_id,
		fields : `
			success
			message
			doc {
				id
				sv
				acct_id
				firstname
				lastname
				email
				permissionJson
				active
			}
		`,
		context : {
			token
		}
	});
	
	if (userResult.success === false) {
		// if the user pull fails then either the user is wrong, the token is wrong
		// bottom line is that the current request should fail
		return;
	}

	if (userResult.doc.sv === true && headers !== undefined && headers["x-sv-permissionjson"] !== undefined){
		userResult.doc.sv = false
		userResult.doc.permissionJson = headers["x-sv-permissionjson"]
	}
	
	const user = new User(userResult.doc);
	
	this._cache[cacheKey] = {
		user,
		created : Date.now()
	}
	
	return user;
}

module.exports = AuthClient;