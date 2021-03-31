# sv-auth-client changelog

## 4.0.0

* BREAKING - All directives exported by sv-auth-client have been refactored to have a simpler usage pattern and support new features. To use the latest sv-auth-client you'll likely have to make some small tweaks in how you import those Directives into your project. See the readme for the proper install instructions for the directives.
* All directives are now exported by factory functions - `getDirectiveCheckPerm` and `getDirectiveGetUser`
* DirectiveCheckPerm - Now supports bindings for returning the state of the users `object_bindings`.
* Adds `user.canIds(perm, node_type)` for getting the valid IDs for perm/node_type endpoint.
* Adds `canIds(perm, node_type, bindings)` utility function for getting the valid IDs for a perm/node_type.