import { Component, OnInit } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  firestoreInstance$,
  getFirestore,
} from '@angular/fire/firestore';
import {
  AlertController,
} from '@ionic/angular';
import { IExpense } from '@kh/common/api-interface';
import { CreateService } from '@kh/mobile/create/data-access';
import { Observable } from 'rxjs';
import { concatMap, first, map} from 'rxjs/operators';
import {RecurringEvent} from '../components/recurring/recurring.component';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'kh-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  app = getFirestore().app;
  recurringLoading = false;
  dynamicPricing = true;

  expCollRef = firestoreInstance$.pipe(
    first(),
    concatMap((firestore) => collectionData(collection(firestore, 'expense')))
  );
  expenses!: Observable<IExpense[]>;
  recurringExpenses!: Observable<IExpense[]>;
  reccuringExpenseId: string | undefined = undefined;

  constructor(
    private alertCtrl: AlertController,
    private firestore: Firestore,
    private settingService: SettingsService,
    private createService: CreateService
  ) {}

  ngOnInit() {
    this.settingService.getConfig().subscribe((initialSettings) => {
      this.dynamicPricing = initialSettings.dynamicPricing;

    });

    // dynamicPricing event management
    this.settingService.inputBS$.subscribe((config) => {
      this.dynamicPricing = config.dynamicPricing;
    });

    this.checkRecurring();

    // this.ionModalController.create({

    //  })
  }

  public async delete(item: IExpense) {
    // this.expCollRef.doc('yourid').delete();
    const confirm = await this.alertCtrl.create({
      subHeader: 'Do you really want to delete',
      buttons: [
        {
          text: 'Cancel',
        },
        {
          text: 'Yes',
          handler: () => this.deleteResource(item),
        },
      ],
    });
    confirm.present();
  }

  checkRecurring() {
    this.recurringExpenses = collectionData(
      collection(this.firestore, 'tasks')
    ).pipe(
      map((item) =>
        item.map((expense) => {
          return {
            ...expense,
            date: expense['date'].toDate(),
          } as IExpense;
        })
      )
    );
  }

  async deleteResource(item: any) {
    // FIXME: below is broken code kindly fix it
    // await deleteDoc(doc(item.id));
    // this.expCollRef.doc(item.id).delete();
    // FIXME: Refactor this subscription
    // if(!item.imageName) {return;}
    // const imagesRef = ref(this.storage, `receipts/${item.imageName}`);
    // deleteObject(imagesRef).then()
    // this.storage
    // .ref(`receipts/${item.imageName}`)
    // .delete()
    // .subscribe(
    //   resp => {
    //     console.log('resource deleted', resp);
    //   },
    //   error => console.log(error)
    // );
  }

  // The recurring.component.ts already takes care of
  // fixed and non fixed item
  async addRecurring(event: RecurringEvent) {
    this.recurringLoading = true;
    await this.createService.add(event.item)
    await this.deleteRecurring(event.documentToBeDeletedID)
    this.recurringLoading = false;
  }

  deleteRecurring(id: string | undefined): Promise<void> {
    return deleteDoc(doc(this.firestore, `tasks/${id}`));
  }

  async addTasks() {
    // FIXME:
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // const expenseInstance = new Expense(100, 'Shared Wifi Monthly Fee with neighbor', null, { title: 'bills' }, new Date(null),
    // this.showSubCategory ? this.selectedSubCategory : null, true
    // );
    // try {
    // const response = await addDoc(collection(this.firestore, 'recurring'), { ...expenseInstance });
    // console.log('response: ', response);
    // } catch (error) {
    // console.log('error: ', error);
    // }
  }

  trackByFn(index: any, item: IExpense) {
    return item.id;
  }
}
// 304 lines
