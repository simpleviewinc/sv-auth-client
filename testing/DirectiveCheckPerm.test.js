//@ts-check
const assert = require("assert");
const { ApolloServer, gql, AuthenticationError } = require('apollo-server');
const { query } = require("@simpleview/sv-graphql-client");

const getDirectiveCheckPerm = require("../src/DirectiveCheckPerm");
const getDirectiveGetUser = require("../src/DirectiveGetUser");
const testServers = require("../src/testServers");
const { getTokenFromHeaders } = require("../src/browser");

const authUrl = "https://graphql.kube.simpleview.io/link/auth-v2/";

const {
	schemaDirectives : checkPermSchemaDirectives,
	typeDefs : checkPermTypeDefs
} = getDirectiveCheckPerm({
	name : "checkPerm",
	graphUrl : authUrl
});

const {
	schemaDirectives : getUserSchemaDirectives,
	typeDefs : getUserTypeDefs
} = getDirectiveGetUser({
	name : "getUser",
	graphUrl : authUrl
});

const typeDefs = gql`
	type Query {
		basic: result
		withUser(acct_id: String!) : withUser @getUser
	}

	type withUser {
		enforce_sv : result @checkPerm(sv : true)
		enforce_perm : result @checkPerm(perms: ["admin.test.read"])
		enforce_perms : result @checkPerm(perms: ["admin.test.read", "dms.test.read"])
		get_bindings_perms : result @checkPerm(bindings: { perms : ["admin.access", "admin.read"] })
		get_bindings_node_types : result @checkPerm(bindings: { node_types : ["node.type.a"] })
	}

	type result {
		message: String
	}
`

const resolvers = {
	Query : {
		basic : function() {
			return { message : "basic" }
		},
		withUser : function() {
			return {};
		}
	},
	withUser : {
		enforce_sv : function() {
			return { message : "enforce_sv" }
		},
		enforce_perm : function() {
			return { message : "enforce_perm" }
		},
		enforce_perms : function() {
			return { message : "enforce_perms" }
		},
		get_bindings_perms : function(parent, args, context, info) {
			return { message : JSON.stringify(context.bindings) }
		},
		get_bindings_node_types : function(parent, args, context, info) {
			return { message : JSON.stringify(context.bindings) }
		}
	}
}

const server = new ApolloServer({
	typeDefs : [typeDefs, getUserTypeDefs, checkPermTypeDefs],
	resolvers,
	schemaDirectives : Object.assign({}, getUserSchemaDirectives, checkPermSchemaDirectives),
	context : ({ req }) => {
		const context = {
			token : getTokenFromHeaders(req.headers),
			headers : req.headers
		}

		return context;
	}
});

describe(__filename, function() {
	let graphUrl;

	before(async function() {
		this.timeout(5000);

		await testServers.init();
		
		await server.listen().then(({ url }) => {
			graphUrl = url;
		});
	});

	after(async function() {
		await server.stop();
	});

	it("should execute basic query", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					basic {
						message
					}
				}
			`
		});

		assert.deepStrictEqual(result, { basic : { message : "basic" } });
	});

	it("should fail if user lacks sv token", async function() {
		await assert.rejects(
			query({
				url : graphUrl,
				query : `
					query {
						withUser(acct_id : "test-0") {
							enforce_sv {
								message
							}
						}
					}
				`
			}),
			{
				name : "Error",
				message : "User is not authorized to access this resource (ERR: 1000)."
			}
		)
	});

	it("should succeed if user lacks sv token", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					withUser(acct_id : "test-0") {
						enforce_sv {
							message
						}
					}
				}
			`,
			token : testServers.authGraphServer.context.token
		});

		assert.deepStrictEqual(result, { withUser : { enforce_sv : { message : "enforce_sv" } } });
	});

	it("should fail if use lacks permission", async function() {
		await assert.rejects(
			query({
				url : graphUrl,
				query : `
					query {
						withUser(acct_id : "test-0") {
							enforce_perm {
								message
							}
						}
					}
				`,
				token : testServers.authGraphServer.context.token,
				headers : {
					"x-sv-permissionjson" : JSON.stringify({})
				}
			}),
			{
				name : "Error",
				message : "User is not authorized to access this resource (ERR: 1006)."
			}
		);
	});

	it("should succeed if use has permission", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					withUser(acct_id : "test-0") {
						enforce_perm {
							message
						}
					}
				}
			`,
			token : testServers.authGraphServer.context.token,
			headers : {
				"x-sv-permissionjson" : JSON.stringify({ "admin" : true })
			}
		});

		assert.deepStrictEqual(result, { withUser : { enforce_perm : { message : "enforce_perm" } } });
	});

	it("should fail if use lacks both permissions", async function() {
		await assert.rejects(
			query({
				url : graphUrl,
				query : `
					query {
						withUser(acct_id : "test-0") {
							enforce_perms {
								message
							}
						}
					}
				`,
				token : testServers.authGraphServer.context.token,
				headers : {
					"x-sv-permissionjson" : JSON.stringify({ "admin" : true })
				}
			}),
			{
				name : "Error",
				message : "User is not authorized to access this resource (ERR: 1006)."
			}
		);
	});

	it("should succeed if use has permission", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					withUser(acct_id : "test-0") {
						enforce_perms {
							message
						}
					}
				}
			`,
			token : testServers.authGraphServer.context.token,
			headers : {
				"x-sv-permissionjson" : JSON.stringify({ "admin" : true, "dms" : true })
			}
		});

		assert.deepStrictEqual(result, { withUser : { enforce_perms : { message : "enforce_perms" } } });
	});

	it("should get bindings when bound to perms", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					withUser(acct_id : "test-0") {
						get_bindings_perms {
							message
						}
					}
				}
			`,
			token : testServers.acct0test0.context.token
		});

		assert.deepStrictEqual(result, { withUser : { get_bindings_perms : { message : JSON.stringify({ "admin.access" : true, "admin.read" : true }) } } });
	});

	it("should get bindings when bound to node_type", async function() {
		const result = await query({
			url : graphUrl,
			query : `
				query {
					withUser(acct_id : "test-2") {
						get_bindings_node_types {
							message
						}
					}
				}
			`,
			token : testServers.acct0test0.context.token
		});

		assert.deepStrictEqual(result, { withUser : { get_bindings_node_types : { message : JSON.stringify({ "cms.assets.images.read" : { "node.type.a" : ["id1"] } }) } } });
	});
});