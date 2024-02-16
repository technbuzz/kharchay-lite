import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { SummaryPage } from './summary.page';
import { PieComponent } from './pie/pie';
import { DoughnutComponent } from './doughnut/doughnut.component';

const routes: Routes = [
  {
    path: '',
    component: SummaryPage,
  },
  {
    path: ':id',
    component: SummaryPage,
  },
];

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule.forChild(routes),
        SummaryPage, PieComponent, DoughnutComponent,
    ],
})
export class SummaryPageModule {}
