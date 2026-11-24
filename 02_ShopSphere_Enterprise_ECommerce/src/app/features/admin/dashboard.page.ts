import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { combineLatest, map } from 'rxjs';
import { CategoryService } from '@core/services/category.service';
import { OrderService } from '@core/services/order.service';
import { ProductService } from '@core/services/product.service';
import { loadableSignal } from '@core/utils/loadable';
import { OrderStatusBadgeComponent } from '@shared/components/order-status-badge/order-status-badge.component';
import { ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { ORDER_STATUS_META } from '@shared/pipes/order-status.pipe';
import { buildDashboardStats } from './dashboard.utils';

const INK = '#14213d';
const CORAL = '#ff6b3d';
const STATUS_COLORS: Record<string, string> = {
  pending: '#f5b83d',
  processing: '#60a5fa',
  shipped: '#2563eb',
  'out-for-delivery': '#ff6b3d',
  delivered: '#16803c',
  cancelled: '#c0362c',
};

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, CurrencyPipe, DatePipe, DecimalPipe, MatIconModule, MatButtonModule, NgxEchartsDirective, OrderStatusBadgeComponent, ErrorStateComponent, ImgFallbackDirective],
  templateUrl: './dashboard.page.html',
  styleUrl: './admin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly products = inject(ProductService);
  private readonly orders = inject(OrderService);
  private readonly categories = inject(CategoryService);

  readonly resource = loadableSignal(() =>
    combineLatest([this.products.products$, this.orders.orders$, this.categories.categories$]).pipe(
      map(([p, o, c]) => buildDashboardStats(p, o, c)),
    ),
  );
  readonly stats = computed(() => this.resource.state().data);

  readonly revenueChart = computed<EChartsOption>(() => {
    const m = this.stats()?.monthly ?? [];
    return {
      color: [CORAL, INK],
      tooltip: { trigger: 'axis' },
      legend: { data: ['Revenue', 'Orders'], top: 0, right: 0 },
      grid: { left: 8, right: 8, bottom: 8, top: 40, containLabel: true },
      xAxis: { type: 'category', data: m.map((x) => x.label), axisTick: { show: false } },
      yAxis: [
        { type: 'value', name: 'USD', axisLabel: { formatter: (v: number) => `$${Math.round(v / 1000)}k` }, splitLine: { lineStyle: { type: 'dashed' } } },
        { type: 'value', name: 'Orders', splitLine: { show: false } },
      ],
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          symbolSize: 7,
          areaStyle: { opacity: 0.12 },
          lineStyle: { width: 3 },
          data: m.map((x) => x.revenue),
        },
        { name: 'Orders', type: 'bar', yAxisIndex: 1, barWidth: 14, itemStyle: { borderRadius: [4, 4, 0, 0], opacity: 0.85 }, data: m.map((x) => x.orders) },
      ],
    };
  });

  readonly statusChart = computed<EChartsOption>(() => {
    const s = (this.stats()?.byStatus ?? []).filter((x) => x.count > 0);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0, icon: 'circle' },
      series: [
        {
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['50%', '44%'],
          itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
          label: { show: false },
          data: s.map((x) => ({ name: ORDER_STATUS_META[x.status].label, value: x.count, itemStyle: { color: STATUS_COLORS[x.status] } })),
        },
      ],
    };
  });

  readonly categoryChart = computed<EChartsOption>(() => {
    const c = [...(this.stats()?.byCategory ?? [])].reverse();
    return {
      color: [INK],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 24, bottom: 8, top: 8, containLabel: true },
      xAxis: { type: 'value', axisLabel: { formatter: (v: number) => `$${Math.round(v / 1000)}k` }, splitLine: { lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'category', data: c.map((x) => x.name), axisTick: { show: false } },
      series: [{ type: 'bar', barWidth: 16, itemStyle: { borderRadius: [0, 6, 6, 0] }, data: c.map((x) => x.revenue) }],
    };
  });
}
