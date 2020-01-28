import { Component, ViewChild, OnInit, ElementRef } from '@angular/core'
import { IonDatetime, Events, AlertController } from '@ionic/angular'

import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore'
import { AngularFireStorage } from '@angular/fire/storage'

import * as addDays from 'date-fns/add_days'
import * as isAfter from 'date-fns/is_after'
import * as subDays from 'date-fns/sub_days'
import * as format from 'date-fns/format'
import * as startOfMonth from 'date-fns/start_of_month'

import { Flip } from 'number-flip'


import { ICategory } from '../shared/category.interface'
import { categories } from '../shared/categories'
import { NgForm } from '@angular/forms'
import { Observable } from 'rxjs'
import { BaseExpense } from './expense-base.model'
import { IExpense } from '../shared/expense.interface'
import { throttleTime } from 'rxjs/operators'
import { SettingsService } from '../services/settings.service'
import { Expense } from '../shared/expense.class'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  @ViewChild('expenseDate', { static: true })
  expenseDate: IonDatetime

  @ViewChild('flip', { read: ElementRef, static: true }) private flipTotal: ElementRef
  
  cdo = new Date()
  currentMonth = format(new Date(), 'MMMM')
  startOfMonth = startOfMonth(this.cdo)
  maxDate: string

  expense: IExpense = {
    price: null,
    note: '',
    category: null,
    date: new Date().toISOString(),
    imageName: '',
    imageUrl: ''
  }

  categories = []
  showSubCategory: Boolean = false
  recurringLoading: boolean = false
  selectedSubCategory: ''
  subCategories: ICategory

  dynamicPricing: Boolean = true

  isWorking: Boolean = false

  total: number = 0
  flipAnim: any = ''



  expCollRef: AngularFirestoreCollection<any> = this.afs.collection(
    'expense',
    ref => ref.orderBy('date', 'desc').where('date', '>=', this.startOfMonth)
  )
  expenses: Observable<Expense[]>
  recurringExpenses = []


  constructor(
    private events: Events,
    private afs: AngularFirestore,
    private alertCtrl: AlertController,
    private storage: AngularFireStorage,
    private settingService: SettingsService,
  ) {
    Object.assign(this.categories, categories)
  }

  ngOnInit() {

    // this.settingService.getConfig().subscribe(initialSettings => {
    //   this.dynamicPricing = initialSettings
    // })

    // // dynamicPricing event management
    // this.events.subscribe('dynamic:Pricing', (boolean) => {
    //   this.dynamicPricing = boolean
    // })

    this.checkRecurring()


    this.maxDate = this.cdo.toISOString().split('T')[0]
    this.expenses = this.expCollRef.valueChanges()

    this.expenses.pipe(throttleTime(1500)).subscribe((values) => {
      new Promise((resolve, reject) => {
        this.total = values.reduce((prev, current, index, array) => {
          if(index === array.length - 1) resolve('😎')
          return prev + Number(current.price)
        }, 0)
      }).then(resolve => {
        this.flip(Math.round(this.total))
      }) // Promise
    })// forEach

  }


  public dynamicHandler (price:any):void {
    this.expense.price = price
  }

  public addItem(form: NgForm, expense:IExpense) {
    return new Promise((resolve, reject) => {
      
      const newExpense = expense || this.expense
      this.isWorking = true
      this.events.subscribe('uploading:cancelled', () => {
        this.isWorking = false
        this.events.unsubscribe('uploading:cancelled')
      })
  
      this.events.subscribe('uploaded:image', ({ imageName, imageUrl }) => {
        console.log('event received:uploaded:image: ');
        const expenseInstance = new Expense(newExpense.price, newExpense.note, imageName, newExpense.category, newExpense.date, 
          this.showSubCategory ? this.selectedSubCategory : null
        )
        
        this.expCollRef
          .add({...expenseInstance})
          .then(docRef => {
            this.resetFields()
            this.isWorking = false
            // already happens on cloud function
            // this.expCollRef.doc(docRef.id).update({
            //   id: docRef.id
            // })
            resolve(docRef)
            this.events.unsubscribe('uploaded:image')
          })
          .catch(err => {
            reject(err)
            this.isWorking = false
            console.log(err)
            this.events.unsubscribe('uploaded:image')
          })
      })
  
      // Ideally we should pulish upload:image event and than a image upload
      // should happen and then listen for uploaded:image but in the case
      // when there is no image than every thing happens so fast the image upload
      // component publishes before home component have enough time to subscribe
      // to uploaded:image so event is missed
      this.events.publish('upload:image')
    })
  }

  public async delete(item: Expense) {
    // this.expCollRef.doc('yourid').delete();
    const confirm = await this.alertCtrl.create({
      subHeader: 'Do you really want to delete',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Yes',
          handler: () => {

            // @ts-ignore
            this.expCollRef.doc(item.id).delete()
            //FIXME: Refactor this subscription
            if(!item.imageName) return
            this.storage
              .ref(`receipts/${item.imageName}`)
              .delete()
              .subscribe(
                resp => {
                  console.log('resource deleted', resp)
                },
                error => console.log(error)
              )
          }
        }
      ]
    })
    confirm.present()
  }

  flip (to: number) {
    if (!this.flipAnim) {
      this.flipAnim = new Flip({
        node: this.flipTotal.nativeElement,
        from: 9999,
        duration: 3,
        delay: 3
      })
    }

    this.flipAnim.flipTo({
      to
    })
  }

  populateSubCategory(category: ICategory) {
    if (category.hasOwnProperty('subCategory') && category.subCategory) {
      this.subCategories = category.subCategory
      this.showSubCategory = true
    } else {
      this.showSubCategory = false
    }
  }

  checkRecurring() {
    this.afs.collection('tasks').valueChanges().subscribe(resp => {
      console.log(resp);
      this.recurringExpenses = resp
    })
  }

  addRecurring(item:IExpense) {
    this.recurringLoading = true;
    setTimeout(() => {
      this.addItem(undefined, item).then(resp => {
        this.recurringLoading = false;
      })  
    }, 1000);
  }

  public addDay() {
    const tempDate = this.expense.date
    const nextDay = addDays(tempDate, 1)
    if (isAfter(nextDay, new Date())) return
    this.expenseDate.value = nextDay.toISOString()
  }

  public subtractDay() {
    const tempDate = this.expense.date
    this.expenseDate.value = subDays(tempDate, 1).toISOString()
    console.log(this.expense.date)
  }

  resetFields() {
    this.expense.price = null
    this.expense.note = ''
  }

  trackByFn(index, item: IExpense) {
    return item.id
  }
}
