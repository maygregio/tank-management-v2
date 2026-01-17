'use client';

import BaseChart from './BaseChart';
import Highcharts from 'highcharts/highstock';

interface AreaChartProps {
  data: Array<[number, number]>;
  title?: string;
  color?: string;
  height?: number | string;
  name?: string;
  yAxisTitle?: string;
}

export default function AreaChart({
  data,
  title,
  color = '#00e5ff',
  height = 300,
  name = 'Value',
  yAxisTitle = 'Volume (bbl)'
}: AreaChartProps) {
  const options: Highcharts.Options = {
    title: { text: title },
    yAxis: { title: { text: yAxisTitle } },
    series: [{
      type: 'areaspline',
      name,
      data,
      color,
      fillOpacity: 0.3,
      lineWidth: 2,
      marker: {
        enabled: false
      }
    }]
  };

  return <BaseChart options={options} height={height} />;
}
