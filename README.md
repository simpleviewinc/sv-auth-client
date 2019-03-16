# sv-auth-client

Client for communicating with sv-auth. This npm package contains classes and helpers for communicating with the sv-auth graphQL system.

There are 2 primary use-cases for `sv-auth-client`. One is in converting a `token` from GraphQL into a `User` so you can verify permission, the other is when wanting to access the `auth` or `admin` graphQL prefixes. For the `token` conversion, utilize `AuthClient` class. For the graphQL library utilize the `AuthPrefix` and `AdminPrefix`. See SETUP.md for instructions on integrating your repo with sv-auth-client.

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

# GraphQL Endpoints

This section is provided to provide additional information about the GraphQL endpoints. To see the input parameters and output of each endpoint, please view the Schema in the GraphQL Explorer at https://graphql.simpleviewinc.com/.


## auth_query
- **accounts**
	- Returns an array of accounts containing associated users and roles.
	- Filter will automatically include `acct_id` if user is not an SV employee.
	- Can either filter on acct_id or the internal stringified mongo ObjectId.
	- Bearer token must be provided in Authorization header.
	```
	query {
		admin {
			accounts {
				count
				docs {
					name
					active
				}
			}
		}
	}
	```

- **current**
	- Validates the provided token and returns the associated user object.
	- Returns a token invalid message if returned user is null.
	- This does not refresh the token.
	- Bearer token must be provided in Authorization header.
	```
	query {
		auth {
			current(acct_id : "0") {
				success
				message
				doc {
					firstname
					lastname
				}
			}
		}
	}
	```

- **check_token_cache**
	- Validates the provided token and checks the cache to verify it is stale and needs to be revalidated.
	- Returns a token invalid message if returned user is null.
	- Returns a cache invalid message if the cache has expired.
	- This does not refresh the token.
	- Bearer token must be provided in Authorization header.
	```
	auth {
		check_token_cache(date : "2019-03-15T23:51:17.019Z", acct_id : "0") {
			success
			message
		}
	}
	```

- **login**
	- Provided an email and password, logs a user in by returning a token.
	- Returns an invalid credentials error if login fails.
	```
	query {
		auth {
			login(email: "test0@test.com", password : "test"){
				token
				message
			}
		}
	}
	```

- **login_google**
	- Provided a Google token, logs a user in by returning an Auth token.
	- The input Google token is separate and not compatible with the Auth token.
	- Returns an invalid credentials error if login fails.
	- This endpoint should never be manually called.

## auth_mutation
- **accounts_upsert**
	- Provided an `acct_id` and account data, updates the associated account or inserts one if it does not exist.
	- This endpoint is restricted to SV employees only.
	- Bearer token must be provided in Authorization header.
	```
	mutation {
		auth {
			accounts_upsert(input : { acct_id : "999", name : "Test Account", active : true }) {
				success
				message
				doc {
					id
				}
			}
		}
	}
	```

- **reset_password_start**
	- Starts the process for reseting a user's password by sending an password reset email to the user.
	- Sent email contains a reset link that expires after 24 hours.
	- Returns a the resulting error if password reset email fails to send. See [sv-email-client](https://github.com/simpleviewinc/sv-email-client) for more info on email errors.
	```
	mutation {
		auth {
			reset_password_start(email : "test0@test.com", redirectUrl : "http://google.com") {
				success
				message
			}
		}
	}
	```

- **update_password**
	- Updates a user's password.
	- Requires the password be at least 8 characters long and is not common.
	- All passwords are salted, hashed, and irretrievable without original string.
	```
	mutation {
		auth {
			update_password(token : "XXXXXXXXXX", new_pass : "secure_password") {
				success
				message
			}
		}
	}
	```

## admin_query
- **products**
	- Returns all products and possible permissions for that product, for an account.
	- Filter will automatically include `acct_id` of the user.
	```
	query {
		admin(acct_id : "0") {
			products {
				count
				docs {
					name
				}
			}
		}
	}
	```

- **roles**
	- Returns all roles for an account.
	- Filter will automatically include `acct_id` of the user.
	```
	query {
		admin(acct_id : "0") {
			roles {
				count
				docs {
					name
					description
				}
			}
		}
	}
	```


- **users**
	- Returns all users on an account.
	- Filter will automatically include `acct_id` of the user.
	```
	query {
		admin(acct_id : "0") {
			users {
				count
				docs {
					firstname
					lastname
				}
			}
		}
	}
	```

## admin_mutation
- **products_upsert**
	- Provided an `acct_id` and product data, updates the associated product or inserts one if it does not exist.
	- This endpoint is used to define all possible permissions associated with a product belonging to an account. This is to say that possible permissions can vary from account to account for the same product.
	- This call should be made anytime the possible permissions for an account's product have changed.
	```
	mutation {
		admin(acct_id : "0") {
			products_upsert(input: { name : "prd", label : "Product", permissions : [
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

- **roles_upsert**
	- Provided an `id`, updates the associated role or inserts one if it does not exist.
	```
	mutation {
		admin(acct_id : "0") {
			roles_upsert(input : { name : "Nav Admin",  description : "Like a boss", permissions : [
				"cms.nav.primary.read",
				"cms.nav.primary.write",
				"cms.nav.primary.remove",
				"cms.nav.secondary.read",
				"cms.nav.secondary.write",
				"cms.nav.secondary.remove"
			]}) {
				success
				message
				doc {
					id
				}
			}
		}
	}
	```

- **roles_remove**
	- Deletes roles from the system.
	- Filter will automatically include `acct_id` of the user.
	- Take care not to call this endpoint without any filters as this will hard delete all roles on the account.
	```
	mutation {
		admin(acct_id : "0") {
			roles_remove(filter : { id : "5c8c3725df622c0064491fc9" }) {
				success
				message
			}
		}
	}
	```

- **users_upsert**
	- Provided an `email` and user data, updates the associated user or inserts one if it does not exist. 
	- This endpoint will send an invitational email to the provided email address. 
	```
	mutation {
		admin(acct_id : "0") {
			users_upsert(input : { email : "test@test.com", firstname : "Test", lastname : "User", active : true }) {
				success
				message
				doc {
					id
				}
			}
		}
	}
	```

- **users_remove**
	- Deletes users from the system.
	- Filter will automatically include `acct_id` of the user.
	- Take care not to call this endpoint without any filters as this will hard delete all users on the account.
	```
	mutation {
		admin(acct_id : "0") {
			users_remove(filter : { id : "5c8c37b5df622c0064491fca" }) {
				success
				message
			}
		}
	}
	```




# Development

* Enter dev environment - `sudo npm run docker`
* Test - `npm test`
* Publish - `sudo npm run publish -- SEMVER`