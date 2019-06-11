const { SchemaDirectiveVisitor } = require("graphql-tools");
const AuthClient = require("./AuthClient");

function getDirectiveGetUser(graphUrl){
    
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
                    token : context.token
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

    return DirectiveGetUser
}

module.exports = getDirectiveGetUser; 