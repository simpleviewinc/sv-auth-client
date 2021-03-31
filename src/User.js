const { canIds } = require("./utils");

class User {
	constructor(args) {
		Object.assign(this, args);
		
		this.permissionObj = JSON.parse(this.permissionJson);
		/**
		 * @type {import("./types").ObjectBindingsPermissionObj}
		 */
		this.permissionObjBindings;
	}
	can(perms) {
		var allowed = [];
		
		for(var perm of perms) {
			var terms = perm.split(".");
			var current = this.permissionObj;
			for(var [i, term] of Object.entries(terms)) {
				if (current[term] === undefined) {
					// user hit the end of their tree, doesn't have permission
					allowed.push(false);
					break;
				} else if (current[term] === true) {
					// user has the permission, or the tree has short-circuited to all perms
					allowed.push(true);
					break;
				} else if (Number(i) === terms.length - 1) {
					// if we have reached the last term and not found a permission, user lacks it
					allowed.push(false);
					break;
				} else {
					// recurse deeper
					current = current[term];
				}
			}
		}
		
		return allowed.indexOf(false) === -1;
	}
	/**
	 * Return what objects a user has this permission for the given node type
	 * @param {string} perm 
	 * @param {string} node_type 
	 */
	canIds(perm, node_type) {
		return canIds(perm, node_type, this.permissionObjBindings);
	}
	toJSON() {
		var temp = Object.assign({}, this);
		delete temp.permissionObj;
		
		return temp;
	}
	toPlain() {
		return JSON.parse(JSON.stringify(this));
	}
}

module.exports = User;