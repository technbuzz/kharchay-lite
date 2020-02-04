import { IExpense } from './expense.interface';
import { ICategory } from './category.interface';

export class Expense implements IExpense {

  date: Date = null
  price: number
  note: string
  imageName: string
  category: ICategory
  subCategory?: ICategory
  fixed?: boolean

  constructor(price, note, imageName, category, date, subCategory?, fixed? ) {
    this.price = price 
    this.note = note
    this.imageName = imageName
    this.category = category
    this.date = new Date(date)
    this.subCategory = subCategory
    this.fixed = fixed
  }
}


const newTask = new Expense(0, 'FEWA bill for the month of', null, { title: 'bills'}, null, null, false);
console.log(newTask);
