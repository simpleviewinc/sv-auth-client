//@ts-check
const { GraphServer } = require("@simpleview/sv-graphql-client");
const { SchemaDirectiveVisitor } = require("graphql-tools");
const { gql } = require("apollo-server");
const { defaultFieldResolver } = require("graphql");

const AdminPrefix = require("./prefixes/AdminPrefix");

function getDirectiveCheckPerm({ name, graphUrl }) {
	const graphServer = new GraphServer({ graphUrl, prefixes : [AdminPrefix] });;

	class DirectiveCheckPerm extends SchemaDirectiveVisitor {
		visitFieldDefinition(field) {
			const { resolve = defaultFieldResolver } = field;
			const directiveArgs = this.args;
			field.resolve = async function(parent, args, context, info) {
				// check if the resolver requires sv user
				if (directiveArgs.sv === true && context.user.sv !== true) {
					throw new Error("User is not authorized to access this resource (ERR: 1005).");
				}

				// check if the resolver requires specific permissions
				if (directiveArgs.perms !== undefined) {
					const allowed = context.user.can(directiveArgs.perms);
					if (allowed === false) {
						throw new Error("User is not authorized to access this resource (ERR: 1006).");
					}
				}

				if (directiveArgs.bindings !== undefined) {
					const headers = {};

					if (context.headers) {
						const allowedHeaders = ["x-sv-object-bindings"];
						for(let header of allowedHeaders) {
							if (context.headers[header]) {
								headers[header] = context.headers[header];
							}
						}
					}

					const bindings = await graphServer.admin.object_bindings_mine({
						filter : directiveArgs.bindings,
						fields : `
							success
							permissionObj
						`,
						context : {
							acct_id : context.user.acct_id,
							token : context.token
						},
						headers
					});

					if (bindings.success === false) {
						throw new Error("Unable to retrieve user bindings.");
					}

					context.user.permissionObjBindings = bindings.permissionObj;
				}

				return await resolve.call(this, parent, args, context, info);
			}
		}
	}

	return {
		schemaDirectives : {
			[name] : DirectiveCheckPerm
		},
		typeDefs : gql`
			directive @${name}(
				sv: Boolean
				perms: [String]
				bindings: ${name}_bindings
			) on FIELD_DEFINITION

			input ${name}_bindings {
				node_types: [String]
				perms: [String]
			}
		`
	};
}

module.exports = getDirectiveCheckPerm;
