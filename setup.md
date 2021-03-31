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

## Object Binding based permissions

### Overview

Object binding is used to assign permission to specific objects in your application, rather than blanket permissions across all objects. Using object binding properly requires thinking of the totality of your application as a tree of nodes. A user can be granted permission to any node or object in the tree and it will grant that permission to all objects on that same branch.

In practice, this permission philosophy is very similar to the way Google Drive functions. In Drive you can grant a user a role on a specific object (document, sheet, presentation) or you can grant it on a folder and every object in that folder inherits it or you can grant it on an entire drive, such as your personal drive or a drive created by a Gsuite Admin for a corporate account.

If you think about every object in your application, each object will have a globally unique identifier which can be expressed as a `node_type|node_id`, this is similar to table and id if using SQL or Mongo. So `dms.account|1` is the node_type `dms.account` with a `node_id` of `"1"`. You can also use this naming scheme to represent objects which do not have a database representation but exist in your object hierarchy. In example in CMS, the `cms.content_owner|svalbard` represents `node_type` of `cms.content_owner` and `node_id` of `svalbard`.

Lets look at an example object tree for DMS:

```
- root
    - dms.group|member_partner
        - dms.account|1
            - dms.listing|10
            - dms.listing|11
        - dms.account|2
            - dms.listing|20
    - dms.group|meeting_sales
        - dms.account|2
        - dms.account|3
    ...
```

If I'm attempting to return a list of `dms.account` to a user, the permission required is `dms.accounts.read`, then I need to determine all accounts that the current user has access to read. If we look at `dms.account|1` then read access to that object is granted by having access to `dms.account|1` OR `dms.group|member_partner` OR `root`. Likewise read access to `dms.account|2` is granted by read access to `dms.account|2` OR `dms.group|meeting_sales` OR `dms.group|member_partner` OR `root`.

`root` is equivalent to the basic permissions that exist in `Auth`, these are permissions granted by a user-level role.

We can look at another example from CMS:

```
- root
    - cms.content_owner|svalbard
        - cms.assets.images|1
        - cms.assets.documents|1
    - cms.content_owner|oslo
        - cms.assets.images|1
        - cms.collections.slides|1
    ...
```

### Best Practices and Key Concepts

* `node_type` must be a globally unique identifier across the company. The recommendation is that `node_type` is always constructed by `product.table` or something close. So `dms.accounts` is for the product `dms` on the table `accounts`, or `zerista.meeting` for the product `zerista` on the table `meeting`.
* `node_id` is a string and can store basically anything. It could be a string representation of a numeric SQL id or it could be the name for an entity which doesn't have a DB representation. When combined with `node_type` this should identify a specific object across the whole SV portfolio.
* Doing a singular action should always require ONE or more permissions AND'd together, never OR'd. So reading a `dms.account` should require `dms.accounts.read`. Deleting a `dms.account` may require `dms.account.read` AND `dms.account.remove`. You should never have a setup where an action is granted via OR'd permissions such as `dms.account.read` OR `dms.account.do_something_else`.
* Permissions are always granted, never revoked. In example if you grant a permission at an interim node in your tree, you should not revoke that permission on a deeper node.
* A specific node, can occur any number of times in your tree. In cases like that access is granted to it via access to ANY of the parents, not all or some of the parents.
* Your `node_type` should have a consistent hierarchy. For example if `root -> dms.group -> dms.account` exists in your application, you should never have a case where `root -> dms.account -> dms.group` exists. 

If need help modeling the objects in your application please reach out to Owen Allen or the Escher team for assistance in building out your graph. It's better to get it right from the start than have to refactor later.

### Implementation

1. Add the DirectiveCheckPerm and request the bindings you need. See the documentation on `DirectiveCheckPerm` and how to specify bindings. You will want to request all of the permissions and node_types that are applicable to this specific graphql endpoint. For example if you are displaying a DataView of `dms.accounts` you will will likely want something like:

```js
@prefix_checkPerm(bindings: { node_types : ["dms.accounts", "dms.groups"], perms : ["dms.accounts.read", "dms.accounts.write", "dms.accounts.remove"] })
```

This will allow you to determine which accounts to display as well as determine which users should have the `edit` and `remove` permissions on an account by account basis.

2. Use `user.canIds` for the current `node_type` and every `node_type` above that in the node tree.
3. Filter the query based on the ids.
4. When unit testing use an `sv` user and pass the header `x-sv-object-bindings` in your query to object_bindings_mine (or in your query which uses the DirectiveCheckPerm), and you can specify ad-hoc `permissionObj` returns this way you don't need a user/role for every unit test case. For example if you passed `x-sv-object-bindings: { "dms.accounts.read" : true }` it will behave as if the object_bindings_mine returned that same return.

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