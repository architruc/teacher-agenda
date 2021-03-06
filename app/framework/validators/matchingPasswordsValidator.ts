
import {ControlGroup} from "@angular/common";

// Custom validator
export function matchingPasswords(passwordKey: string, confirmPasswordKey: string) {
	return (group: ControlGroup): {[key: string]: any} => {
		let password = group.controls[passwordKey];
		let confirmPassword = group.controls[confirmPasswordKey];
		// console.log("Matching password:", password, confirmPassword);

		if (password.value !== confirmPassword.value) {
			return {
				differentPasswords: true
			};
		}
	}
}
