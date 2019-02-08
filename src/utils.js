const axios = require("axios");

async function query({ query, variables, url, token }) {
	let response;
	try {
		response = await axios({
			url,
			method : "post",
			headers : token ? {
				Authorization : `Bearer ${token}`
			} : undefined,
			data : {
				query,
				variables
			}
		});
	} catch(e) {
		console.log("e", e);
		console.log(e.response.data.errors);
		throw e;
	}
	
	if (response.data.errors !== undefined) {
		throw new Error(response.data.errors.map(val => val.message).join(", "));
	}
	
	return response.data.data;
}

function isPlainObject(obj) {
	return Object.getPrototypeOf(obj) === Object.prototype;
}

// Take an object with null values and recursively drop the null values. Useful for cleaning up graphQL responses.
function nullToUndefined(obj) {
	for(let i in obj) {
		if (obj[i] === null) {
			delete obj[i];
		} else if (obj[i] instanceof Array) {
			for (let [key, val] of Object.entries(obj[i])) {
				nullToUndefined(val);
			}
		} else if (isPlainObject(obj[i])) {
			nullToUndefined(obj[i]);
		}
	}
}

module.exports = {
	isPlainObject,
	query,
	nullToUndefined
}