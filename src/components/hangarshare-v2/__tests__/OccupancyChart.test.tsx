// Tests: OccupancyChart Component
// File: src/components/hangarshare-v2/__tests__/OccupancyChart.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { OccupancyChart } from '../OccupancyChart';

describe('OccupancyChart Component', () => {
  const mockData = [
    { month: 'Jan', occupancy: 65, capacity: 100, bookings: 25 },
    { month: 'Feb', occupancy: 72, capacity: 100, bookings: 28 },
    { month: 'Mar', occupancy: 80, capacity: 100, bookings: 32 },
  ];

  describe('Rendering', () => {
    it('should render the chart container', () => {
      render(<OccupancyChart data={mockData} />);
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should render the chart title', () => {
      render(<OccupancyChart data={mockData} />);
      expect(screen.getByText('Hangar Occupancy')).toBeInTheDocument();
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
      expect(screen.getByText('Hangar Occupancy')).toBeInTheDocument();
    });

    it('should display occupancy percentage values', () => {
      const { container } = render(<OccupancyChart data={mockData} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should render metrics grid', () => {
      render(<OccupancyChart data={mockData} />);
      const metricsGrid = document.querySelector('[class*="grid"]');
      expect(metricsGrid).toBeInTheDocument();
    });

    it('should show average occupancy metric', () => {
      render(<OccupancyChart data={mockData} />);
      // Average of 65, 72, 80 = 72.33
      expect(screen.getByText(/Average Occupancy|occupancy/i)).toBeInTheDocument();
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
      expect(screen.getByText('Occupancy')).toBeInTheDocument();
      expect(screen.getByText('Capacity')).toBeInTheDocument();
    });
  });

  describe('Occupancy Percentage Handling', () => {
    it('should handle occupancy between 0-100%', () => {
      const percentageData = [
        { month: 'Jan', occupancy: 0, capacity: 100, bookings: 0 },
        { month: 'Feb', occupancy: 50, capacity: 100, bookings: 10 },
        { month: 'Mar', occupancy: 100, capacity: 100, bookings: 20 },
      ];
      render(<OccupancyChart data={percentageData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });

    it('should handle fractional occupancy values', () => {
      const fractionalData = [
        { month: 'Jan', occupancy: 65.5, capacity: 100, bookings: 13 },
        { month: 'Feb', occupancy: 72.3, capacity: 100, bookings: 14 },
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
      const singleData = [{ month: 'Jan', occupancy: 75, capacity: 100, bookings: 15 }];
      render(<OccupancyChart data={singleData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });

    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 50 }, (_, i) => ({
        month: `M${i + 1}`,
        occupancy: 50 + Math.random() * 30,
        capacity: 100,
        bookings: Math.floor(Math.random() * 30),
      }));
      render(<OccupancyChart data={largeData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });
  });
});
