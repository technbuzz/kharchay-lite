import { AfterViewInit, Directive, ElementRef, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { PointerListener } from 'contactjs';
import { StatsService } from './stats.service';
import { addWeeks } from 'date-fns/addWeeks';
import { subWeeks } from 'date-fns/subWeeks';

@Directive({
  selector: '[khPeriodSwipe]',
  standalone: true
})
export class PeriodSwipeDirective implements AfterViewInit {

  el = inject(ElementRef);
  router = inject(Router);
  service = inject(StatsService);


  $queries = this.service.$queries;

  swipeRight = output<Date>()
  swipeLeft = output<Date>()

  ngAfterViewInit(): void {

    const pointerListener = new PointerListener(this.el.nativeElement);

    this.el.nativeElement.addEventListener("swiperight", () => {
      let timestamp = Number(this.$queries()?.timestamp)
      // console.log(timestamp)
      this.swipeRight.emit(this.subPeriod(timestamp))
    });

    this.el.nativeElement.addEventListener("swipeleft", () => {
      let timestamp = Number(this.$queries()?.timestamp)
      this.swipeLeft.emit(addWeeks(timestamp, 1))
    });
  }

  subPeriod(timestamp: number): Date {
    const period = this.$queries()?.period
    let result;
    switch (period) {
      case 'week':
        result = subWeeks(timestamp, 1)
        break;

      default:
        result = subWeeks(timestamp, 4)
        break;
    }

    return result

  }



}
