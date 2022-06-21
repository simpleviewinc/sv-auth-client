/**
 * This function ensures that thrown errors from an async express handler are caught and properly passed on to next().
 * @param {import("./definitions").AsyncHandler} fn
 * */
 const asyncWrapper = function(fn) {
	const handler = async function(req, res, next) {
		try {
			await fn(req, res, next);
		} catch (e) {
			next(e);
		}
	}

	return handler;
}

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

module.exports.asyncWrapper = asyncWrapper;
module.exports.canIds = canIds;