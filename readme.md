REPO MOVED into sv-auth, still on npm @simpleview/sv-auth-client .

# sv-auth-client

Client for communicating with sv-auth. This npm package contains classes and helpers for communicating with the sv-auth graphQL system.

Use cases include:
* Registering permissions on the auth system for your product.
* Working with tokens from the auth system.
* Wrapping the UI of your product behind the auth system.
* Converting a token into a user and checking their permissions.

[Changelog](changelog.md) - See the latest changes to sv-auth-client.

## Installation

```
npm install @simpleview/sv-auth-client
```

## Setup

For integrating your project with auth, please see the [Setup Instructions](setup.md).

# Package API

* [AuthClient](#AuthClient)
* [canIds](#canIds)
* [DirectiveGetUser](#DirectiveGetUser)
* [DirectiveCheckPerm](#DirectiveCheckPerm)
* [User](#User)

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
	* headers - object - HTTP headers, x-sv-permissionjson can be used for overwriting user permissions in unit tests.

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

## canIds(perm, node_type, bindings)

This function is identical to `User.canIds` but requires you to pass in the `bindings` manually, it should only be used in cases where you cannot use `DirectiveCheckPerm`. See the documentation for `User.canIds` for how it functions.

## DirectiveGetUser

`DirectiveGetUser` can be used to convert a token into a user session.

When using the directive, if your system passes the request headers object on context, you can utilize the header `x-sv-permissionjson` to set the permissions for a specific request. This is can only be used if the token is `sv : true` and it reduces the permissions of that specific request. This makes unit tests easier as you don't need to create roles and users for each specific cross section of permission testing.

### Adding DirectiveGetUser

The recommended approach is to split out a separate file in your schema to include the directive.

Note: You will need to provide `name`, which should be `PREFIX_getUser` and `graphUrl` which should point to the version of auth you are accessing.

```js
const {
	getDirectiveGetUser
} = require("@simpleview/sv-auth-client");

module.exports = getDirectiveGetUser({ name : NAME, graphUrl : AUTH_URL })

// example
module.exports = getDirectiveGetUser({ name : "redirects_checkPerm", graphUrl : "https://graphql.simpleviewinc.com/link/auth-v2/" })
```

If you are not using `schemaLoader`, `getDirectiveGetUser()` returns `{ schemaDirectives, typeDefs }` and you can manually integrate those with your existing directives and schema files.

### Using DirectiveGetUser

The directive is usually best applied to your root resolver, and requires that your root resolver has a acct_id has a top-level filter parameter. This is best used in conjunction with the `checkPerm` resolver to enforce the permissions on that user.

In the below example, the top-level prefix converts the token into a user, then the specific resolver enforces permissions based on that user.

```
query {
	prefix(acct_id: String): prefix_query @prefix_getUser
	
	type prefix_query {
		some_endpoint: some_result @prefix_checkPerm(sv: true)
	}
}
```

## DirectiveCheckPerm

`DirectiveCheckPerm` can be used to enforce permissions to access a resolver. It can enforce permissions based on `sv`, `permissions` or retrieve `object_bindings`.

### Adding the Directive
The recommended approach is to split out a separate file in your schema to include the directive.

Note: You will need to provide `name`, which should be `PREFIX_checkPerm` and `graphUrl` which should point to the version of auth you are accessing.

```js
const {
	getDirectiveCheckPerm
} = require("@simpleview/sv-auth-client");

module.exports = getDirectiveCheckPerm({ name : NAME, graphUrl : AUTH_URL });

// example
module.exports = getDirectiveCheckPerm({ name : "redirects_checkPerm", graphUrl : "https://graphql.simpleviewinc.com/link/auth-v2/" });
```

If you are not using `schemaLoader`, `getDirectiveGetUser()` returns `{ schemaDirectives, typeDefs }` and you can manually integrate those with your existing directives and schema files.

### Using the directive

* perms - [String] - An array of permissions this endpoint requires.
* sv - Boolean - Whether this endpoint requires an SV user.
* bindings
  *  perms - [String] - The permissions for bindings to return
  *  node_types - [String] - The node_types to return binding information on.

```
query {
	# require SV user
	some_query: some_result @prefix_checkPerm(sv: true)
	# require permission
	some_query: some_result @prefix_checkPerm(perms: ["foo"])
	# require multiple permissions
	some_query: some_result @prefix_checkPerm(perms: ["foo", "bar"])
	# pull in binding information
	some_query: some_result @prefix_checkPerm(bindings: { node_types : ["dms.accounts"] })
	some_query: some_result @prefix_checkPerm(bindings: { perms : ["dms.accounts.read", "dms.accounts.write"] })
	some_query: some_result @prefix_checkPerm(bindings: { node_types : ["dms.accounts", "dms.groups"], perms : ["dms.accounts.read", "dms.accounts.write", "dms.accounts.remove"] })
}
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

### User.canIds

This function is used for assisting in filtering down queries based on what IDs a user has access to for a given permission and node_type. In order to use this function you must specify `bindings` in the `DirectiveCheckPerm` for the graphql endpoint being executed. If you are not using that mechanic, then use the generic `canIds` function rather than the `User.canIds` variant.

Returns `true` if the user has root access to this permission/node_type.

Returns `false` if the user lacks all access to this permission/node_type. Note, that lacking access to this permission does not mean the user cannot see any of the content type, as they may have permissions to a node_type higher in the hierarchy.

Returns `string[]` of ids if the user has object bindings.

* perm - string - Name of the permission
* node_type - string - Name of the node_type to return the ids for.

```js
const account_ids = user.canIds("dms.accounts.read", "dms.account");
const group_ids = user.canIds("dms.accounts.read", "dms.group");

const result = await sqlQuery(`
	SELECT * FROM accounts a
	WHERE
		(
			@account_ids is null OR account_id IN (@account_ids)
			OR
			@group_ids is null OR group_id IN (@group_ids)
		)
`, {
	account_ids : account_ids === true ? null : account_ids,
	group_ids : group_ids === true ? null : group_ids
})
```

### User.toPlain

Convert the `User` object back to a plain JS object.

# GraphQL Endpoints

This section is provided to provide additional information about the GraphQL endpoints. To see the input parameters and output of each endpoint, please view the Schema in the GraphQL Explorer at https://graphql.simpleviewinc.com/.


## auth_query
- **accounts**
	- Returns an array of accounts containing associated users and roles.
	- If the user is not an SV employee, they will only receive the accounts they have access to. If they are an SV employee they will receive all accounts.
	- See schema browser for filters/options.
	- Bearer token must be provided in Authorization header.
	```
	query {
		auth {
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

- **account_public**
	- Returns a single account, able to be filtered by 'name' or 'acct_id'.
	- Does not require a token, publically accessible.
	```
	query {
		auth {
			account_public(filter: { name : 'test' }) {
				success
				message
				doc {
					acct_id
					name
					label
				}
			}
		}
	}
	```
	
- **current**
	- Retrieve the current user and their permissions for the specified account.
	- Returns a token invalid message if returned user is not valid for that account or the token is invalid.
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
	- Internal method used for validating caches. Should not be used in normal integrations.
	- Validates the provided token and checks the cache to verify it is stale and needs to be revalidated.
	- Success is true if the user exists and the cache entry is valid.
	- This does not refresh the token.
	- Bearer token must be provided in Authorization header.
	```
	query {
		auth {
			check_token_cache(date : "2019-03-15T23:51:17.019Z", acct_id : "0") {
				success
				message
			}
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
	- Converts a Google OAuth token into an auth token.
	- Returns an invalid credentials error if login fails.

- **login_service_account**
	- Login utilizing a GCP service account. The user will be granted SV permissions.
	- To obtain the credentials you will need the email and private_key from the service account. The `private_key` comes from the `private_key` field from the `.json` keyfile for the service account.

- **refresh_token**
	- Converts a refresh_token received from a login endpoint into a regular token.
	- The refresh_token is retrieved from a login attempt and can be stored long term in a secure location to exchange for a normal token at anytime.

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
	- Requires a password reset token and a new password that is 8 characters or longer and doesn't not match a too-simple password DB.
	- Passwords are stored salted, hashed, and are irretrievable.
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
	- See schema browser for filters/options.
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
	- See schema browser for filters/options.
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
	- See schema browser for filters/options.
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
	- This call can only be made by an `sv` user.
	- The permission object has a strict structure that must be followed.
		- Each permission starts with the product name and then drills down through `branch` permissions until it reaches a `leaf` permission.
		- If you have a permission called `product1.group1.group2.perm1` then `product1` must be the exact `name` of the product. `product1.group1`, `product1.group1.group2` and `product1.group1.group2.perm1` must all have their own entries in the array.
		- In the above example the permission `product1.group1` and `product1.group1.group2` are `branch` permissions. They must have a label and CANNOT have a permType. These branch permissions are used solely for organization and assisting the user in understanding your permission structure.
		- In the above example the permission `product1.group1.group2.perm1` is a `leaf` permission and must have a `permType`.
		- The order of the permissions in the array does not matter, but keeping them in a logical order in your code is preferable for your own sanity.
		- The product name must be all lowercase letters, numbers and dashes.
		- The permission name must be all lowercase letters, numbers and dashes separated by periods.
		- For each permission the permType must be `write`, `read`, or `remove`.
		- Description is optional. If specified the `leaf` or `branch` permission will received a tooltip in the UI to assist the user in understanding the permission or group.
	```
	mutation {
		admin(acct_id : "0") {
			products_upsert(input: { name : "my_product", label : "Product", permissions : [
				{ name : "prd.perm", label : "Permission Group" },
				{ name : "prd.perm.read", label : "Permission - Read", description : "This is a read permission", permType : "read" },
				{ name : "prd.perm.write", label : "Permission - Write", description : "This is a write permission", permType : "write" },
				{ name : "prd.perm.remove", label : "Permission - Remove", description : "This is a remove permission", permType : "remove" },
				{ name : "prd.group", label : "Another Group" },
				{ name : "prd.group.nested", label : "A group on a group" },
				{ name : "prd.group.nested.read", label : "Nested read permission", description : "Grants the user read on X", permType : "read" }
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
* Publish - `sudo npm run publish SEMVER`
