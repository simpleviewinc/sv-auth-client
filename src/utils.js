/**
 * Return what objects a user has this permission for the given node type
 * @param {string} perm
 * @param {string} node_type
 * @param {import("./types").ObjectBindingsPermissionObj} bindings
 * @returns {true|false|string[]}
 */
function canIds(perm, node_type, bindings = {}) {
	if (bindings[perm] === undefined) {
		return false;
	}

	if (bindings[perm] === true) {
		return true;
	}

	const nodeData = bindings[perm][node_type];
	if (nodeData === undefined) {
		return false;
	}

	return nodeData;
}

function validateAuthUrl(authUrl) {
	const validUrls = [
		"https://auth.simpleviewinc.com/",
		"https://auth.dev.simpleviewinc.com/",
		"https://auth.qa.simpleviewinc.com/",
		"https://auth.kube.simpleview.io/"
	]
	
	if (validUrls.indexOf(authUrl) === -1) {
		throw new Error("authUrl must be one of " + validUrls.join(", "));
	}

	return true;
}

module.exports.canIds = canIds;
module.exports.validateAuthUrl = validateAuthUrl;