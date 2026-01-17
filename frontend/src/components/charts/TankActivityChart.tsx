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
    chart: {
      backgroundColor: 'transparent',
      marginLeft: 70,
      marginRight: 70,
      alignThresholds: true
    },
    xAxis: {
      type: 'datetime'
    },
    yAxis: [
      {
        title: {
          text: 'Tank Level (bbl)',
          style: {
            color: '#00e5ff',
            fontSize: '11px',
            fontWeight: '600'
          },
          margin: 12
        },
        labels: {
          style: {
            color: '#00e5ff',
            fontSize: '10px'
          },
          x: -8
        },
        gridLineColor: 'rgba(0, 229, 255, 0.1)',
        plotLines: [{
          value: 0,
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          zIndex: 3,
          label: {
            text: '0',
            align: 'right',
            x: -4,
            style: {
              color: '#00e5ff',
              fontSize: '10px'
            }
          }
        }]
      },
      {
        title: {
          text: 'Movement (bbl)',
          style: {
            color: '#00e676',
            fontSize: '11px',
            fontWeight: '600'
          },
          margin: 12
        },
        labels: {
          style: {
            color: '#00e676',
            fontSize: '10px'
          },
          x: 8
        },
        opposite: true,
        gridLineWidth: 0,
        plotLines: [{
          value: 0,
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          zIndex: 3,
          label: {
            text: '0',
            align: 'left',
            x: 4,
            style: {
              color: '#00e676',
              fontSize: '10px'
            }
          }
        }]
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
        threshold: 0,
        marker: {
          enabled: false
        }
      },
      {
        type: 'column',
        name: 'Movement',
        data: movementData,
        yAxis: 1,
        threshold: 0,
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
