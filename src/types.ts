import { Request } from "express";

export interface ObjectBindingsPermissionObj {
	[key: string]: true | ObjectBindingsPermissionObjPerm
}

export interface ObjectBindingsPermissionObjPerm {
	[key: string]: string[]
}

export interface CreateParams {
	(req: Request): {
		product?: string
		account_name?: string
		acct_id?: string
	}
}

export type UnknownSession = InitialSession | LoggedInSession | undefined

export interface InitialSession {
	type: "initial"
	code_verifier: string
	state: string
}

export interface LoggedInSession {
	type: "logged_in"
	/** The time the session was created */
	created: number
	/** The time the token was created */
	token_created: number
	token: string
	refresh_token: string
	email: string
}
