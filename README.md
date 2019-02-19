# sv-auth-client

Client for communicating with sv-auth. This npm package contains classes and helpers for communicating with the sv-auth graphQL system.

There are 2 primary use-cases for `sv-auth-client`. One is in converting a `token` from GraphQL into a `User` so you can verify permission, the other is when wanting to access the `auth` or `admin` graphQL prefixes. For the `token` conversion, utilize `AuthClient` class. For the graphQL library utilize the `AuthPrefix` and `AdminPrefix`.

# Installation

```
npm install @simpleview/sv-auth-client
```

## Usage in GraphQL Server-side

For your GraphQL endpoint, if you require authentication, which you should, you will need to extract the token from the server headers passed from `sv-graphql`.

Add the token from the header into your context.
```js
const { getTokenFromHeaders } = require("@simpleview/sv-auth-client");
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

Next once the token is extracted, you will need to convert that token into a user. In order to convert a token into a user you will need the `token` and an `acct_id`. How you do this depends on the semantics of your GraphQL routes.

```js
const { AuthClient } = require("@simpleview/sv-auth-client");
const authClient = new AuthClient({ graphUrl : GRAPH_URL });

... in a resolver
const user = await authClient.getUser({
	token : "X",
	acct_id : "Y"
});
```

An example of this is in the `sv-auth` repo in it's [GraphQL admin Query and Mutation resolvers](https://github.com/simpleviewinc/sv-auth/blob/master/containers/graphql/lib/graphql/root_admin.js). In utilizes `processToken` for both Mutation and Query to verify the token is passed. In that case, it has a filter argument of acct_id in order to recurse deeper into the GraphQL tree. In your case, you will need a real graphUrl, this only uses a localhost URL because it is the auth system querying itself.

# Package API

## AuthClient

The `AuthClient` class is for communicating with the authentication system which provides some caching and ease of use for working with `User` objects.

* args
	* graphUrl - The URL of graphQL server that you wish to communicate with. Most implementations should likely point to the live graphQL endpoint at https://graphql.simpleviewinc.com/.
	* cacheDuration - The duration of how long cache entries should remain in the AuthClient cache. Defaults to 1 hour, generally you should not pass this setting unless unit testing.

### AuthClient.getUser

This method wraps the call to `auth.users_current` in a caching layer to ensure that it's performant and is properly updating if a user's permissions have changed.

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
const { getTokenFromHeaders } = require("@simpleview/sv-auth-client");
const server = new ApolloServer({
	...
	context: ({ req }) => {
		return {
			token : getTokenFromHeaders(req.headers)
		};
	}
});
```

## AdminPrefix

`AdminPrefix` can be loaded into the `sv-graphql-client` `GraphServer` to use as a client library for accessing `admin` in GraphQL.

```js
const { AdminPrefix } = require("@simpleview/sv-auth-client");
const { GraphServer } = require("@simpleview/sv-graphql-client");
const graphServer = new GraphServer({ graphUrl : GRAPH_URL, prefixes : [AdminPrefix] });
```

## AuthPrefix

`AdminPrefix` can be loaded into the `sv-graphql-client` `GraphServer` to use as a client library for accessing `auth` in GraphQL.

```js
const { AuthPrefix } = require("@simpleview/sv-auth-client");
const { GraphServer } = require("@simpleview/sv-graphql-client");
const graphServer = new GraphServer({ graphUrl : GRAPH_URL, prefixes : [AuthPrefix] });
```

## User

`User` is is returned by `AuthClient.getUser` but it can also be used without `AuthClient` when you want to convert the return from `auth.current` into a user which you wish to check permissions on.

```js
const { User } = require("@simpleview/sv-auth-client");
const result = await graphServer.auth.current({
	acct_id : "0",
	fields : `
		success
		message
		doc {
			permissionJson
		}
	`
});
const user = new User(result.doc);
user.can(["some.perm.name"]);
```

### User.can

* perms - array of strings - Returns boolean whether user has all requested permissions.

```js
const allow = user.can(["cms.something.another", "cms.another.permission"]);
```

### User.toPlain

Convert the `User` object back to a plain JS object.