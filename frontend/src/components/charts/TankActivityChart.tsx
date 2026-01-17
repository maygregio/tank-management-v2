'use client';

import BaseChart from './BaseChart';
import Highcharts from 'highcharts/highstock';

interface TankActivityChartProps {
  levelData: Array<[number, number]>;      // [timestamp, level]
  movementData: Array<[number, number]>;   // [timestamp, signedVolume]
  height?: number | string;
}

export default function TankActivityChart({
  levelData,
  movementData,
  height = 300
}: TankActivityChartProps) {
  const options: Highcharts.Options = {
    xAxis: { type: 'datetime' },
    yAxis: [
      {
        title: { text: 'Tank Level (bbl)' },
        height: '100%',
        min: 0
      },
      {
        title: { text: 'Movement (bbl)' },
        opposite: true,
        height: '100%'
      }
    ],
    tooltip: {
      shared: true
    },
    series: [
      {
        type: 'areaspline',
        name: 'Tank Level',
        data: levelData,
        color: '#00e5ff',
        fillOpacity: 0.3,
        lineWidth: 2,
        yAxis: 0,
        marker: {
          enabled: false
        }
      },
      {
        type: 'column',
        name: 'Movement',
        data: movementData,
        yAxis: 1,
        borderWidth: 0,
        negativeColor: '#ff5252',
        color: '#00e676',
        states: {
          hover: {
            brightness: 0.1
          }
        }
      }
    ]
  };

  return <BaseChart options={options} height={height} />;
}
