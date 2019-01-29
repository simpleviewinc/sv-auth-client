# sv-auth-client
Client for communicating with sv-auth

## installation

```
npm install @simpleview/auth-client
```

## AuthClient

`AuthClient` is a class for converting a `token` into an `auth_user` with permissions associated with an `acct_id`.

```
const { AuthClient } = require("@simpleview/auth-client");
// the GRAPH_URL is the graphQL server that you wish to communicate with. Get the proper URL from the sv-auth repository to align with the appropriate live/dev/staging resource.
const authClient = new AuthClient({ graphUrl : GRAPH_URL });
```

### AuthClient.getUser

This method wraps the call to `auth.users_current` in a caching layer to ensure that it's optimal performance and is properly updating if a user's permissions have changed.

Generally you will want to make this call very early in your GraphQL stack in order to make the user available on context for all calls to access.

* args
	* token - string - The jwt token retrieved from the the auth system.
	* acct_id - string - The acct_id that you need to retrieve the user for.

Returns `auth_user`.

```
const user = authClient.getUser({
	token,
	acct_id : "0"
});
```

### AuthClient.close

If you are finished with an AuthClient instance, call `authClient.close()` in order to shut it down. Generally this is only needed in unit tests, otherwise there is an internal `setInterval` which will keep the process open.

## getTokenFromHeaders

Extracts the token from the `authorization` header.

```
const { getTokenFromHeaders } = require("@simpleview/auth-client");

const server = new ApolloServer({
	...
	context: ({ req }) => {
		return {
			token : getTokenFromHeaders(req.headers)
		};
	}
});
```

## GraphServer

`GraphServer` is an API interface to communicate with the graphQL server to make it a little bit easier to call the various methods.

```
const { GraphServer } = require("@simpleview/auth-client");
// the GRAPH_URL is the graphQL server that you wish to communicate with. Get the proper URL from the sv-auth repository to align with the appropriate live/dev/staging resource.
const graphServer = new GraphServer({ graphUrl : GRAPH_URL });
```

The easiest way to find the endpoints on GraphServer is to either check the `src/graphql` or simply new the instance and console log.

Examples

```
const result = await graphServer.users.login({
	email : "x",
	password : "y",
	fields : "success message"
});

const result = await graphServer.roles.find({
	filter : {
		acct_id : "0"
	},
	fields : `
		docs {
			id
			name
			...
		}
		count
	`
});
```

For the available fields on each call you can reference the GraphQL schema via the schema browser.