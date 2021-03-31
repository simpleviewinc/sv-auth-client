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

module.exports.canIds = canIds;