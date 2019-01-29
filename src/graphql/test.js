const { query } = require("../utils.js");

class Test {
	constructor({ graphUrl }) {
		this.graphUrl = graphUrl;
	}
	async reset_data() {
		const rtn = await query({
			query : `
				mutation {
					auth {
						test_reset_data {
							success
						}
					}
				}
			`,
			url : this.graphUrl
		});
		
		return rtn.auth.test_reset_data;
	}
}

module.exports = Test;