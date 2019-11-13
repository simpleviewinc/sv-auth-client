const { query, GraphServer } = require("@simpleview/sv-graphql-client");
const { AuthClient, User, AdminPrefix, AuthPrefix, isCommonPassword } = require("../");
const assert = require("assert");
const mochaLib = require("@simpleview/mochalib");
const fs = require("fs");

const GRAPH_URL = "https://graphql.kube.simpleview.io/link/auth-v2/";

const graphServer = new GraphServer({ graphUrl : GRAPH_URL, prefixes : [AdminPrefix, AuthPrefix] });
const authClient = new AuthClient({ graphUrl : GRAPH_URL });

describe(__filename, function() {
	let login1;
	
	before(async function() {
		this.timeout(5000);
		
		const serviceJson = JSON.parse(fs.readFileSync(`${__dirname}/../auth_test.serviceAccount.json`));
		const serviceLogin = await graphServer.auth.login_service_account({
			input : {
				email : serviceJson.client_email,
				private_key : serviceJson.private_key
			},
			fields : `success message token`
		});
		
		assert.strictEqual(serviceLogin.success, true);
		
		const resetResult = await graphServer.auth.test_reset_data({
			context : {
				token : serviceLogin.token,
			},
			fields : `success message`
		});
		
		assert.strictEqual(resetResult.success, true);
		
		login1 = await graphServer.auth.login({
			input : {
				email : "test0@test.com",
				password : "test"
			},
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
			acct_id : "test-0"
		});
		
		const expectUser = {
			id : "000000000000000000000030",
			sv : false,
			acct_id : "test-0",
			firstname : "Test",
			lastname : "User",
			email : "test0@test.com",
			permissionJson : JSON.stringify({ admin : true, cms : true }),
			active : true
		}
		
		assert.strictEqual(user instanceof User, true);
		assert.deepStrictEqual(user.toPlain(), expectUser);
		assert.strictEqual(JSON.stringify(user), JSON.stringify(expectUser));
	});
	
	it("should return the same item from cache", async function() {
		const user = await authClient.getUser({
			token : login1.token,
			acct_id : "test-0"
		});
		
		assert.strictEqual(user.email, "test0@test.com");
		assert.strictEqual(authClient.cacheLength, 1);
		
		const user2 = await authClient.getUser({
			token : login1.token,
			acct_id : "test-0"
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
			acct_id : "test-0"
		});
		
		const user2 = await authClient.getUser({
			token : login1.token,
			acct_id : "test-0"
		});
		
		assert.strictEqual(user, user2);
		
		const upsertResult = await graphServer.admin.users_upsert({
			input : {
				id : user.id,
				firstname : "Changed",
				lastname : user.lastname,
				email : user.email,
				active : user.active
			},
			fields : `success message`,
			context : {
				acct_id : "test-0",
				token : login1.token
			}
		});
		
		const user3 = await authClient.getUser({
			token : login1.token,
			acct_id : "test-0"
		});
		
		assert.strictEqual(user3.firstname, "Changed");
		assert.notStrictEqual(user, user3);
		assert.strictEqual(authClient.cacheLength, 1);
	});
	
	it("should return undefined on bad token", async function() {
		assert.rejects(async () => {
			const user = await authClient.getUser({
				token : "bogus",
				acct_id : "test-0"
			});
		}, /User is not authorized to access this resource \(ERR: 1001\)\./);
	});

	it("should pass common password check", async function() {
		const password = await isCommonPassword("Password1@");
		
		assert.strictEqual(password, false);
	});

	it("should fail common password check", async function() {
		const password = await isCommonPassword("Password1");
		
		assert.strictEqual(password, true);
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
			},
			{
				name : "check non-leaf invalid",
				args : {
					json : {
						cms : {
							nav : {
								write : true
							}
						}
					},
					can : ["cms"],
					allow : false
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