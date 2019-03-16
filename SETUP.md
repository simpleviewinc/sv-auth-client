# Example Application

This application creates a simple Kubernetes service and deployment. It is intended to demonstrate what a minimal kubernetes deployment that connects to the SV Auth System may look like. This example application:
- registers a simple permission with the auth system
- ensures users must be logged-in
- requires the registered permission in order to run the test endpoint

## Integrating with SV-Auth
1. Ensure the following package dependencies are installed
	- `@simpleview/sv-auth-client`
	- `@simpleview/sv-graphql-client`

### Registering a Permissions for a Product on an Account
1. Permissions are registered to the unique combination of product and account in the Auth System. This is because not all accounts have the same features across a product and thus possible permissions may vary from account to account. When declaring permissions for an account/product object, entirety is defined via SV-Auth's `admin.products_usert` endpoint. This call should be made anytime the possible permissions for an account's product have changed. Additionally, this request requires a user token to be valid.
	```javascript
	const { AdminPrefix } = require("@simpleview/sv-auth-client");
	const { GraphServer } = require("@simpleview/sv-graphql-client");
	const graphServer = new GraphServer({ graphUrl : GRAPH_URL, prefixes : [AdminPrefix] });

	const result = await graphServer.admin.products_upsert({
		fields : "success message",
		input : {
			name : "prd_abbr",
			label : "Product Name",
			permissions : [
				{ name : "perm", label : "Permission Group" },
				{ name : "perm.read", label : "Permission - Read", description : "This is a read permission", permType : "read" },
				{ name : "perm.write", label : "Permission - Write", description : "This is a write permission", permType : "write" },
				{ name : "perm.remove", label : "Permission - Remove", description : "This is a remove permission", permType : "remove" },
			],
			fields : "success message",
			context : {
				acct_id : ACCT_ID,
				token : TOKEN
			}
		}
	});
	```
	This is the graphql equivalent of:
	```javascript
	mutation {
		admin(acct_id : "0") {
			products_upsert(input: { name : "prd_abbr", label : "Product Name", permissions : [
				{ name : "perm", label : "Permission Group" },
				{ name : "perm.read", label : "Permission - Read", description : "This is a read permission", permType : "read" },
				{ name : "perm.write", label : "Permission - Write", description : "This is a write permission", permType : "write" },
				{ name : "perm.remove", label : "Permission - Remove", description : "This is a remove permission", permType : "remove" },
			]}){
				success
				message
			}
		}
	}
	```
	Some important things to note are:
	- Permission groups can be nested infinitely.
	- Only permTypes `read`, `write`, and `remove` are valid. 


### Authenticating a User and Checking Permssions (Server-Side)
1. In the file with your graphql resolvers, require in sv-auth-client and construct it like so:
	```javascript
	const { AuthClient, getTokenFromHeaders } = require("@simpleview/sv-auth-client");
	const authClient = new AuthClient({ graphUrl : "https://graphql.kube.simpleview.io/" });
	```
1. You can convert the token into a user, ensuring they are logged into the Auth-System with the following code snippet:
	```javascript
	async function processToken(acct_id, context) {
		if (context.token === undefined) {
			throw new AuthenticationError("User is not authorized to access this resource.");
		}
		
		const user = await authClient.getUser({
			acct_id,
			token : context.token
		});

		if (user === undefined) {
			throw new AuthenticationError("User is not authorized to access this resource.");
		}
		
		context.user = user;
	}
	```
1. The `processToken` function from the above code snippet can be used in endpoints that require authentication, as seen below. This, being the root_prefix for the product, will ensure that all child endpoints of type `Query` require authentication. 
	```javascript
	const resolvers = {
		Query : {
			async root_prefix(parent, { acct_id }, context, info) {
				await processToken(acct_id, context);
				
				return {};
			}
		},
		// ...
	}
	```
1. For endpoints that require a certain permission, user permissions can be checked via `AuthClient.can()` which takes an array of permission strings. 
	```javascript
	// resolver that requires permissions
	async soemthing_that_requires_perms(parent, { acct_id }, context, info) {
		const user = await processToken(acct_id, context);

		if (!user.can(["permission.name.here", "permission.another.here"])) {
			throw new Error("User lacks permission.")
		}

		// user has permission, do something...
	}
	```

### Authenticating a User and Checking Permssions (Client-Side)
1. In cases where client-side authentication is necessary, the following code snippet may be used to verify a user is authenticated. Un-authenticated users are redirected to the Auth System's login screen upon hitting this page.
	```html
	<!doctype html>
	<html>
		<head>
			<script src="https://auth.simpleviewinc.com/static/auth.js"></script>
			<script>
				var auth = new sv_auth.Website();
				auth.getToken().then(function(token) {
					console.log("GOT A TOKEN", token);
				});
			</script>
		</head>
		<body>
			<p>Logged in!</p>
		</body>
	</html>
	```