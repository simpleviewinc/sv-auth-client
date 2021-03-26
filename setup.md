# Integrating with SV-Auth

Ensure the following package dependencies are installed in your containers that need to communicate with auth.
- `@simpleview/sv-auth-client`
- `@simpleview/sv-graphql-client`

## Registering a Permissions for a Product on an Account

Permissions are registered to the unique combination of product and account in the Auth System. This is because not all accounts have the same features across a product and thus possible permissions may vary from account to account. When declaring permissions for an account/product object, entirety is defined via SV-Auth's `admin.products_usert` endpoint. This call should be made anytime the possible permissions for an account's product have changed. Additionally, this request requires a user token to be valid.

```js
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

2. Add an acct_id filter to your prefix, and use it to retrieve a `User` reference based on the passed in token.

The best way to do this is using `DirectiveGetUser` and filtering by acct_id at your root resolver. This will convert the incoming token into a user on your context. See usage instructions in the main readme.

3. Enforce permissions on specific resolvers.

To do this utilize the `DirectiveCheckPerm` on the various resolvers throughout your project. See usage instructions in the main readme.

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