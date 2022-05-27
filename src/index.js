const browser = require("./browser");
const {
	canIds
} = require("./utils");
const getDirectiveCheckPerm = require("./DirectiveCheckPerm");
const getDirectiveGetUser = require("./DirectiveGetUser");
const oauth2 = require("./oauth2");

module.exports = {
	...browser,
	canIds,
	getDirectiveCheckPerm,
	getDirectiveGetUser,
	...oauth2,
}