import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ChartPropTypes = {
  options: {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: {
      legend: {
        position: "top";
      };
      title: {
        display: boolean;
        text: string;
      };
    };
  },
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string | undefined;
      backgroundColor: string | undefined;
      tension?: number
    }[];
  }
}

export default function Chart({ options, data }: ChartPropTypes) {
  return <Line options={options} data={data} />;
}
