const { SchemaDirectiveVisitor } = require("graphql-tools");

class DirectiveCheckPerm extends SchemaDirectiveVisitor {
	visitFieldDefinition(field) {
		const { resolve = defaultFieldResolver } = field;
		const directiveArgs = this.args;
		field.resolve = async function(parent, args, context, info) {
			// check if the resolver requires sv user
			if (directiveArgs.sv === true && context.user.sv !== true) {
				throw new Error("User is not authorized to access this resource.");
			}
			
			// check if the resolver requires specific permissions
			if (directiveArgs.perms !== undefined) {
				const allowed = context.user.can(directiveArgs.perms);
				if (allowed === false) {
					throw new Error("User is not authorized to access this resource.");
				}
			}
			
			return await resolve.call(this, parent, args, context, info);
		}
	}
}

module.exports = DirectiveCheckPerm;