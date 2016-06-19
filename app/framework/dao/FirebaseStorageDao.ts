import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {
	AngularFire,
	FirebaseListObservable,
	FirebaseObjectObservable,
	FirebaseAuthState
} from "angularfire2/angularfire2";
import {StorageDao} from "./StorageDao";
import {AuthService} from "../AuthService";


@Injectable()
export class FirebaseStorageDao implements StorageDao {

	// private sql = new Storage(SqlStorage);
	private cache = new Map<string, Promise<any>>();
	// FirebaseObjectObservable or FirebaseListObservable
	private bindings = new Map<string, Observable<any>>();

	// Alternative in China: Kii
	// Firebase with Angular2: angularfire2 once updated to firebase 3
	// https://github.com/aaronksaunders/ionic2-angularfire-sample
	// http://stackoverflow.com/a/36537871
	// - Other alternative in China: Kumulos


	// We use sql storage internally to ensure it is persisted, since localStorage may me cleaned
	// by the OS, the user...
	constructor(private af:AngularFire/*, public auth: FirebaseAuth*/, private authService:AuthService) {
	}
	ngOnInit() {
		// https://github.com/aaronksaunders/ionic2-angularfire-sample/blob/master/app/pages/home/home.ts#L45
		// this.auth.subscribe((data) => {
	}

	// TODO login with wechat
	// http://stackoverflow.com/questions/32629147/wechat-api-is-unable-to-set-app-icon
	// http://stackoverflow.com/questions/34507731/authenticate-mobile-application-with-wechat
	// Need backend with callback URL to complete OAuth2: http://stackoverflow.com/a/29155818/4717408

	findAll(collection:string):Observable<any> {
		return this.authObs().mergeMap((user:FirebaseAuthState) => {
			return this.getListBinding(collection, user);
		});
	}

	findObject(collection:string):Observable<any> {
		return this.authObs().mergeMap((user:FirebaseAuthState) => {
			return this.getObjectBinding(collection, user);
		});
	}

	findByKey(collection:string, key:string):Observable<any> {
		return this.authObs().mergeMap((user:FirebaseAuthState) => {
			return this.getObjectBinding(collection + '/' + key, user).map((obj:any) => {
				obj.$key = key;
				return obj;
			});
		});
	}

	pushToList(collection:string, entity:any):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			this.checkFirebaseEntity(entity);
			return <Promise<void>>/*FirebaseWithPromise<void>*/this.getListBinding(collection, user).push(entity);
		});
	}

	pushToListGlobal(collection:string, entity:any):Promise<void> {
		this.checkFirebaseEntity(entity);
		return <Promise<void>>this.getListBinding(collection).push(entity);
	}

	updateInList(collection:string, entity:any):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			this.checkUpdateFirebaseEntity(entity);
			// console.log("Update collection", collection, ":", entity.$key, entity);
			// TODO dirty but there is no clear/simple way yet to update the whole object in once.
			// https://github.com/angular/angularfire2/issues/190
			let updateEntity = Object.assign({}, entity);
			delete updateEntity.$key;
			return this.getListBinding(collection, user).update(entity, updateEntity);
		});
	}

	removeInList(collection:string, entity:any):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			this.checkUpdateFirebaseEntity(entity);
			return this.getListBinding(collection, user).remove(entity.$key);
		});
	}

	removeAllList(collection:string):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			return this.getListBinding(collection, user).remove();
		});
	}

	insertObject(collection:string, entity:any):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			this.checkFirebaseEntity(entity);
			return this.getObjectBinding(collection, user).set(entity);
		});
	}

	updateObject(collection:string, entity:any):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			this.checkFirebaseEntity(entity);
			return this.getObjectBinding(collection, user).update(entity);
		});
	}

	removeObject(collection:string):Promise<void> {
		return this.auth().then((user:FirebaseAuthState) => {
			return this.getObjectBinding(collection, user).remove();
		});
	}


	// Internal Firebase util

	private checkUpdateFirebaseEntity(entity:any):void {
		if (!entity || !entity.$key) {
			throw new Error("Not a firebase entity, null or without $key: " + entity);
		}
		this.checkFirebaseEntity(entity);
	}
	private checkFirebaseEntity(entity:any):void {
		if (entity) {
			for (let property in entity) {
				if (entity.hasOwnProperty(property) && entity[property] == null) {
					delete entity[property];
				}
			}
		}
	}

	private getListBinding(collection:string, user?:FirebaseAuthState):FirebaseListObservable<any> {
		// return Observable.fromPromise(this.auth.ensureAuth()).map(() => {
			let binding:FirebaseListObservable<any> = <FirebaseListObservable<any>>this.bindings.get(collection);
			if (!binding) {
				let path = user ? '/users/' + user.uid + '/' + collection : '/' + collection;
				binding = this.af.database.list(path);
				this.bindings.set(collection, binding);
			}
			return binding;
		// });
		// let binding:FirebaseListObservable<any> = <FirebaseListObservable<any>>this.bindings.get(collection);
		// if (!binding) {
		// 	binding = this.af.database.list('/' + collection);
		// 	this.bindings.set(collection, binding);
		// }
		// return binding;
	}

	private getObjectBinding(collection:string, user?:FirebaseAuthState):FirebaseObjectObservable<any> {
		// return Observable.fromPromise(this.auth.ensureAuth()).map(() => {
			let binding:FirebaseObjectObservable<any> = <FirebaseObjectObservable<any>>this.bindings.get(collection);
			if (!binding) {
				let path = user ? '/users/' + user.uid + '/' + collection : '/' + collection;
				binding = this.af.database.object(path);
				this.bindings.set(collection, binding);
			}
			return binding;
		// });
	}

	private authObs():Observable<FirebaseAuthState> {
		return Observable.fromPromise(this.authService.ensureAuth());
	}

	private auth():Promise<FirebaseAuthState> {
		return this.authService.ensureAuth();
	}
}
