//@ts-check
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

	// unref the interval so that it doesn't keep the process open
	this._interval.unref();
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

AuthClient.prototype._getUserDoc = async function({ acct_id, token }) {
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
			cacheEntry.hits++;
			return cacheEntry.user;
		} else {
			delete this._cache[cacheKey];
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
				auth_user_id {
					type
					value
				}
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
	
	this._cache[cacheKey] = {
		user : userResult.doc,
		created : Date.now(),
		hits : 0
	}

	return userResult.doc;
}

AuthClient.prototype.getUser = async function({ acct_id, token, headers }) {
	let doc = await this._getUserDoc({ acct_id, token });

	if (doc === undefined) {
		return;
	}

	if (doc.sv === true && headers !== undefined && headers["x-sv-permissionjson"] !== undefined) {
		// re-create the userDoc with the new values so we don't incorrectly alter the cache entry
		doc = {
			...doc,
			sv : false,
			permissionJson : headers["x-sv-permissionjson"]
		}
	}

	const user = new User(doc);

	return user;
}

module.exports = AuthClient;