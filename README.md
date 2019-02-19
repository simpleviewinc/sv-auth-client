# sv-graphql-client
Client for communicating with sv-graphql

# installation

```
npm install @simpleview/sv-graphql-client
```

# AuthClient

The `AuthClient` class is for communicating with the authentication system which provides some caching and ease of use for working with `User` objects.

## Usage in GraphQL Server-side

Add the token from the header into your context.
```js
const { getTokenFromHeaders } = require("@simpleview/sv-graphql-client");
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

In a resolver utilize `AuthClient.getUser()` to convert that token into a user. If you look at the `sv-auth` project you can see an example of this pattern. In that project TODO ADD URL, `admin` requires an acct_id and all child-resolvers will have the user already attached to the context.

## API

## AuthClient

`AuthClient` is a class for converting a `token` and an `acct_id` into an `auth_user` with permissions.

```js
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

```js
const user = authClient.getUser({
	token,
	acct_id : "0"
});
```

### AuthClient.close

If you are finished with an AuthClient instance, call `authClient.close()` in order to shut it down. Generally this is only needed in unit tests, otherwise there is an internal `setInterval` which will keep the process open.

## getTokenFromHeaders

Extracts the token from the `authorization` header.

```js
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

`GraphServer` is an API interface to communicate with the auth/admin system's graphQL server to make it a little bit easier to call the various methods.


* args
	* graphUrl - string - Fully qualified URL pointing to the graphURL server.
	* context - object - Context object used for handling token/acct_id
		* acct_id - string - The acct_id that the user is attempting to access. `acct_id` is required for any endpoints on `admin`.
		* token - string - The token returned from the auth system. Token is required for accessing any of the non-login mechanics.

If you need to set the context at run-time, you can manually update the context via setting `graphServer.context.acct_id = "x"`. You cannot set the `context` key to a new object or it will not function, manually updated or `Object.assign` you're changes in.

```
const { GraphServer } = require("@simpleview/auth-client");
// the GRAPH_URL is the graphQL server that you wish to communicate with. Get the proper URL from the sv-auth repository to align with the appropriate live/dev/staging resource.
const graphServer = new GraphServer({
	graphUrl : GRAPH_URL
});
```

The easiest way to find the endpoints on GraphServer is to either check the `src/graphql` or simply new the instance and console log.

Examples

```js
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