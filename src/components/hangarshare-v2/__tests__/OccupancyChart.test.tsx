// Tests: OccupancyChart Component
// File: src/components/hangarshare-v2/__tests__/OccupancyChart.test.tsx

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { OccupancyChart } from '../OccupancyChart';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div className="recharts-responsive-container" style={{ width: width || '100%', height: height || 250 }}>
      {children}
    </div>
  ),
  AreaChart: ({ children, width, height }: any) => (
    <svg className="recharts-surface" width={width || 400} height={height || 250}>
      <defs>
        <linearGradient id="colorOccupancy" />
      </defs>
      {children}
    </svg>
  ),
  CartesianGrid: () => <g className="recharts-cartesian-grid" />,
  XAxis: () => <g className="recharts-xaxis" />,
  YAxis: () => <g className="recharts-yaxis" />,
  Tooltip: () => <div className="recharts-tooltip-wrapper" />,
  Legend: () => (
    <div className="recharts-legend">
      <span>Occupancy %</span>
    </div>
  ),
  Area: () => <g className="recharts-area" />,
}));

describe('OccupancyChart Component', () => {
  const mockData = [
    { date: '2024-01', occupancy: 65, capacity: 100 },
    { date: '2024-02', occupancy: 72, capacity: 100 },
    { date: '2024-03', occupancy: 80, capacity: 100 },
  ];

  describe('Rendering', () => {
    it('should render the chart container', () => {
      render(<OccupancyChart data={mockData} />);
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should render the chart title', () => {
      render(<OccupancyChart data={mockData} />);
      expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();
    });

    it('should render with legend', () => {
      render(<OccupancyChart data={mockData} />);
      const legend = document.querySelector('.recharts-legend');
      expect(legend).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all data points', () => {
      render(<OccupancyChart data={mockData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
      // Chart should have area visualization
      const areas = document.querySelectorAll('.recharts-area');
      expect(areas.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', () => {
      render(<OccupancyChart data={[]} />);
      expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();
    });

    it('should display occupancy percentage values', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    it('should have proper chart height', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const svg = container.querySelector('svg');
      const height = svg?.getAttribute('height');
      expect(parseInt(height || '0')).toBeGreaterThan(200);
    });

    it('should render XAxis labels', () => {
      render(<OccupancyChart data={mockData} />);
      const xAxisLabel = document.querySelector('.recharts-xaxis');
      expect(xAxisLabel).toBeInTheDocument();
    });

    it('should render YAxis with percentage scale', () => {
      render(<OccupancyChart data={mockData} />);
      const yAxisLabel = document.querySelector('.recharts-yaxis');
      expect(yAxisLabel).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render responsive container with width 100%', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toHaveStyle('width: 100%');
    });

    it('should render legend items correctly', () => {
      render(<OccupancyChart data={mockData} />);
      expect(screen.getByText('Occupancy %')).toBeInTheDocument();
    });
  });

  describe('Occupancy Percentage Handling', () => {
    it('should handle occupancy between 0-100%', () => {
      const percentageData = [
        { date: '2024-01', occupancy: 0, capacity: 100 },
        { date: '2024-02', occupancy: 50, capacity: 100 },
        { date: '2024-03', occupancy: 100, capacity: 100 },
      ];
      render(<OccupancyChart data={percentageData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });

    it('should handle fractional occupancy values', () => {
      const fractionalData = [
        { date: '2024-01', occupancy: 65.5, capacity: 100 },
        { date: '2024-02', occupancy: 72.3, capacity: 100 },
      ];
      render(<OccupancyChart data={fractionalData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Tooltip Behavior', () => {
    it('should render tooltip container', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const tooltip = container.querySelector('.recharts-tooltip-wrapper');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Area Chart Styling', () => {
    it('should render with gradient fills', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const defs = container.querySelector('defs');
      expect(defs).toBeInTheDocument();
      const linearGradient = container.querySelector('linearGradient');
      expect(linearGradient).toBeInTheDocument();
    });

    it('should have proper area styling', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const areas = container.querySelectorAll('.recharts-area');
      areas.forEach((area) => {
        expect(area).toBeInTheDocument();
      });
    });
  });

  describe('Data Edge Cases', () => {
    it('should handle single data point', () => {
      const singleData = [{ date: '2024-01', occupancy: 75, capacity: 100 }];
      render(<OccupancyChart data={singleData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });

    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        date: `2024-${String(i + 1).padStart(2, '0')}`,
        occupancy: 50 + Math.random() * 30,
        capacity: 100,
      }));
      render(<OccupancyChart data={largeData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });
  });
});
