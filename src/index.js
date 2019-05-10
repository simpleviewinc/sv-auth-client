const browser = require("./browser");
const DirectiveCheckPerm = require("./DirectiveCheckPerm");
const DirectiveGetUser = require("./DirectiveGetUser");

module.exports = {
	...browser,
	DirectiveCheckPerm,
	DirectiveGetUser
}