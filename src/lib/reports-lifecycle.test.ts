import { describe, expect, it } from 'vitest';

import {
  buildLifecycleRecommendedActions,
  buildLifecycleHealthSnapshot,
  buildLifecycleRangeParams,
  deriveLifecycleAlert,
  getLifecycleHelpPath,
  getLifecycleSeverityThreshold,
} from './reports-lifecycle';

describe('reports-lifecycle helpers', () => {
  it('maps transition-aware help links for key transitions', () => {
    expect(getLifecycleHelpPath('projects', 'approved', 'payment_pending')).toBe(
      '/help/payments-refunds/payment-stage-status-reference#overview',
    );
    expect(getLifecycleHelpPath('projects', 'payment_pending', 'fabrication')).toBe(
      '/help/projects-fabrication/fabrication-gates-and-payments#overview',
    );
    expect(getLifecycleHelpPath('blueprints', 'approved', 'revision_requested')).toBe(
      '/help/projects-fabrication/blueprint-revision-loop#checklist',
    );
  });

  it('falls back to module-based help links and default project status guide', () => {
    expect(getLifecycleHelpPath('payments')).toBe('/help/payments-refunds/payment-stage-status-reference#overview');
    expect(getLifecycleHelpPath('appointments')).toBe('/help/appointments-visits/appointment-status-reference#overview');
    expect(getLifecycleHelpPath('unknown-module')).toBe('/help/projects-fabrication/project-statuses#overview');
  });

  it('returns severity thresholds by selected range', () => {
    expect(getLifecycleSeverityThreshold('24h')).toBe(6);
    expect(getLifecycleSeverityThreshold('7d')).toBe(15);
    expect(getLifecycleSeverityThreshold('30d')).toBe(30);
    expect(getLifecycleSeverityThreshold('all')).toBe(50);
  });

  it('builds lifecycle range params deterministically for date windows', () => {
    const now = new Date('2026-03-17T12:00:00.000Z');

    expect(buildLifecycleRangeParams('all', now)).toEqual({ limit: 50 });
    expect(buildLifecycleRangeParams('24h', now)).toEqual({
      limit: 50,
      dateFrom: '2026-03-16',
      dateTo: '2026-03-17',
    });
    expect(buildLifecycleRangeParams('7d', now)).toEqual({
      limit: 50,
      dateFrom: '2026-03-10',
      dateTo: '2026-03-17',
    });
  });

  it('derives critical, warning, and normal operational alerts', () => {
    expect(
      deriveLifecycleAlert({
        range: '7d',
        total: 40,
        refreshRequiredTotal: 30,
        criticalHotspotCount: 2,
        trendDelta: 8,
        trendPercent: 25,
      }).level,
    ).toBe('critical');

    expect(
      deriveLifecycleAlert({
        range: '7d',
        total: 20,
        refreshRequiredTotal: 9,
        criticalHotspotCount: 0,
        trendDelta: 2,
        trendPercent: 12,
      }).level,
    ).toBe('warning');

    expect(
      deriveLifecycleAlert({
        range: '7d',
        total: 8,
        refreshRequiredTotal: 2,
        criticalHotspotCount: 0,
        trendDelta: -1,
        trendPercent: -10,
      }).level,
    ).toBe('normal');
  });

  it('builds user-friendly health snapshots for each alert level', () => {
    const critical = buildLifecycleHealthSnapshot(
      { level: 'critical', message: 'critical-msg' },
      { total: 42, refreshRequiredTotal: 30, criticalHotspotCount: 3 },
    );
    expect(critical.statusLabel).toBe('Needs Attention');
    expect(critical.primaryActionPath).toContain('/help/');

    const warning = buildLifecycleHealthSnapshot(
      { level: 'warning', message: 'warning-msg' },
      { total: 14, refreshRequiredTotal: 5, criticalHotspotCount: 0 },
    );
    expect(warning.statusLabel).toBe('Watchlist');

    const normal = buildLifecycleHealthSnapshot(
      { level: 'normal', message: 'normal-msg' },
      { total: 0, refreshRequiredTotal: 0, criticalHotspotCount: 0 },
    );
    expect(normal.statusLabel).toBe('Healthy');
    expect(normal.headline.toLowerCase()).toContain('no lifecycle mismatch activity');
  });

  it('builds rollout playbook actions for critical, warning, and normal states', () => {
    const critical = buildLifecycleRecommendedActions({
      alertLevel: 'critical',
      topModule: 'Payments',
      topTransition: { targetType: 'projects', currentStatus: 'approved', attemptedStatus: 'payment_pending' },
    });
    expect(critical).toHaveLength(3);
    expect(critical[0]?.label.toLowerCase()).toContain('triage');
    expect(critical[0]?.path).toContain('/help/');

    const warning = buildLifecycleRecommendedActions({
      alertLevel: 'warning',
      topModule: 'Blueprints',
      topTransition: { targetType: 'blueprints', currentStatus: 'approved', attemptedStatus: 'revision_requested' },
    });
    expect(warning[1]?.label.toLowerCase()).toContain('watch trend');

    const normal = buildLifecycleRecommendedActions({
      alertLevel: 'normal',
    });
    expect(normal[0]?.label.toLowerCase()).toContain('monitoring');
  });
});
