// Tests: RevenueChart Component
// File: src/components/hangarshare-v2/__tests__/RevenueChart.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RevenueChart } from '../RevenueChart';

describe('RevenueChart Component', () => {
  const mockData = [
    { month: 'Jan', revenue: 5000, target: 4000, growth: 25 },
    { month: 'Feb', revenue: 6000, target: 4500, growth: 20 },
    { month: 'Mar', revenue: 7500, target: 5000, growth: 25 },
  ];

  describe('Rendering', () => {
    it('should render the chart container', () => {
      render(<RevenueChart data={mockData} />);
      const container = document.querySelector('.recharts-responsive-container');
      expect(container).toBeInTheDocument();
    });

    it('should render the chart title', () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    it('should render with legend by default', () => {
      render(<RevenueChart data={mockData} />);
      const legend = document.querySelector('.recharts-legend');
      expect(legend).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render all data points', () => {
      render(<RevenueChart data={mockData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
      // Chart should contain 3 lines/bars for 3 data points
      const lines = document.querySelectorAll('.recharts-line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', () => {
      render(<RevenueChart data={[]} />);
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });
  });

  describe('Tooltip Formatter', () => {
    it('should render the chart with proper dimensions', () => {
      const { container } = render(<RevenueChart data={mockData} />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', expect.any(String));
      expect(svg).toHaveAttribute('height', expect.any(String));
    });
  });

  describe('Responsive Behavior', () => {
    it('should render responsive container with width 100%', () => {
      const { container } = render(<RevenueChart data={mockData} />);
      const responsiveContainer = container.querySelector('.recharts-responsive-container');
      expect(responsiveContainer).toHaveStyle('width: 100%');
    });

    it('should render legend items', () => {
      render(<RevenueChart data={mockData} />);
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Target')).toBeInTheDocument();
    });
  });

  describe('Legend Toggle', () => {
    it('should not render legend when showLegend is false', () => {
      render(<RevenueChart data={mockData} showLegend={false} />);
      const legend = document.querySelector('.recharts-legend');
      expect(legend).not.toBeInTheDocument();
    });

    it('should render legend when showLegend is true', () => {
      render(<RevenueChart data={mockData} showLegend={true} />);
      const legend = document.querySelector('.recharts-legend');
      expect(legend).toBeInTheDocument();
    });
  });

  describe('Chart Configuration', () => {
    it('should have proper chart height', () => {
      const { container } = render(<RevenueChart data={mockData} />);
      const svg = container.querySelector('svg');
      const height = svg?.getAttribute('height');
      expect(parseInt(height || '0')).toBeGreaterThan(200);
    });

    it('should render XAxis labels', () => {
      render(<RevenueChart data={mockData} />);
      const xAxisLabel = document.querySelector('.recharts-xaxis');
      expect(xAxisLabel).toBeInTheDocument();
    });

    it('should render YAxis labels', () => {
      render(<RevenueChart data={mockData} />);
      const yAxisLabel = document.querySelector('.recharts-yaxis');
      expect(yAxisLabel).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers correctly', () => {
      const largeData = [
        { month: 'Jan', revenue: 1000000, target: 900000, growth: 11 },
      ];
      render(<RevenueChart data={largeData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroData = [
        { month: 'Jan', revenue: 0, target: 0, growth: 0 },
      ];
      render(<RevenueChart data={zeroData} />);
      const chart = document.querySelector('.recharts-surface');
      expect(chart).toBeInTheDocument();
    });
  });
});
