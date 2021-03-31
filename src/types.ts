export interface ObjectBindingsPermissionObj {
	[key: string]: true | ObjectBindingsPermissionObjPerm
}

export interface ObjectBindingsPermissionObjPerm {
	[key: string]: string[]
}