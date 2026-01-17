'use client';

import BaseChart from './BaseChart';
import Highcharts from 'highcharts/highstock';

interface PieChartProps {
  data: Array<{ name: string; y: number; color?: string }>;
  title?: string;
  height?: number | string;
}

export default function PieChart({
  data,
  title,
  height = 300
}: PieChartProps) {
  const options: Highcharts.Options = {
    title: { text: title },
    chart: {
      type: 'pie',
      height
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
          style: {
            color: 'inherit',
            fontSize: '11px'
          }
        },
        showInLegend: true
      }
    },
    series: [{
      type: 'pie',
      name: 'Volume',
      data
    }]
  };

  return <BaseChart options={options} height={height} />;
}
