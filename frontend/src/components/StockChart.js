import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import '../styles/StockChart.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

function StockChart({ data, company, mini = false }) {
  // Configuration for the chart
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'PPP',
          displayFormats: {
            day: 'MMM d'
          }
        },
        title: {
          display: true,
          text: 'Date'
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: { 
        title: { 
          display: true, 
          text: 'Stock Price ($)' 
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toFixed(2)}`;
          }
        }
      },
      title: {
        display: true,
        text: `${company.name} (${company.symbol}) Stock Price`,
        font: {
          size: 16
        }
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.2 // Smooth curve
      },
      point: {
        radius: 0, // Hide points by default
        hoverRadius: 5 // Show on hover
      }
    }
  };

  // Calculate price change and percentage
  const calculateChange = () => {
    if (!data || data.length < 2) return { value: 0, percentage: 0 };
    
    const latestPrice = data[data.length - 1].close;
    const earliestPrice = data[0].close;
    const change = latestPrice - earliestPrice;
    const percentageChange = (change / earliestPrice) * 100;
    
    return {
      value: change.toFixed(2),
      percentage: percentageChange.toFixed(2)
    };
  };

  const change = calculateChange();
  const isPositive = parseFloat(change.value) >= 0;

  // Prepare chart data
  const chartData = {
    labels: data.map(item => new Date(item.date)),
    datasets: [
      {
        label: company.symbol,
        data: data.map(item => item.close),
        borderColor: isPositive ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
        backgroundColor: isPositive ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
        borderWidth: 2,
        fill: true
      }
    ],
  };

  if (mini) {
    return (
      <div className="stock-chart-container mini">
        <div className="mini-chart-wrapper">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    );
  }

  return (
    <div className="stock-chart-container">
      <div className="chart-header">
        <div className="price-info">
          <div className="current-price">
            ${data && data.length > 0 ? data[data.length - 1].close.toFixed(2) : 'N/A'}
          </div>
          <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}{change.value} ({isPositive ? '+' : ''}{change.percentage}%)
          </div>
        </div>
        <div className="chart-actions">
          <button className="chart-action-btn">1D</button>
          <button className="chart-action-btn">1W</button>
          <button className="chart-action-btn active">1M</button>
          <button className="chart-action-btn">3M</button>
          <button className="chart-action-btn">1Y</button>
          <button className="chart-action-btn">5Y</button>
          <button className="chart-action-btn">MAX</button>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <Line options={chartOptions} data={chartData} />
      </div>
      
      <div className="chart-footer">
        <div className="chart-stats">
          <div className="stat-item">
            <span className="stat-label">Open</span>
            <span className="stat-value">${data && data.length > 0 ? data[data.length - 1].open.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">High</span>
            <span className="stat-value">${data && data.length > 0 ? data[data.length - 1].high.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Low</span>
            <span className="stat-value">${data && data.length > 0 ? data[data.length - 1].low.toFixed(2) : 'N/A'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Volume</span>
            <span className="stat-value">{data && data.length > 0 ? data[data.length - 1].volume.toLocaleString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockChart;
