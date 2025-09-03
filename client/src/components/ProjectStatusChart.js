import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProjectStatusChart = ({ projectsByStatus }) => {
  const statusLabels = Object.keys(projectsByStatus);
  const statusCounts = Object.values(projectsByStatus);

  // Define colors for each status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'rgba(255, 193, 7, 0.8)'; // Warning yellow
      case 'Approved':
        return 'rgba(40, 167, 69, 0.8)'; // Success green
      case 'Rejected':
        return 'rgba(220, 53, 69, 0.8)'; // Danger red
      case 'Completed':
        return 'rgba(23, 162, 184, 0.8)'; // Info blue
      default:
        return 'rgba(108, 117, 125, 0.8)'; // Secondary gray
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'rgba(255, 193, 7, 1)';
      case 'Approved':
        return 'rgba(40, 167, 69, 1)';
      case 'Rejected':
        return 'rgba(220, 53, 69, 1)';
      case 'Completed':
        return 'rgba(23, 162, 184, 1)';
      default:
        return 'rgba(108, 117, 125, 1)';
    }
  };

  const data = {
    labels: statusLabels,
    datasets: [
      {
        label: 'Number of Projects',
        data: statusCounts,
        backgroundColor: statusLabels.map(status => getStatusColor(status)),
        borderColor: statusLabels.map(status => getBorderColor(status)),
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend since colors are self-explanatory
      },
      title: {
        display: true,
        text: 'Your Projects by Status',
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#495057',
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        enabled: false, // Disable tooltips
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: function(context) {
          // Get the maximum value from the data
          const maxDataValue = Math.max(...statusCounts);
          // Set minimum scale to 10, but grow if data exceeds 10
          return Math.max(10, maxDataValue + 1);
        },
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : null;
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            weight: 'bold',
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const totalProjects = statusCounts.reduce((sum, count) => sum + count, 0);

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <div style={{ position: 'relative', height: '300px' }}>
          <Bar data={data} options={options} />
        </div>
        <div className="mt-3 text-center">
          <small className="text-muted">
            Total: {totalProjects} project{totalProjects !== 1 ? 's' : ''}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProjectStatusChart;
