import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Observable";
import {AgendaEntry} from "../model/Lesson";
import {Student} from "../model/Student";
import {Parameters} from "../model/Parameters";
import {StorageDao} from "../framework/dao/StorageDao";
import {ReplaySubject} from "rxjs/ReplaySubject";

@Injectable()
export class AgendaDao {

	private agendaUpdates = new ReplaySubject<AgendaEntry[]>(1);

	constructor(private dao:StorageDao) {
	}

	latestAgenda():Observable<AgendaEntry[]> {
		return Observable.merge(this.findAgenda(), this.agendaUpdates);
	}

	findAgenda():Observable<AgendaEntry[]> {
		return this.dao.find("agenda", "stub/agenda-entries.json").map((agenda:AgendaEntry[]) => agenda ? agenda : []);
	}

	findStudents():Observable<Student[]> {
		return this.dao.find("students", "stub/students.json").map((students:Student[]) => students ? students : []);
	}

	findParameters():Observable<Parameters> {
		return this.dao.find("parameters", "stub/parameters.json").map((params:Parameters) => params ? params : {});
	}

	insertAgendaEntry(entry:AgendaEntry):Observable<void> {
		return this.findAgenda().mergeMap((entries:AgendaEntry[]) => {
			entries.push(entry);
			// console.log("agendaUpdates", entries)
			this.agendaUpdates.next(entries);
			// TODO update URL once we have a persistent source for updates
			return this.dao.insert("agenda", "stub/agenda-entries.json", entry);
		});
	}

	updateAgendaEntry(entry:AgendaEntry):Observable<void> {
		return this.findAgenda().mergeMap((entries:AgendaEntry[]) => {
			// The reference should have already been updated.
			// entries.push(entry);
			// console.log("Update of entry", entry);
			this.agendaUpdates.next(entries);
			// TODO update URL once we have a persistent source for updates
			return this.dao.insert("agenda", "stub/agenda-entries.json", entry);
		});
	}

	removeAgendaEntry(entry:AgendaEntry):Observable<void> {
		return this.findAgenda().mergeMap((entries:AgendaEntry[]) => {
			let i = entries.indexOf(entry);
			if (i === -1) {
				return Promise.reject(new Error("Entry to remove not found in the list of entries (AgendaDao)"));
			}

			entries.splice(i, 1);
			this.agendaUpdates.next(entries);
			// TODO update URL once we have a persistent source for updates
			return this.dao.remove("agenda", "stub/agenda-entries.json", entry);
		});
	}

}
