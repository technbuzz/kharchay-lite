import { Component, OnInit, ViewChild } from '@angular/core';
import { startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { ToastController, IonDatetime } from '@ionic/angular';
import { Observable } from 'rxjs';
import { Expense } from '../home/expense.model';
import { Stepper } from '../shared/stepper';
import { categories } from '../shared/categories';


@Component({
  selector: 'app-filter',
  templateUrl: './filter.page.html',
  styleUrls: ['./filter.page.scss'],
})
export class FilterPage extends Stepper implements OnInit {

  @ViewChild(IonDatetime, { static: false }) expenseMonth: IonDatetime;
  categories: any = [];

  searchType: string = 'basic';
  filter = {
    startDate: '',
    endDate: '',
    category: '',
    month: new Date().toISOString()
  };

  
  expenses$: Observable<Expense[]>;
  expRef: AngularFirestoreCollection<any>;
  total: number = 0;


  constructor(
    private afs: AngularFirestore,
    private toastCtrl: ToastController
  ) {
    super();
    Object.assign(this.categories, categories);

   }

  ngOnInit() {
    this.loadBasic();

  }

  public loadBasic() {
    const basicStartMonth = startOfMonth(this.filter.month);
    const basicEndMonth = endOfMonth(this.filter.month);

    this.loadResults({startDate: basicStartMonth.toISOString(), endDate: basicEndMonth.toISOString()})

    this.expRef = this.afs.collection('expense', ref =>
      ref
        .where('date', '>=', basicStartMonth)
        .where('date', '<=', basicEndMonth)
    );

    // Finding Total
    this.findTotal();
  }
  test(event) {
    console.log('ionChange test called', event);
    console.log(this.filter);
    
  }

  public loadResults({startDate, endDate}) {

    if(startDate && endDate) {
      this.filter.startDate = startDate;
      this.filter.endDate = endDate;
    }

    if(!this.filter.startDate || !this.filter.endDate || !this.filter.category){
      return
    }

    if(isBefore(this.filter.endDate, this.filter.startDate)){
      
      // this.toastCtrl.create({
      //   message: 'Note: Start Date cannot be set in the future.',
      //   position: 'bottom',
      //   showCloseButton: true
      // }).present();

      return
    }


    this.expRef = this.afs.collection('expense', ref =>
      ref
        .where('date', '>=', new Date(this.filter.startDate))
        .where('date', '<=', new Date(this.filter.endDate))
        .where('category', '==', this.filter.category)
    );

    // Finding Total
    this.findTotal();
  }

  findTotal(){
    this.expenses$ = this.expRef.valueChanges();
    this.expenses$.forEach(values => {
      this.total = values.reduce((prev, current) => {
        return prev + Number(current.price);
      }, 0);
    })
  }

}
