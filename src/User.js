function User(args) {
	Object.assign(this, args);
	
	this.permissionObj = JSON.parse(this.permissionJson);
}

User.prototype.can = function(perms) {
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

User.prototype.toJSON = function() {
	var temp = Object.assign({}, this);
	delete temp.permissionObj;
	
	return temp;
}

User.prototype.toPlain = function() {
	return JSON.parse(JSON.stringify(this));
}

module.exports = User;