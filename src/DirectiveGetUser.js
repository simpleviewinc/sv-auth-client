const { SchemaDirectiveVisitor } = require("graphql-tools");
const { gql } = require("apollo-server");
const { defaultFieldResolver } = require("graphql");

const AuthClient = require("./AuthClient");

function getDirectiveGetUser({ name, graphUrl }){
	const authClient = new AuthClient({ graphUrl });
	
	class DirectiveGetUser extends SchemaDirectiveVisitor {
		visitFieldDefinition(field) {
			const { resolve = defaultFieldResolver } = field;
			const directiveArgs = this.args
			field.resolve = async function(parent, args, context, info) {
				// check the context token
				if (context.token === undefined) {
					throw new Error("User is not authorized to access this resource (ERR: 1000).");
				}

				// assign acct_id either based on the field acct_id or directive passed acct_id
				const acct_id = directiveArgs.acct_id !== undefined ? directiveArgs.acct_id : args.acct_id;
				// call getUser
				const user = await authClient.getUser({
					acct_id,
					token : context.token,
					headers: context.headers
				});

				if (user === undefined) {
					throw new Error("User is not authorized to access this resource (ERR: 1007).");
				}

				// assign user
				context.user = user;

				return await resolve.call(this, parent, args, context, info);
			}
		}
	}

	return {
		schemaDirectives : {
			[name] : DirectiveGetUser
		},
		typeDefs : gql`
			directive @${name}(
				acct_id: String
			) on FIELD_DEFINITION
		`
	}
}

module.exports = getDirectiveGetUser;