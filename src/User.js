class User {
	constructor(args) {
		Object.assign(this, args);
		
		this.permissionObj = JSON.parse(this.permissionJson);
	}
	can(perms) {
		var allowed = [];
		
		for(var perm of perms) {
			var terms = perm.split(".");
			var current = this.permissionObj;
			for(var term of terms) {
				if (current[term] === undefined) {
					allowed.push(false);
					break;
				} else if (current[term] === true) {
					allowed.push(true);
					break;
				} else {
					current = current[term];
				}
			}
		}
		
		return allowed.indexOf(false) === -1;
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