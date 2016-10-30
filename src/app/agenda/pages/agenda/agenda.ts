import {Component, ViewChild, OnDestroy} from "@angular/core";
import {NavController, Slides, PopoverController, ModalController} from "ionic-angular";
import {AddPopover} from "../pop/add-popover";
import {AuthFormPage} from "../pop/auth";
import {ChangePasswordPage} from "../forms/change-password";
import {Subscription} from "rxjs/Subscription";
import {UnverifiedEmailPopover} from "../pop/UnverifiedEmailPopover";
import {AgendaRange} from "../../business/agenda-range.model";
import {AgendaEntry} from "../../../shared/lesson.model";
import {AgendaConfig} from "../../business/agenda.config";
import {AgendaService} from "../../business/agenda.service";
import {AuthService} from "../../../core/framework/auth.service";
import {PaymentService} from "../../business/payment.service";
import {AgendaDao} from "../../business/agenda.dao";


@Component({
	templateUrl: 'agenda.html',
})
export class AgendaPage implements OnDestroy {

	// TODO Required/useful? Not sure, it seems to add a delay when reloading the page.
	private _sub:Subscription[] = [];
	private sub(subscription:Subscription):Subscription {
		// this._sub.push(subscription);
		return subscription;
	}
	ngOnDestroy():any {
		for (let sub of this._sub) {
			sub.unsubscribe();
		}
	}

	private ranges:AgendaRange[];


	// private _currentDate:string;

	// getter/setter for use with the template 2-way binding
	// get currentDate():string {return this._currentDate;}
	// set currentDate(date:string) {
	// 	this._currentDate = date;
	// 	this.ranges = this.agendaService.getRangesForDate(date);
	// }
	get currentDate():string {return this.agendaService.currentDate;}
	set currentDate(date:string) {
		this.agendaService.currentDate = date;
		this.ranges = this.agendaService.getRangesForDate(date);
	}

	// private agenda:AgendaEntry[];

	slideOptions = {initialSlide: AgendaConfig.cachedSlidesOnOneSide}; // used in template

	@ViewChild('slider') slider:Slides;

	constructor(private nav:NavController, private popoverCtrl: PopoverController, private modalCtrl: ModalController,
				private agendaService:AgendaService, private authService:AuthService,
				paymentService:PaymentService, private agendaDao:AgendaDao) {
		// console.log("agenda constructor");
		this.ranges = agendaService.initRanges();

		// paymentService.checkPayment(null);
		this.sub(this.agendaDao.findAgenda().subscribe((agenda:AgendaEntry[]) => {
			console.log("agenda:", agenda);
			this.sub(this.agendaDao.findAgenda().subscribe((agenda:AgendaEntry[]) => console.log("agenda2:", agenda)));
		}));
		// setTimeout(() => {
		// }, 3000);
	}

	onPageDidEnter() {
		// console.log("Agenda onPageDidEnter");
		this.sub(this.authService.popAuth.subscribe((show:boolean) => {
			// console.log("Agenda received popAuth:", show);
			if (show) {
				// AuthFormPage._show(this.nav);

				let loginPage = this.modalCtrl.create(AuthFormPage, AuthFormPage.data, AuthFormPage.opts);
				// Workaround: https://github.com/driftyco/ionic/issues/6933#issuecomment-226508870
				//(<any>loginPage).fireOtherLifecycles = false;
				loginPage.present();
				// console.log("AuthFormPage present");

			}
		}));
		this.sub(this.authService.popChangePwd.subscribe((email:string/*password:FirebaseAuthDataPassword*/) => {
			if (email) {
				// ChangePasswordPage._show(this.nav, email/*password*/);

				let modal = this.modalCtrl.create(ChangePasswordPage, {email: email}/*{password: password}*/, ChangePasswordPage.opts);
				modal.present();

			}
		}));
	}

	ngAfterViewInit() {
		// let swiper = this.slider.getSlider();
	// 	console.log("Slider:", this.slider);
	}

	// rangesPreview():string {
	// 	return this.ranges.map((range:AgendaRange) => range.start.format('L')).join(' ');
	// }

	// private slideWithButton:boolean;

	// Workaround because the swipe to change of slide has bugs
	slideNext() {
		this.agendaService.updateSlideRange(this.ranges, this.slider, false, AgendaConfig.cachedSlidesOnOneSide + 1, false);
		// The user is automatically positioned to the new slide. So we manually create a sliding effect.
		this.slider.slideTo(AgendaConfig.cachedSlidesOnOneSide - 1, 0, false);
		setTimeout(() => {
			this.slider.slideNext(300, false);
		}, 50);

		// this.slideWithButton = true;
		// this.slider.slideTo(AgendaConfig.cachedSlidesOnOneSide - 1, 0);
	}

	// Workaround because the swipe to change of slide has bugs
	slidePrev() {
		this.agendaService.updateSlideRange(this.ranges, this.slider, true, AgendaConfig.cachedSlidesOnOneSide - 1, false);
		// The user is automatically positioned to the new slide. So we manually create a sliding effect.
		this.slider.slideTo(AgendaConfig.cachedSlidesOnOneSide + 1, 0, false);
		setTimeout(() => {
			this.slider.slidePrev(300, false);
		}, 50);

		// this.slideWithButton = true;
		// this.slider.slideTo(AgendaConfig.cachedSlidesOnOneSide + 1, 0);
	}

	updateSlideRange(swiper:any) {
		// if (this.slideWithButton) {
		// 	this.slideWithButton = false;
		// 	this.slider.slideTo(AgendaConfig.cachedSlidesOnOneSide, 300, false);
		// } else {
			let back = swiper.swipeDirection === 'prev';
			let newIndex = this.slider.getActiveIndex();
			this.agendaService.updateSlideRange(this.ranges, this.slider, back, newIndex);
		// }
	}

	// updateSlideRangeEnd(swiper:any) {
	// 	console.log("Did change");
	// }

	// previous: open new lesson page
	// addEntry() {
	// 	this.nav.push(LessonFormPage);
	// }

	popAddList(event:Event) {
		this.popoverCtrl.create(AddPopover, AddPopover.data, AddPopover.opts).present({ev: event});
	}

	get emailVerified():boolean {
		return this.authService.emailVerified;
	}

	verifyPasswordWarning(event:Event) {
		this.popoverCtrl.create(UnverifiedEmailPopover, UnverifiedEmailPopover.data, UnverifiedEmailPopover.opts).present({ev: event});
	}

}