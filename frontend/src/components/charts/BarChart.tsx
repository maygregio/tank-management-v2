'use client';

import BaseChart from './BaseChart';
import Highcharts from 'highcharts/highstock';

interface BarChartProps {
  categories: string[];
  data: number[];
  title?: string;
  color?: string;
  height?: number | string;
  name?: string;
  yAxisTitle?: string;
}

export default function BarChart({
  categories,
  data,
  title,
  color = '#00e5ff',
  height = 300,
  name = 'Value',
  yAxisTitle = 'Volume (bbl)'
}: BarChartProps) {
  const options: Highcharts.Options = {
    title: { text: title },
    xAxis: {
      categories
    },
    yAxis: {
      title: { text: yAxisTitle }
    },
    series: [{
      type: 'column',
      name,
      data,
      color,
      borderRadius: 4,
      borderWidth: 0
    }]
  };

  return <BaseChart options={options} height={height} />;
}
