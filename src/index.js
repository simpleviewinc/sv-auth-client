const browser = require("./browser");
const DirectiveCheckPerm = require("./DirectiveCheckPerm");

module.exports = {
	...browser,
	DirectiveCheckPerm
}