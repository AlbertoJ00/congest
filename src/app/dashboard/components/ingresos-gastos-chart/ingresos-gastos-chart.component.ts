import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { ActividadesService } from '../../../core/services/actividades.service';

@Component({
  selector: 'app-ingresos-gastos-chart',
  standalone: false,
  templateUrl: './ingresos-gastos-chart.component.html',
  styleUrls: ['./ingresos-gastos-chart.component.scss']
})
export class IngresosGastosChartComponent implements OnInit {
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Ingresos',
        borderColor: '#2FAE60',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      },
      {
        data: [],
        label: 'Gastos',
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4
      }
    ]
  };
  
  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // We use our custom legend in HTML
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F0F2F0'
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          },
          callback: function(value) {
            return (value as number) / 1000 + 'k';
          }
        }
      }
    }
  };
  public lineChartType: 'line' = 'line';

  isLoaded = false;

  constructor(private actividadesService: ActividadesService) {}

  ngOnInit(): void {
    this.actividadesService.getIngresosGastos().subscribe({
      next: (data) => {
        this.updateChartData(data);
      },
      error: () => {
        // Mock data if API fails
        const mockData = [
          { mes: 'Ene', ingresos: 1000, gastos: 5000 },
          { mes: 'Feb', ingresos: 2000, gastos: 4500 },
          { mes: 'Mar', ingresos: 3500, gastos: 3500 },
          { mes: 'Abr', ingresos: 5000, gastos: 3000 },
          { mes: 'May', ingresos: 4500, gastos: 2000 },
          { mes: 'Jun', ingresos: 4800, gastos: 1500 }
        ];
        this.updateChartData(mockData);
      }
    });
  }

  private updateChartData(data: any[]): void {
    this.lineChartData.labels = data.map(d => d.mes);
    this.lineChartData.datasets[0].data = data.map(d => d.ingresos);
    this.lineChartData.datasets[1].data = data.map(d => d.gastos);
    
    // trigger change detection
    this.lineChartData = { ...this.lineChartData };
    this.isLoaded = true;
  }
}
