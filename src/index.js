const AuthClient = require("./AuthClient");
const AuthPrefix = require("./prefixes/AuthPrefix");
const AdminPrefix = require("./prefixes/AdminPrefix");
const User = require("./User");

function getTokenFromHeaders(headers) {
	if (!headers.authorization) {
		return;
	}
	
	return headers.authorization.replace(/^Bearer /, "");
}

async function commonPasswordCheck(val){
	// https://en.wikipedia.org/wiki/List_of_the_most_common_passwords#cite_note-splashdata2018-10
	// https://gizmodo.com/the-25-most-popular-passwords-of-2018-will-make-you-fee-1831052705
	// most common passwords 8 characters or longer.
	const commomPasswords = ["Password1", "password", "123456789", "12345678", "sunshine", "iloveyou", "princess", "football", "!@#$%^&*", "aa123456",  "password1", "qwerty123"]

	for(let password of commomPasswords) {
		if (password === val) {		
			return {
				valid : false,
				message : "This is a very common password. Choose something that will be harder for others to guess."
			}
		}
	}

	return { valid : true }
}

module.exports = {
	AuthClient,
	AuthPrefix,
	AdminPrefix,
	getTokenFromHeaders,
	User,
	commonPasswordCheck
}