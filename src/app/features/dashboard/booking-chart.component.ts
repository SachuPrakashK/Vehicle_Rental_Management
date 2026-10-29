import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  viewChild,
  signal,
} from '@angular/core';
import type { Root } from '@amcharts/amcharts5';
export interface ChartPoint {
  month: string;
  bookings: number;
  amount: number;
}
@Component({
  selector: 'app-booking-chart',
  templateUrl: './booking-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingChartComponent implements AfterViewInit, OnDestroy {
  readonly data = input.required<ChartPoint[]>();
  readonly element = viewChild.required<ElementRef<HTMLDivElement>>('chart');
  readonly failed = signal(false);
  private root?: Root;
  private disposed = false;
  private update?: (data: ChartPoint[]) => void;
  constructor() {
    effect(() => {
      const data = this.data();
      this.update?.(data);
    });
  }
  async ngAfterViewInit(): Promise<void> {
    try {
      const [am5, xy] = await Promise.all([
        import('@amcharts/amcharts5'),
        import('@amcharts/amcharts5/xy'),
      ]);
      if (this.disposed) return;
      const root = am5.Root.new(this.element().nativeElement);
      this.root = root;
      const styles = getComputedStyle(this.element().nativeElement);
      const textSecondary = styles.getPropertyValue('--text-secondary').trim();
      const theme = am5.Theme.new(root);
      theme.rule('Label').setAll({
        fontFamily: 'Poppins, sans-serif',
        fontSize: 10,
        fill: am5.color(textSecondary),
      });
      root.setThemes([theme]);
      const chart = root.container.children.push(
        xy.XYChart.new(root, { panX: false, panY: false, paddingLeft: 0, paddingRight: 18 }),
      );
      const x = chart.xAxes.push(
        xy.CategoryAxis.new(root, {
          categoryField: 'month',
          renderer: xy.AxisRendererX.new(root, { minGridDistance: 35 }),
        }),
      );
      x.get('renderer').grid.template.set('visible', false);
      const y = chart.yAxes.push(
        xy.ValueAxis.new(root, { min: 0, renderer: xy.AxisRendererY.new(root, {}) }),
      );
      y.get('renderer').grid.template.setAll({ strokeOpacity: 0.06 });
      const primary = styles.getPropertyValue('--chart-primary').trim();
      const series = chart.series.push(
        xy.ColumnSeries.new(root, {
          name: 'Billed amount',
          xAxis: x,
          yAxis: y,
          valueYField: 'amount',
          categoryXField: 'month',
          fill: am5.color(primary),
          stroke: am5.color(primary),
          tooltip: am5.Tooltip.new(root, { labelText: '{categoryX}: {valueY}' }),
        }),
      );
      series.columns.template.setAll({
        width: am5.percent(42),
        cornerRadiusTL: 5,
        cornerRadiusTR: 5,
        strokeOpacity: 0,
      });
      this.update = (data) => {
        x.data.setAll(data);
        series.data.setAll(data);
      };
      this.update(this.data());
    } catch {
      this.failed.set(true);
    }
  }
  ngOnDestroy(): void {
    this.disposed = true;
    this.root?.dispose();
  }
}
