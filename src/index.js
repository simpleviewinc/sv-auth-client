const browser = require("./browser");
const getDirectiveCheckPerm = require("./DirectiveCheckPerm");
const getDirectiveGetUser = require("./DirectiveGetUser");

module.exports = {
	...browser,
	getDirectiveCheckPerm,
	getDirectiveGetUser,
}