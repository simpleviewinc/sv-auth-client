# sv-auth-client changelog

## 4.0.0

* BREAKING - All directives exported by sv-auth-client have been refactored to have a simpler usage pattern and support new features. To use the latest sv-auth-client you'll likely have to make some small tweaks in how you import those Directives into your project. See the readme for the proper install instructions for the directives.
* All directives are now exported by factory functions - `getDirectiveCheckPerm` and `getDirectiveGetUser`
* DirectiveCheckPerm - Now supports bindings for returning the state of the users `object_bindings`.