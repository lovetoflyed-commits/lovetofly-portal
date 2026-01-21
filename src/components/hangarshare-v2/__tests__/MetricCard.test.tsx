// Unit Tests for MetricCard Component
// File: src/components/hangarshare-v2/__tests__/MetricCard.test.tsx
// Purpose: Test MetricCard component rendering and interactions

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard';

describe('MetricCard Component', () => {
  describe('Rendering', () => {
    it('should render metric card with title and value', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon="chart"
          status="healthy"
        />
      );

      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should format large numbers with K and M suffixes', () => {
      const { rerender } = render(
        <MetricCard
          title="Large Number"
          value={1500}
          icon="chart"
        />
      );

      expect(screen.getByText('1.5K')).toBeInTheDocument();

      rerender(
        <MetricCard
          title="Larger Number"
          value={2500000}
          icon="chart"
        />
      );

      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    it('should display string values as-is', () => {
      render(
        <MetricCard
          title="String Value"
          value="Custom Value"
          icon="chart"
        />
      );

      expect(screen.getByText('Custom Value')).toBeInTheDocument();
    });
  });

  describe('Status Colors', () => {
    it('should apply correct status color classes', () => {
      const { container } = render(
        <MetricCard
          title="Healthy"
          value={100}
          status="healthy"
        />
      );

      const card = container.querySelector('div[class*="rounded-lg"]');
      expect(card?.className).toContain('border-green');
    });

    it('should handle default status', () => {
      const { container } = render(
        <MetricCard
          title="Default"
          value={100}
        />
      );

      const card = container.querySelector('div[class*="rounded-lg"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Change Indicator', () => {
    it('should display change percentage when provided', () => {
      render(
        <MetricCard
          title="With Change"
          value={100}
          change={5}
        />
      );

      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it('should show up arrow for positive change', () => {
      render(
        <MetricCard
          title="Positive Change"
          value={100}
          change={10}
        />
      );

      expect(screen.getByText(/▲/)).toBeInTheDocument();
    });

    it('should show down arrow for negative change', () => {
      render(
        <MetricCard
          title="Negative Change"
          value={100}
          change={-10}
        />
      );

      expect(screen.getByText(/▼/)).toBeInTheDocument();
    });
  });

  describe('Units', () => {
    it('should display unit suffix when provided', () => {
      render(
        <MetricCard
          title="With Unit"
          value={100}
          unit="%"
        />
      );

      expect(screen.getByText('%')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should display icon emoji', () => {
      render(
        <MetricCard
          title="Users"
          value={50}
          icon="users"
        />
      );

      expect(screen.getByLabelText('users')).toBeInTheDocument();
    });

    it('should use default chart icon when not specified', () => {
      render(
        <MetricCard
          title="Default Icon"
          value={50}
        />
      );

      expect(screen.getByLabelText('chart')).toBeInTheDocument();
    });
  });
});
