const browser = require("./browser");
const DirectiveCheckPerm = require("./DirectiveCheckPerm");
const getDirectiveGetUser = require("./DirectiveGetUser");

module.exports = {
	...browser,
	getDirectiveGetUser,
	DirectiveCheckPerm
}