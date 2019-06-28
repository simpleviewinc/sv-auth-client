const browser = require("./browser");
const DirectiveCheckPerm = require("./DirectiveCheckPerm");
const getDirectiveGetUser = require("./DirectiveGetUser");
const Permissions = require('./permissions');

module.exports = {
	...browser,
	getDirectiveGetUser,
	DirectiveCheckPerm,
	Permissions
}
