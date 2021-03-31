const browser = require("./browser");
const {
	canIds
} = require("./utils");
const getDirectiveCheckPerm = require("./DirectiveCheckPerm");
const getDirectiveGetUser = require("./DirectiveGetUser");

module.exports = {
	...browser,
	canIds,
	getDirectiveCheckPerm,
	getDirectiveGetUser,
}