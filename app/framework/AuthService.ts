import {Injectable, Inject} from "@angular/core";
import {FirebaseAuthState, AuthProviders, AuthMethods, AngularFire, AngularFireAuth, FirebaseApp} from "angularfire2";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {AuthConfiguration, EmailPasswordCredentials} from "angularfire2/es6/providers/auth_backend";
import {Utils} from "../business/Utils";
import {Credentials} from "../../typings_manual/global/angularfire";
import {Toaster} from "./Toaster";
import defer = require("promise-defer");
import App = firebase.app.App;
import Auth = firebase.auth.Auth;
import User = firebase.User;

@Injectable()
export class AuthService {

	emailVerified:boolean; // updated over time. If an observable is required, to refactor.

	private fbAuth:Auth;

	// TODO fallback popup to redirect when not available
	static METHOD_GITHUB = {
		provider: AuthProviders.Github,
		method: AuthMethods.Popup,
		// method: AuthMethods.Redirect,
	};
	static METHOD_PASSWORD = {
		provider: AuthProviders.Password,
		method: AuthMethods.Password
	};

	private authDeferred:Deferred<FirebaseAuthState>;
	popAuth = new ReplaySubject<boolean>(1);
	popChangePwd = new ReplaySubject<string>(1);
	// private fbAuth:firebase.auth.Auth;

	// To get firebase reference: @Inject(FirebaseRef) _firebase:App
	// Use either FirebaseRef or FirebaseApp opaque token to inject it.
	constructor(private auth: AngularFireAuth, @Inject(FirebaseApp) private app:App, private af:AngularFire, private toaster:Toaster) {
		this.fbAuth = app.auth();
		// subscribe to the auth object to check for the login status
		// of the user, if logged in, save some user information and
		// execute the firebase query...
		// .. otherwise
		// _show the login modal page
		// this.fbAuth = (<any>af.auth)._authBackend._fbAuth;

		// console.log("Firebase ref:", ref);
		// console.log("Firebase af:", af);
		// let authBackend:FirebaseSdkAuthBackend = (<any>af.auth)._authBackend;
		// console.log("Firebase authBackend:", authBackend);//_fbAuth
		// console.log("Firebase fbAuth:", authBackend._fbAuth.sendPasswordResetEmail);

		// console.log('ref:', this.fbAuth);
		this.fbAuth.onAuthStateChanged((authInfo:User) => {
			// console.log("onAuthStateChanged authInfo:", authInfo);
			if (!authInfo) {
				this.requestAuth();
				// TODO used in angularfire2 beta 0
				// } else if (authInfo.password && authInfo.password.isTemporaryPassword) {
				// 	this.requestPwdChange(authInfo.password);
			} else if (!this.fbAuth.currentUser) {
				console.log("## KO: onAuthStateChanged no currentUser!", this.fbAuth.currentUser);
			} else if (!this.fbAuth.currentUser.emailVerified) {
				console.log("## KO: onAuthStateChanged Email not verified! current user:", this.fbAuth.currentUser);
				console.warn('TODO: implement email verification the firebase 3 way.');
			} else {
				console.log("ok onAuthStateChanged Email verified. Current user:", this.fbAuth.currentUser);
			}
			if (this.fbAuth && this.fbAuth.currentUser) {
				this.emailVerified = this.fbAuth.currentUser.emailVerified;
			} else {
				this.emailVerified = null;
			}
		}, (error:any) => {

			// TODO move auth listener outside AuthService (so that we can inject the ErrorService -here: circular dependency-)
			// and report errors properly. It makes sense since the auth state listener has no caller.
			// The authentication API, on the other side, has a caller that can then raise the error.
			if (error && typeof error === 'object') {
				console.error(error.stack || error);
			} else {
				console.error(error);
			}
			this.toaster.toast('error');
		}, () => console.log("##onAuthStateChanged completed!"));

		// Angularfire 2 is not working as well as firebase itself, so we skip it for authentication layer.
		// this.auth.subscribe((authInfo:FirebaseAuthState) => {
		// 	console.log("authInfo:", authInfo);
		// 	console.log('ref2:', this.fbAuth);
		// 	if (!authInfo) {
		// 		this.requestAuth();
		// 		// TODO used in angularfire2 beta 0
		// 	// } else if (authInfo.password && authInfo.password.isTemporaryPassword) {
		// 	// 	this.requestPwdChange(authInfo.password);
		// 	} else if (!this.fbAuth.currentUser) {
		// 		console.log("## KO: no currentUser!", this.fbAuth.currentUser);
		// 	} else if (!this.fbAuth.currentUser.emailVerified) {
		// 		console.log("## KO: Email not verified! current user:", this.fbAuth.currentUser);
		// 	} else {
		// 		console.log("ok Email verified. Current user:", this.fbAuth.currentUser);
		// 	}
		// });
	}

