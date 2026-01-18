'use client';

import Highcharts from 'highcharts/highstock';
import HighchartsReact from 'highcharts-react-official';
import { useTheme } from '@mui/material/styles';

Highcharts.setOptions({
  time: { timezoneOffset: new Date().getTimezoneOffset() }
});

interface BaseChartProps {
  options: Highcharts.Options;
  height?: number | string;
  containerProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function BaseChart({ options, height = 300, containerProps }: BaseChartProps) {
  const theme = useTheme();

  const defaultOptions: Highcharts.Options = {
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: theme.typography.fontFamily
      },
      height
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      itemStyle: {
        color: theme.palette.text.primary,
        fontWeight: '600' as const,
        fontSize: '12px'
      },
      itemHoverStyle: {
        color: theme.palette.primary.main
      }
    },
    xAxis: {
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '11px'
        }
      },
      gridLineColor: 'rgba(0, 229, 255, 0.1)',
      lineColor: theme.palette.divider
    },
    yAxis: {
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '11px'
        }
      },
      gridLineColor: 'rgba(0, 229, 255, 0.1)',
      lineColor: theme.palette.divider,
      title: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '12px'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(11, 16, 24, 0.95)',
      borderColor: theme.palette.divider,
      borderRadius: 8,
      style: {
        color: theme.palette.text.primary,
        fontSize: '13px'
      },
      useHTML: true,
      borderWidth: 1,
      shadow: true
    },
    plotOptions: {
      series: {
        states: {
          hover: {
            lineWidthPlus: 0,
            halo: {
              size: 0
            }
          }
        }
      }
    }
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={{ ...defaultOptions, ...options }}
      containerProps={{ style: { height }, ...containerProps }}
    />
  );
}
