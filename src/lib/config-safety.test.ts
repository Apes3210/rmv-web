import { describe, expect, it } from 'vitest';
import {
  getImpactSummaryText,
  getRiskLabelClass,
  getRiskPanelClass,
  getVersionHistoryStatus,
} from './config-safety';

describe('config-safety helpers', () => {
  it('returns expected label classes for each risk level', () => {
    expect(getRiskLabelClass('high')).toContain('text-red-600');
    expect(getRiskLabelClass('medium')).toContain('text-amber-600');
    expect(getRiskLabelClass('low')).toContain('text-emerald-600');
    expect(getRiskLabelClass(undefined)).toContain('text-gray-500');
  });

  it('returns panel class variants matching risk level', () => {
    expect(getRiskPanelClass('high')).toContain('border-red-300');
    expect(getRiskPanelClass('medium')).toContain('border-amber-300');
    expect(getRiskPanelClass('low')).toContain('border-emerald-300');
  });

  it('summarizes impact text by warnings and risk level', () => {
    expect(getImpactSummaryText({
      key: 'maintenance_mode',
      riskLevel: 'high',
      warnings: ['blocks users'],
      requiresConfirmation: true,
    })).toContain('High-risk change');

    expect(getImpactSummaryText({
      key: 'installment_split',
      riskLevel: 'medium',
      warnings: ['sum mismatch'],
      requiresConfirmation: true,
    })).toContain('Moderate risk');

    expect(getImpactSummaryText({
      key: 'payment_activation_map',
      riskLevel: 'low',
      warnings: [],
      requiresConfirmation: false,
    })).toContain('No immediate operational risks');
  });

  it('returns version status for loading, ready, and empty states', () => {
    expect(getVersionHistoryStatus(true, 0)).toBe('loading');
    expect(getVersionHistoryStatus(false, 2)).toBe('ready');
    expect(getVersionHistoryStatus(false, 0)).toBe('empty');
  });
});
