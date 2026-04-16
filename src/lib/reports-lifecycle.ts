export type LifecycleRange = '24h' | '7d' | '30d' | 'all';

export type LifecycleAlertLevel = 'normal' | 'warning' | 'critical';

export type LifecycleAlertInput = {
  range: LifecycleRange;
  total: number;
  refreshRequiredTotal: number;
  criticalHotspotCount: number;
  trendDelta?: number | null;
  trendPercent?: number | null;
};

export type LifecycleAlert = {
  level: LifecycleAlertLevel;
  message: string;
};

export type LifecycleHealthSnapshot = {
  statusLabel: 'Healthy' | 'Watchlist' | 'Needs Attention';
  headline: string;
  primaryActionLabel: string;
  primaryActionPath: string;
};

export type LifecycleRecommendedAction = {
  label: string;
  path: string;
  rationale: string;
};

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getLifecycleHelpPath(
  targetType?: string,
  currentStatus?: string,
  attemptedStatus?: string,
): string {
  const normalized = String(targetType || '').toLowerCase();
  const from = String(currentStatus || '').toLowerCase();
  const to = String(attemptedStatus || '').toLowerCase();

  // Transition-aware overrides first.
  if (normalized === 'projects' && from === 'approved' && to === 'payment_pending') {
    return '/help/payments/payment-stage-status-reference#overview';
  }
  if (normalized === 'projects' && from === 'payment_pending' && to === 'fabrication') {
    return '/help/projects-fabrication/fabrication-gates-and-payments#overview';
  }
  if (normalized === 'blueprints' && to.includes('revision')) {
    return '/help/projects-fabrication/blueprint-revision-loop#checklist';
  }
  if (normalized === 'appointments' && to.includes('reschedule')) {
    return '/help/appointments-visits/appointment-status-reference#overview';
  }

  if (normalized === 'payments' || normalized === 'cash') {
    return '/help/payments/payment-stage-status-reference#overview';
  }

  if (normalized === 'fabrication') {
    return '/help/projects-fabrication/fabrication-gates-and-payments#overview';
  }
  if (normalized === 'blueprints') {
    return '/help/projects-fabrication/blueprint-revision-loop#overview';
  }
  if (normalized === 'appointments' || normalized === 'visit-reports') {
    return '/help/appointments-visits/appointment-status-reference#overview';
  }
  return '/help/projects-fabrication/project-statuses#overview';
}

export function getLifecycleSeverityThreshold(range: LifecycleRange): number {
  if (range === '24h') return 6;
  if (range === '7d') return 15;
  if (range === '30d') return 30;
  return 50;
}

export function buildLifecycleRangeParams(range: LifecycleRange, now = new Date()): {
  dateFrom?: string;
  dateTo?: string;
  limit: number;
} {
  const params: { dateFrom?: string; dateTo?: string; limit: number } = { limit: 50 };
  if (range === 'all') return params;

  const from = new Date(now);
  if (range === '24h') {
    from.setDate(from.getDate() - 1);
  } else if (range === '7d') {
    from.setDate(from.getDate() - 7);
  } else {
    from.setDate(from.getDate() - 30);
  }

  params.dateFrom = toIsoDate(from);
  params.dateTo = toIsoDate(now);
  return params;
}

export function deriveLifecycleAlert(input: LifecycleAlertInput): LifecycleAlert {
  const {
    range,
    total,
    refreshRequiredTotal,
    criticalHotspotCount,
    trendDelta,
    trendPercent,
  } = input;

  if (total === 0) {
    return {
      level: 'normal',
      message: 'No lifecycle mismatches recorded for the selected window.',
    };
  }

  const refreshRatio = refreshRequiredTotal / Math.max(total, 1);
  const isTrendSpike = (trendDelta ?? 0) > 0 && (trendPercent ?? 0) >= 20;
  const isCritical = criticalHotspotCount > 0 || refreshRatio >= 0.65 || isTrendSpike;

  if (isCritical) {
    return {
      level: 'critical',
      message:
        `Escalate review: ${criticalHotspotCount} hotspot(s) exceeded ${getLifecycleSeverityThreshold(range)} hits` +
        ` and refresh-required ratio is ${(refreshRatio * 100).toFixed(0)}%.`,
    };
  }

  if (refreshRatio >= 0.4 || (trendDelta ?? 0) > 0) {
    return {
      level: 'warning',
      message: `Watchlist: mismatch activity is rising with ${(refreshRatio * 100).toFixed(0)}% refresh-required records.`,
    };
  }

  return {
    level: 'normal',
    message: 'Lifecycle mismatch activity is stable for the selected window.',
  };
}

