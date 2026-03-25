import type { ConfigImpactPreview } from '@/hooks/useConfig';

export function getRiskLabelClass(riskLevel?: ConfigImpactPreview['riskLevel']) {
  if (riskLevel === 'high') return 'text-red-600';
  if (riskLevel === 'medium') return 'text-amber-600';
  if (riskLevel === 'low') return 'text-emerald-600';
  return 'text-gray-500';
}

export function getRiskPanelClass(riskLevel: ConfigImpactPreview['riskLevel']) {
  if (riskLevel === 'high') {
    return 'border-red-300 bg-red-50/60 dark:border-red-900/60 dark:bg-red-900/20';
  }
  if (riskLevel === 'medium') {
    return 'border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-900/20';
  }
  return 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-900/20';
}

export function getImpactSummaryText(impact: ConfigImpactPreview) {
  if (impact.warnings.length === 0) {
    return 'No immediate operational risks detected for this value.';
  }
  if (impact.riskLevel === 'high') {
    return 'High-risk change. Confirm owner alignment before saving.';
  }
  if (impact.riskLevel === 'medium') {
    return 'Moderate risk detected. Validate expected downstream behavior.';
  }
  return 'Low risk change with no blocking warnings.';
}

export function getVersionHistoryStatus(isLoading: boolean, versionCount: number) {
  if (isLoading) return 'loading';
  return versionCount > 0 ? 'ready' : 'empty';
}
