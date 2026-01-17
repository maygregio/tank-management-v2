'use client';

import BaseChart from './BaseChart';
import Highcharts from 'highcharts/highstock';

interface LineChartProps {
  data: Array<[number, number]>;
  title?: string;
  color?: string;
  height?: number | string;
  name?: string;
  yAxisTitle?: string;
}

export default function LineChart({
  data,
  title,
  color = '#00e5ff',
  height = 300,
  name = 'Value',
  yAxisTitle = 'Volume (bbl)'
}: LineChartProps) {
  const options: Highcharts.Options = {
    title: { text: title },
    yAxis: { title: { text: yAxisTitle } },
    series: [{
      type: 'line',
      name,
      data,
      color,
      lineWidth: 2,
      marker: {
        enabled: true,
        radius: 4,
        states: {
          hover: { radius: 6 }
        }
      }
    }]
  };

  return <BaseChart options={options} height={height} />;
}