export function buildLifecycleHealthSnapshot(
  alert: LifecycleAlert,
  input: Pick<LifecycleAlertInput, 'total' | 'refreshRequiredTotal' | 'criticalHotspotCount'>,
): LifecycleHealthSnapshot {
  const { total, refreshRequiredTotal, criticalHotspotCount } = input;

  if (alert.level === 'critical') {
    return {
      statusLabel: 'Needs Attention',
      headline:
        `High mismatch pressure: ${criticalHotspotCount} hotspot(s) are over threshold and ` +
        `${refreshRequiredTotal} event(s) required a manual refresh.`,
      primaryActionLabel: 'Review Top Hotspot Guides',
      primaryActionPath: '/help/projects-fabrication/project-statuses#overview',
    };
  }

  if (alert.level === 'warning') {
    return {
      statusLabel: 'Watchlist',
      headline:
        `Mismatch activity is climbing (${total} total events). Prioritize transitions that repeatedly require refresh.`,
      primaryActionLabel: 'Review Operator Checklist',
      primaryActionPath: '/help/projects-fabrication/fabrication-gates-and-payments#overview',
    };
  }

  return {
    statusLabel: 'Healthy',
    headline:
      total > 0
        ? `Lifecycle transitions are stable with low friction (${total} event(s) in window).`
        : 'No lifecycle mismatch activity was recorded in this time window.',
    primaryActionLabel: 'View Lifecycle Reference',
    primaryActionPath: '/help/projects-fabrication/project-statuses#overview',
  };
}

export function buildLifecycleRecommendedActions(input: {
  alertLevel: LifecycleAlertLevel;
  topModule?: string;
  topTransition?: { targetType?: string; currentStatus?: string; attemptedStatus?: string };
}): LifecycleRecommendedAction[] {
  const { alertLevel, topModule, topTransition } = input;

  const transitionGuidePath = getLifecycleHelpPath(
    topTransition?.targetType,
    topTransition?.currentStatus,
    topTransition?.attemptedStatus,
  );
  const moduleLabel = topModule || 'top hotspot module';

  if (alertLevel === 'critical') {
    return [
      {
        label: 'Triage highest hotspot now',
        path: transitionGuidePath,
        rationale: `Start with ${moduleLabel} because it is currently generating the most blocked transitions.`,
      },
      {
        label: 'Notify operations lead',
        path: '/help/projects-fabrication/project-statuses#overview',
        rationale: 'Escalate quickly so teams align on the approved transition path before more requests fail.',
      },
      {
        label: 'Review rollout toggle',
        path: '/settings',
        rationale: 'If spikes continue, temporarily tighten rollout while root cause is investigated.',
      },
    ];
  }

  if (alertLevel === 'warning') {
    return [
      {
        label: 'Review top transition guide',
        path: transitionGuidePath,
        rationale: `Validate operator steps for ${moduleLabel} to prevent warning-level activity from escalating.`,
      },
      {
        label: 'Watch trend for next cycle',
        path: '/help/projects-fabrication/project-statuses#overview',
        rationale: 'Keep monitoring this window and confirm activity stabilizes after operational reminders.',
      },
      {
        label: 'Confirm rollout setting',
        path: '/settings',
        rationale: 'Ensure lifecycle analytics remains enabled so trend changes are visible in real time.',
      },
    ];
  }

  return [
    {
      label: 'Keep standard monitoring',
      path: '/help/projects-fabrication/project-statuses#overview',
      rationale: 'Current activity is stable. Continue routine checks and keep operators on the documented flow.',
    },
    {
      label: 'Validate top workflow monthly',
      path: transitionGuidePath,
      rationale: `Spot-check ${moduleLabel} transitions during regular QA to avoid silent regressions.`,
    },
    {
      label: 'Leave analytics enabled',
      path: '/settings',
      rationale: 'Keep visibility on so future mismatches are detected early.',
    },
  ];
}
