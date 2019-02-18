const { query } = require("../src/utils");
const { AuthClient, GraphServer, User } = require("../");
const assert = require("assert");
const mochaLib = require("@simpleview/mochalib");

const GRAPH_URL = "https://graphql.kube.simpleview.io/";

const graphServer = new GraphServer({ graphUrl : GRAPH_URL });
const authClient = new AuthClient({ graphUrl : GRAPH_URL });

describe(__filename, function() {
	let login1;
	
	before(async function() {
		await graphServer.test.reset_data();
		login1 = await graphServer.auth.login({
			email : "test0@test.com",
			password : "test",
			fields : `success message token`
		});
	});
	
	beforeEach(async function() {
		authClient.clearCache();
	});
	
	after(async function() {
		authClient.close();
	});
	
	it("should return user from cache", async function() {
		const user = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		const expectUser = {
			id : "000000000000000000000030",
			sv : false,
			acct_id : "0",
			firstname : "Test",
			lastname : "User",
			email : "test0@test.com",
			permissionJson : JSON.stringify({ cms : true }),
			active : true
		}
		
		assert.strictEqual(user instanceof User, true);
		assert.deepStrictEqual(user.toPlain(), expectUser);
		assert.strictEqual(JSON.stringify(user), JSON.stringify(expectUser));
	});
	
	it("should return the same item from cache", async function() {
		const user = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		assert.strictEqual(user.email, "test0@test.com");
		assert.strictEqual(authClient.cacheLength, 1);
		
		const user2 = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		assert.strictEqual(user2.email, "test0@test.com");
		assert.strictEqual(authClient.cacheLength, 1);
		
		// by strictEqual checking user and user2 we prove it came from cache as we were returned
		// the same by-reference entity
		assert.strictEqual(user, user2);
	});
	
	it("should bypass cache on user change", async function() {
		const user = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		const user2 = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		assert.strictEqual(user, user2);
		
		const upsertResult = await graphServer.users.upsert({
			input : {
				id : user.id,
				firstname : "Changed",
				lastname : user.lastname,
				email : user.email,
				active : user.active
			},
			fields : `success message`,
			context : {
				acct_id : "0",
				token : login1.token
			}
		});
		
		const user3 = await authClient.getUser({
			token : login1.token,
			acct_id : "0"
		});
		
		assert.strictEqual(user3.firstname, "Changed");
		assert.notStrictEqual(user, user3);
		assert.strictEqual(authClient.cacheLength, 1);
	});
	
	it("should return undefined on bad token", async function() {
		const user = await authClient.getUser({
			token : "bogus",
			acct_id : "0"
		});
		
		assert.strictEqual(user, undefined);
	});
	
	describe("User.can", function() {
		const tests = [
			{
				name : "root valid",
				args : {
					json : { cms : true },
					can : ["cms"],
					allow : true
				}
			},
			{
				name : "root undefined",
				args : {
					json : { cms : true },
					can : ["crm"],
					allow : false
				}
			},
			{
				name : "root empty",
				args : {
					json : {},
					can : ["cms"],
					allow : false
				}
			},
			{
				name : "check multiple valid",
				args : {
					json : { cms : true, crm : true },
					can : ["cms", "crm"],
					allow : true
				}
			},
			{
				name : "check multiple invalid",
				args : {
					json : { cms : true },
					can : ["cms", "crm"],
					allow : false
				}
			},
			{
				name : "check nested valid",
				args : {
					json : { cms : { nav : { read : true } } },
					can : ["cms.nav.read"],
					allow : true
				}
			},
			{
				name : "check nested invalid",
				args : {
					json : { cms : { nav : { write : true } } },
					can : ["cms.nav.read"],
					allow : false
				}
			},
			{
				name : "check multiple nested",
				args : {
					json : {
						cms : {
							nav : {
								write : true
							}
						},
						crm : {
							accounts : {
								read : true
							}
						}
					},
					can : ["cms.nav.write", "crm.accounts.read"],
					allow : true
				}
			}
		]
		
		mochaLib.testArray(tests, function(test) {
			const user = new User({
				permissionJson : JSON.stringify(test.json)
			});
			
			const result = user.can(test.can);
			
			assert.strictEqual(result, test.allow);
		});
	});
});