	// init(/*nav:Nav*/):void {
	// }

	// authenticate(nav:NavController):void {
	// 	let nav2:NavController = this.app.getActiveNav();
	// 	console.log("Active:", nav2.getActive());
	// 	console.log("AuthFormPage:", AuthFormPage);
	// 	nav.push(AuthFormPage);
	// }

	// TODO Temporary implementation until angularfire2 supports Firebase SDK v3
	// https://github.com/angular/angularfire2/issues/220#issuecomment-225317731

	resetPasswordFirebase(email:string):Promise<void> {
		// TODO implement the access view on demand to reset the password
		return this.fbAuth.sendPasswordResetEmail(email);
		// return this.fbAuth.sendPasswordResetEmail(credentials.email);
		// return new Promise<void>((resolve, reject) => {
		// 	this.fbAuth.resetPassword(credentials, (error:any) => {
		// 		if (error) {
		// 			reject(error);
		// 		} else {
		// 			resolve();
		// 		}
		// 	});
		// });
	}

	changePasswordFirebase(newPassword:string/*credentials:FirebaseChangePasswordCredentials*/):Promise<void> {
		console.log("## Don't forget to check the reset password code, if any!");
		return this.fbAuth.currentUser.updatePassword(newPassword);

		// new:
		// this.fbAuth.confirmPasswordReset(code, newPassword)
		// and/or this.fbAuth.verifyPasswordResetCode

		// return new Promise<void>((resolve, reject) => {
		// 	this.fbAuth.changePassword(credentials, (error:any) => {
		// 		if (error) {
		// 			reject(error);
		// 		} else {
		// 			resolve();
		// 		}
		// 	});
		// });
	}

	changeEmailFirebase(newEmail:string):Promise<void> {
		// TODO implement the view for that
		return this.fbAuth.currentUser.updateEmail(newEmail);

		// return new Promise<void>((resolve, reject) => {
		// 	this.fbAuth.changeEmail(credentials, (error:any) => {
		// 		if (error) {
		// 			reject(error);
		// 		} else {
		// 			resolve();
		// 		}
		// 	});
		// });
	}

	// End of temporary implementation

	ensureAuth():Promise<FirebaseAuthState> {
		return this.auth.first().toPromise().then((authInfo:FirebaseAuthState) => {
			// console.log("in auth subscribe", authInfo);
			if (authInfo) {
				return Promise.resolve(authInfo);
			}
			return this.requestAuth();
		});
	}

	login(options?:AuthConfiguration, credentials?:Credentials):Promise<void> {
		let loginPromise = credentials ? this.af.auth.login(credentials, options) : this.auth.login(options);
		return loginPromise.then((user:FirebaseAuthState) => {
			if (!this.authDeferred) {
				console.warn("Calling login(), but the deferred object is falsy: it seems the authentication was already completed. The application should avoid to request twice the authentication on the same time.");
				console.warn("User:", user);
				return;
			}
			this.authDeferred.resolve(user);
			this.popAuth.next(false);
			this.authDeferred = null;
		});
	}

	logout():void {
		// console.log("Logout");
		this.auth.logout();
	}

	signup(credentials:EmailPasswordCredentials):Promise<void> {
		credentials.password = Utils.randomPassword();
		// angularfire2 beta 2
		return this.af.auth.createUser(credentials).then((authData:FirebaseAuthState) => {
			// console.log(authData);

			this.fbAuth.currentUser.sendEmailVerification();

			// return this.resetPasswordFirebase(credentials.email).then(() => {
			// 	return this.login(AuthService.METHOD_PASSWORD, credentials);
			// });
		});
		// angularfire2 beta 0
		// return this.auth.createUser(credentials).then((authData: FirebaseAuthData) => {
		// 	console.log(authData);
		// 	return this.resetPasswordFirebase({email: credentials.email}).then(() => {
		// 		return this.login(AuthService.METHOD_PASSWORD, credentials);
		// 	});
		// });
	}

	changePassword(newPassword:string /*credentials:FirebaseChangePasswordCredentials*/):Promise<void> {
		return this.changePasswordFirebase(newPassword).then(() => {
			this.popChangePwd.next(null);
			this.modalShown = false;
		})
	}

	private requestAuth():Promise<FirebaseAuthState> {
		if (this.authDeferred) {
			return this.authDeferred.promise;
		}
		this.authDeferred = defer<FirebaseAuthState>();
		this.popAuth.next(true);
		return this.authDeferred.promise;
	}

	private modalShown:boolean;
	private requestPwdChange(email:string/*password:FirebaseAuthDataPassword*/):Promise<void> {
		if (this.modalShown) {
			return;
		}
		this.modalShown = true;
		this.popChangePwd.next(email);
	}
}
