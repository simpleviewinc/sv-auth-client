# Integrating with SV-Auth

Ensure the following package dependencies are installed in your containers that need to communicate with auth.
	- `@simpleview/sv-auth-client`
	- `@simpleview/sv-graphql-client`

## Registering a Permissions for a Product on an Account

Permissions are registered to the unique combination of product and account in the Auth System. This is because not all accounts have the same features across a product and thus possible permissions may vary from account to account. When declaring permissions for an account/product object, entirety is defined via SV-Auth's `admin.products_usert` endpoint. This call should be made anytime the possible permissions for an account's product have changed. Additionally, this request requires a user token to be valid.

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


## Authenticating a User and Checking Permssions (Server-Side)
In order to integrate authentication with your graphQL resolves you will need to convert the `Authentication: Bearer` token into a `User` with permissions.

1. In your root graphQL server you will need to attach the token to the context, so it's accessible in your resolvers.

```js
const { getTokenFromHeaders } = require("@simpleview/sv-auth-client");
...
const server = new ApolloServer({
	...
	context: ({ req }) => {
		return {
			...
			token : getTokenFromHeaders(req.headers)
		};
	}
});
```

2. In most cases you'll want the root of your prefix to enforce the acct_id. It can be done with the following.

The `graphUrl` will depend on what auth server you are authenticating. In general the live server will be `graphql.simpleviewinc.com` but for bleeding edge features you may need to access other urls.

```javascript
const { AuthClient, getTokenFromHeaders } = require("@simpleview/sv-auth-client");
const authClient = new AuthClient({ graphUrl : "https://graphql.simpleviewinc.com/" });
```

You can convert the token into a user, ensuring they are logged into the Auth-System with the following code snippet:

When this function is executed it will take a token on the context, and convert it into a user on the context, or throw a permission error.

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

Utilize the `processToken` method in your root resolver for both query and mutation. Since `processToken` is called here any resolver deeper in the tree will have access to `context.user`.

```javascript
	const resolvers = {
		Query : {
			async MYPREFIX(parent, { acct_id }, context, info) {
				await processToken(acct_id, context);
				
				return {};
			}
		}
		...
	}
```

3. For endpoints that require a certain permission, user permissions can be checked via `context.user.can()` which takes an array of permission strings. 

```javascript
// resolver that requires permissions
async soemthing_that_requires_perms(parent, { acct_id }, { user }, info) {
	if (!user.can(["permission.name.here", "permission.another.here"])) {
		throw new Error("User lacks permission.")
	}

	// user has permission, do something...
}
```

## Authenticating a User and Checking Permssions (Client-Side)

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