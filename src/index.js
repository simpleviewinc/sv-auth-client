const AuthClient = require("./AuthClient");
const AuthPrefix = require("./prefixes/AuthPrefix");
const AdminPrefix = require("./prefixes/AdminPrefix");
const User = require("./User");

function getTokenFromHeaders(headers) {
	if (!headers.authorization) {
		return;
	}
	
	return headers.authorization.replace(/^Bearer /, "");
}

module.exports = {
	AuthClient,
	AuthPrefix,
	AdminPrefix,
	getTokenFromHeaders,
	User
}