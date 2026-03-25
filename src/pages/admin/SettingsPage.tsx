import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Power, RefreshCw, Save, CreditCard, AlertTriangle, History } from 'lucide-react';
import toast from 'react-hot-toast';

import { extractErrorMessage } from '@/lib/utils';
import {
  getImpactSummaryText,
  getRiskLabelClass,
  getRiskPanelClass,
  getVersionHistoryStatus,
} from '@/lib/config-safety';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageError } from '@/components/shared/PageError';
import {
  useConfigs,
  useUpdateConfig,
  useConfigImpactPreview,
  useConfigVersions,
  useRollbackConfigVersion,
  useToggleMaintenance,
} from '@/hooks/useConfig';
import type { ConfigImpactPreview, ConfigItem } from '@/hooks/useConfig';

function getConfigTier(key: string) {
  if (key === 'help_center_content' || key === 'ncrPolygonFile') {
    return { label: 'Advanced', tone: 'warning' as const };
  }

  if (key.includes('maintenance') || key.includes('feature')) {
    return { label: 'System', tone: 'info' as const };
  }

  if (key.includes('fee') || key.includes('distance') || key.includes('installment')) {
    return { label: 'Core', tone: 'success' as const };
  }

  return { label: 'Config', tone: 'secondary' as const };
}

function getConfigPreview(value: unknown, key: string) {
  if (key === 'help_center_content') {
    const raw = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      const title = typeof parsed === 'object' && parsed && 'title' in parsed ? String((parsed as Record<string, unknown>).title ?? 'Help Center') : 'Help Center';
      const subtitle = typeof parsed === 'object' && parsed && 'subtitle' in parsed ? String((parsed as Record<string, unknown>).subtitle ?? '') : '';
      const content = typeof parsed === 'object' && parsed && 'content' in parsed ? String((parsed as Record<string, unknown>).content ?? '') : raw;
      const sectionCount = content.split(/\n\n+/).filter(Boolean).length;
      const excerpt = content
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);

      return {
        kind: 'structured' as const,
        summary: `${title}${subtitle ? ` • ${subtitle}` : ''}`,
        details: `${sectionCount} content blocks`,
        excerpt: excerpt + (content.length > 180 ? '…' : ''),
      };
    } catch {
      const excerpt = raw.replace(/\s+/g, ' ').trim().slice(0, 180);
      return {
        kind: 'structured' as const,
        summary: 'Help Center content',
        details: 'JSON content used by the Help Center page',
        excerpt: excerpt + (raw.length > 180 ? '…' : ''),
      };
    }
  }

  if (typeof value === 'string') {
    return {
      kind: 'text' as const,
      summary: value,
    };
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return {
      kind: 'text' as const,
      summary: String(value),
    };
  }

  const raw = JSON.stringify(value, null, 2);
  return {
    kind: 'json' as const,
    summary: 'JSON configuration',
    details: 'Open the editor to inspect or change the full object',
    excerpt: raw.replace(/\s+/g, ' ').trim().slice(0, 180) + (raw.length > 180 ? '…' : ''),
  };
}

type SimpleConfigField = {
  label: string;
  help: string;
  group: 'pricing' | 'payment' | 'mapping';
  inputType: 'number' | 'text';
  unit?: string;
  step?: number;
  min?: number;
};

const SIMPLE_CONFIG_GROUPS: Array<{
  id: SimpleConfigField['group'];
  title: string;
  description: string;
}> = [
  {
    id: 'pricing',
    title: 'Ocular Fees',
    description: 'Controls base fees, included distance, and distance limits.',
  },
  {
    id: 'payment',
    title: 'Payment Follow-up',
    description: 'Controls reminder schedule and escalation timing.',
  },
  {
    id: 'mapping',
    title: 'NCR Mapping',
    description: 'Controls map references used in NCR location checks.',
  },
];

const SIMPLE_CONFIG_FIELDS: Record<string, SimpleConfigField> = {
  baseFee: {
    label: 'Base Ocular Fee',
    help: 'Starting transportation fee for outside-NCR ocular visits.',
    group: 'pricing',
    inputType: 'number',
    unit: 'PHP',
    min: 0,
    step: 1,
  },
  baseCoveredKm: {
    label: 'Base Distance Included',
    help: 'Distance already covered by the base ocular fee.',
    group: 'pricing',
    inputType: 'number',
    unit: 'km',
    min: 0,
    step: 1,
  },
  extraFeePerKm: {
    label: 'Extra Fee Per Kilometer',
    help: 'Additional fee charged per kilometer beyond the base distance.',
    group: 'pricing',
    inputType: 'number',
    unit: 'PHP/km',
    min: 0,
    step: 1,
  },
  maxDistanceKm: {
    label: 'Maximum Service Distance',
    help: 'Maximum distance the team accepts for ocular visits.',
    group: 'pricing',
    inputType: 'number',
    unit: 'km',
    min: 1,
    step: 1,
  },
  paymentReminderDays: {
    label: 'Payment Reminder Interval',
    help: 'How many days between payment reminder notifications.',
    group: 'payment',
    inputType: 'number',
    unit: 'days',
    min: 1,
    step: 1,
  },
  paymentEscalationAfterReminders: {
    label: 'Escalate After Reminders',
    help: 'Number of reminders before escalating to cashier/admin.',
    group: 'payment',
    inputType: 'number',
    unit: 'reminders',
    min: 1,
    step: 1,
  },
  ncrCenterLat: {
    label: 'NCR Center Latitude',
    help: 'Reference latitude used in NCR distance calculations.',
    group: 'mapping',
    inputType: 'number',
    step: 0.000001,
  },
  ncrCenterLng: {
    label: 'NCR Center Longitude',
    help: 'Reference longitude used in NCR distance calculations.',
    group: 'mapping',
    inputType: 'number',
    step: 0.000001,
  },
  ncrPolygonFile: {
    label: 'NCR Boundary File Path',
    help: 'GeoJSON file path used to validate if an address point is inside NCR.',
    group: 'mapping',
    inputType: 'text',
  },
};

export function SettingsPage() {
  const [editConfig, setEditConfig] = useState<ConfigItem | null>(null);
  const [configValue, setConfigValue] = useState('');
  const [configDesc, setConfigDesc] = useState('');
  const [configImpact, setConfigImpact] = useState<ConfigImpactPreview | null>(null);
  const [simpleConfigValues, setSimpleConfigValues] = useState<Record<string, string>>({});
  const [simpleConfigSavingKey, setSimpleConfigSavingKey] = useState<string | null>(null);

  // Payment settings state
  const [surchargePercent, setSurchargePercent] = useState('10');
  const [splitValues, setSplitValues] = useState(['30', '40', '30']);
  const [stageLabels, setStageLabels] = useState(['Down Payment', 'Mid-Project', 'Final Payment']);
  const [paymentSettingsLoaded, setPaymentSettingsLoaded] = useState(false);

  const {
    data: configs,
    isLoading: configsLoading,
    error: configsError,
    refetch: refetchConfigs,
  } = useConfigs();

  const updateConfig = useUpdateConfig();
  const previewConfigImpact = useConfigImpactPreview();
  const rollbackConfigVersion = useRollbackConfigVersion();
  const { data: configVersionHistory, isLoading: configVersionsLoading } = useConfigVersions(editConfig?.key);
  const toggleMaintenance = useToggleMaintenance();

  const quickLinks = [
    { label: 'Maintenance mode', href: '#maintenance-mode', note: 'Turn the system on or off for non-admin users.' },
    { label: 'Payment settings', href: '#payment-settings', note: 'Adjust surcharge and installment stages.' },
    { label: 'Lifecycle analytics', href: '#lifecycle-analytics', note: 'Control lifecycle insights shown in reports.' },
    { label: 'System defaults', href: '#general-configuration', note: 'Use Easy Settings for common values and Advanced only when needed.' },
  ];

  const maintenanceEnabled = configs?.find((c) => c.key === 'maintenance_mode')?.value === true;
  const lifecycleAnalyticsEnabled = (() => {
    const config = configs?.find((c) => c.key === 'feature_lifecycle_mismatch_analytics');
    return typeof config?.value === 'boolean' ? config.value : true;
  })();

  const generalConfigs = (configs || []).filter(
    (config) =>
      config.key !== 'maintenance_mode' &&
      config.key !== 'feature_lifecycle_mismatch_analytics' &&
      !config.key.startsWith('installment_'),
  );
  const simpleConfigs = generalConfigs.filter((config) => config.key in SIMPLE_CONFIG_FIELDS);
  const advancedConfigs = generalConfigs.filter((config) => !(config.key in SIMPLE_CONFIG_FIELDS));
  const groupedSimpleConfigs = SIMPLE_CONFIG_GROUPS.map((group) => ({
    ...group,
    configs: simpleConfigs.filter((config) => SIMPLE_CONFIG_FIELDS[config.key]?.group === group.id),
  })).filter((group) => group.configs.length > 0);

  // Load payment settings from configs when available
  useEffect(() => {
    if (!configs || paymentSettingsLoaded) return;
    const surchargeConfig = configs.find((c) => c.key === 'installment_surcharge_percent');
    const splitConfig = configs.find((c) => c.key === 'installment_split');
    const labelsConfig = configs.find((c) => c.key === 'installment_stage_labels');

    if (surchargeConfig) setSurchargePercent(String(surchargeConfig.value));
    if (splitConfig && Array.isArray(splitConfig.value)) {
      setSplitValues(splitConfig.value.map(String));
    }
    if (labelsConfig && Array.isArray(labelsConfig.value)) {
      setStageLabels(labelsConfig.value.map(String));
    }
    setPaymentSettingsLoaded(true);
  }, [configs, paymentSettingsLoaded]);

  useEffect(() => {
    if (!configs) return;
    const nextValues: Record<string, string> = {};
    for (const config of configs) {
      if (!(config.key in SIMPLE_CONFIG_FIELDS)) continue;
      if (typeof config.value === 'number' || typeof config.value === 'string') {
        nextValues[config.key] = String(config.value);
      }
    }
    setSimpleConfigValues((previous) => {
      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(nextValues);
      if (previousKeys.length !== nextKeys.length) return nextValues;
      for (const key of nextKeys) {
        if (previous[key] !== nextValues[key]) return nextValues;
      }
      return previous;
    });
  }, [configs]);

  const handleSavePaymentSettings = async () => {
    const splits = splitValues.map(Number);
    const surcharge = Number(surchargePercent);

    if (isNaN(surcharge) || surcharge < 0 || surcharge > 100) {
      toast.error('Surcharge must be between 0 and 100');
      return;
    }
    if (splits.some(isNaN) || splits.some((v) => v <= 0)) {
      toast.error('All split values must be positive numbers');
      return;
    }
    const sum = splits.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      toast.error(`Split values must sum to 100 (currently ${sum})`);
      return;
    }
    if (stageLabels.length !== splits.length || stageLabels.some((l) => !l.trim())) {
      toast.error('Each stage must have a label');
      return;
    }

    try {
      await Promise.all([
        updateConfig.mutateAsync({
          key: 'installment_surcharge_percent',
          value: surcharge,
          description: 'Surcharge percentage applied to installment payments',
        }),
        updateConfig.mutateAsync({
          key: 'installment_split',
          value: splits,
          description: 'Installment split percentages for each stage (must sum to 100)',
        }),
        updateConfig.mutateAsync({
          key: 'installment_stage_labels',
          value: stageLabels.map((l) => l.trim()),
          description: 'Labels for each installment stage',
        }),
      ]);
      toast.success('Payment settings saved');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to save payment settings'));
    }
  };

  const addStage = () => {
    if (splitValues.length >= 6) return;
    setSplitValues([...splitValues, '0']);
    setStageLabels([...stageLabels, `Stage ${splitValues.length + 1}`]);
  };

  const removeStage = (idx: number) => {
    if (splitValues.length <= 1) return;
    setSplitValues(splitValues.filter((_, i) => i !== idx));
    setStageLabels(stageLabels.filter((_, i) => i !== idx));
  };

  const openEditConfig = (cfg: ConfigItem) => {
    setEditConfig(cfg);
    setConfigValue(typeof cfg.value === 'string' ? cfg.value : JSON.stringify(cfg.value));
    setConfigDesc(cfg.description || '');
    setConfigImpact(null);
  };

  const parseConfigInputValue = () => {
    let parsed: unknown = configValue;
    try { parsed = JSON.parse(configValue); } catch { /* keep as raw string */ }
    return parsed;
  };

  const handlePreviewConfigImpact = async () => {
    if (!editConfig) return;
    try {
      const preview = await previewConfigImpact.mutateAsync({
        key: editConfig.key,
        value: parseConfigInputValue(),
      });
      setConfigImpact(preview);
      if (preview.riskLevel === 'high') {
        toast.error('High-risk config change detected. Review impact warnings before saving.');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to preview config impact'));
    }
  };

  const handleRollbackConfigVersion = async (versionId: string) => {
    if (!editConfig) return;
    try {
      const rolledBack = await rollbackConfigVersion.mutateAsync({
        key: editConfig.key,
        versionId,
      });
      setConfigValue(
        typeof rolledBack.value === 'string'
          ? rolledBack.value
          : JSON.stringify(rolledBack.value),
      );
      setConfigDesc(rolledBack.description || '');
      setConfigImpact(null);
      toast.success('Config rolled back to selected version');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to rollback config version'));
    }
  };

  const handleSaveConfig = async () => {
    if (!editConfig) return;
    try {
      const parsed = parseConfigInputValue();
      await updateConfig.mutateAsync({
        key: editConfig.key,
        value: parsed,
        description: configDesc || undefined,
      });
      toast.success('Config updated');
      setConfigImpact(null);
      setEditConfig(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update config'));
    }
  };

  const isSimpleConfigChanged = (config: ConfigItem) => {
    const draft = simpleConfigValues[config.key];
    if (draft === undefined) return false;
    const current = typeof config.value === 'number' || typeof config.value === 'string'
      ? String(config.value)
      : '';
    return draft.trim() !== current.trim();
  };

  const handleSaveSimpleConfig = async (config: ConfigItem) => {
    const field = SIMPLE_CONFIG_FIELDS[config.key];
    if (!field) return;

    const draft = simpleConfigValues[config.key];
    if (draft === undefined) return;

    let nextValue: string | number = draft.trim();
    if (field.inputType === 'number') {
      const parsed = Number(draft);
      if (Number.isNaN(parsed)) {
        toast.error('Please enter a valid number.');
        return;
      }
      if (field.min !== undefined && parsed < field.min) {
        toast.error(`Value must be at least ${field.min}.`);
        return;
      }
      nextValue = parsed;
    }

    try {
      setSimpleConfigSavingKey(config.key);
      await updateConfig.mutateAsync({
        key: config.key,
        value: nextValue,
        description: config.description || undefined,
      });
      toast.success(`${field.label} saved.`);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to save setting'));
    } finally {
      setSimpleConfigSavingKey(null);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      await toggleMaintenance.mutateAsync(!maintenanceEnabled);
      toast.success(maintenanceEnabled ? 'Maintenance mode disabled' : 'Maintenance mode enabled');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to toggle maintenance'));
    }
  };

  const handleToggleLifecycleAnalytics = async () => {
    try {
      await updateConfig.mutateAsync({
        key: 'feature_lifecycle_mismatch_analytics',
        value: !lifecycleAnalyticsEnabled,
        description: 'Enable lifecycle mismatch analytics, hotspot reports, and operational alerting surfaces.',
      });
      toast.success(
        lifecycleAnalyticsEnabled
          ? 'Lifecycle analytics disabled'
          : 'Lifecycle analytics enabled',
      );
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to toggle lifecycle analytics'));
    }
  };

  if (configsError) return <PageError message="Failed to load settings" onRetry={refetchConfigs} />;

  const inputClasses = 'metal-input h-11';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="metal-panel rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b8490] dark:text-slate-400">
              Admin workspace
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171b21] dark:text-slate-100 sm:text-3xl">
              System Settings
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#616a74] dark:text-slate-400">
              Use this page to manage system behavior with clear controls and short guides for each section.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:w-[28rem]">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="metal-pill group rounded-2xl border border-[color:var(--color-border)]/70 p-3 text-left transition-colors hover:border-sky-300/70 hover:bg-sky-50/60 dark:hover:border-sky-400/40 dark:hover:bg-sky-400/10"
              >
                <p className="text-sm font-semibold text-[#171b21] dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-200">
                  {link.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#616a74] dark:text-slate-400">
                  {link.note}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="metal-panel rounded-[1.5rem] border border-[color:var(--color-border)]/60 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b8490] dark:text-slate-400">
            Start here
          </p>
          <ol className="mt-3 space-y-3 text-sm text-[#434c56] dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                1
              </span>
              <span>
                Use <strong className="text-[#171b21] dark:text-slate-100">Maintenance Mode</strong> when you need to pause public access.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                2
              </span>
              <span>
                Update <strong className="text-[#171b21] dark:text-slate-100">Payment & Installment Settings</strong> only if the billing policy changes.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                3
              </span>
              <span>
                Review <strong className="text-[#171b21] dark:text-slate-100">Lifecycle Analytics</strong> and <strong className="text-[#171b21] dark:text-slate-100">System Defaults</strong> only when policy or operations need to change.
              </span>
            </li>
          </ol>
        </div>

        <div className="metal-panel rounded-[1.5rem] border border-[color:var(--color-border)]/60 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b8490] dark:text-slate-400">
            What this page changes
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--color-border)]/60 bg-white/65 p-3 dark:bg-slate-950/40">
              <p className="text-sm font-semibold text-[#171b21] dark:text-slate-100">Safe controls</p>
              <p className="mt-1 text-xs leading-5 text-[#616a74] dark:text-slate-400">
                Maintenance mode and payment settings are the most common day-to-day admin controls.
              </p>
            </div>
            <div className="rounded-2xl border border-[color:var(--color-border)]/60 bg-white/65 p-3 dark:bg-slate-950/40">
              <p className="text-sm font-semibold text-[#171b21] dark:text-slate-100">Higher risk values</p>
              <p className="mt-1 text-xs leading-5 text-[#616a74] dark:text-slate-400">
                System Defaults can affect pricing, reminders, and map behavior. Change only what you understand.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Maintenance Toggle */}
        <div id="maintenance-mode" className="md:col-span-2 scroll-mt-24">
          <Card
            className={`border-l-4 rounded-xl ${
              maintenanceEnabled ? 'border-l-red-500 bg-red-50/50' : 'border-l-emerald-500'
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      maintenanceEnabled
                        ? 'bg-red-100 text-red-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    <Power className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-slate-100">
                      System Maintenance Mode
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-slate-400">
                      {maintenanceEnabled
                        ? 'The system is currently unavailable to non-admin users.'
                        : 'The system is fully operational and accessible to all users.'}
                      {' '}Use this during planned maintenance or emergency fixes.
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant={maintenanceEnabled ? 'default' : 'destructive'}
                  onClick={handleToggleMaintenance}
                  disabled={toggleMaintenance.isPending}
                  className={`rounded-xl ${maintenanceEnabled ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                >
                  {toggleMaintenance.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : maintenanceEnabled ? (
                    'Disable Maintenance'
                  ) : (
                    'Enable Maintenance'
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Payment Settings */}
        <div id="payment-settings" className="md:col-span-2 scroll-mt-24">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-[#171b21] dark:text-slate-100">
                <CreditCard className="h-5 w-5 text-[#8a939d] dark:text-slate-400" />
                Payment &amp; Installment Settings
              </CardTitle>
              <CardDescription className="text-[#616a74] dark:text-slate-400">
                Configure installment surcharge and stage split for project payments. Use this when payment terms change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Surcharge */}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                  Installment Surcharge (%)
                </Label>
                <div className="flex items-center gap-2 max-w-xs">
                  <Input
                    type="number"
                    value={surchargePercent}
                    onChange={(e) => setSurchargePercent(e.target.value)}
                    min={0}
                    max={100}
                    step={1}
                    className={inputClasses}
                  />
                  <span className="text-sm text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    % surcharge on total
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Customers paying in installments pay total + this surcharge. Set to 0 for no surcharge.
                </p>
              </div>

              {/* Stages */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                    Installment Stages
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStage}
                    disabled={splitValues.length >= 6}
                    className="h-7 rounded-lg border-gray-200 !bg-white/80 !text-[#171b21] text-xs hover:!bg-white dark:border-slate-600 dark:!bg-slate-800/90 dark:!text-slate-100 dark:hover:!bg-slate-700"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Stage
                  </Button>
                </div>

                <div className="space-y-2">
                  {splitValues.map((val, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={stageLabels[idx] || ''}
                        onChange={(e) => {
                          const newLabels = [...stageLabels];
                          newLabels[idx] = e.target.value;
                          setStageLabels(newLabels);
                        }}
                        placeholder={`Stage ${idx + 1}`}
                        className={`flex-1 ${inputClasses}`}
                      />
                      <Input
                        type="number"
                        value={val}
                        onChange={(e) => {
                          const newSplits = [...splitValues];
                          newSplits[idx] = e.target.value;
                          setSplitValues(newSplits);
                        }}
                        min={1}
                        max={100}
                        className={`w-20 text-center ${inputClasses}`}
                      />
                      <span className="text-sm text-gray-500 dark:text-slate-400">%</span>
                      {splitValues.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStage(idx)}
                          className="h-8 w-8 p-0 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Total:{' '}
                    <span
                      className={
                        Math.abs(
                          splitValues.map(Number).reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) - 100,
                        ) < 0.01
                          ? 'text-emerald-600 font-medium'
                          : 'text-red-500 font-medium'
                      }
                    >
                      {splitValues.map(Number).reduce((a, b) => a + (isNaN(b) ? 0 : b), 0)}%
                    </span>{' '}
                    (must be 100%)
                  </p>
                  <Button
                    variant="prominent"
                    onClick={handleSavePaymentSettings}
                    disabled={updateConfig.isPending}
                    className="rounded-lg"
                    size="sm"
                  >
                    {updateConfig.isPending ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Payment Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lifecycle Analytics Feature Toggle */}
        <div id="lifecycle-analytics" className="md:col-span-2 scroll-mt-24">
          <Card
            className={`border-l-4 rounded-xl ${
              lifecycleAnalyticsEnabled ? 'border-l-emerald-500' : 'border-l-amber-500 bg-amber-50/40'
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-slate-100">
                    Lifecycle Analytics Rollout
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-slate-400">
                    Controls reports lifecycle mismatch hotspots, trend analytics, and alert banners. Keep enabled for normal monitoring.
                  </CardDescription>
                </div>
                <Button
                  variant={lifecycleAnalyticsEnabled ? 'default' : 'outline'}
                  onClick={handleToggleLifecycleAnalytics}
                  disabled={updateConfig.isPending}
                  className={`rounded-xl ${lifecycleAnalyticsEnabled ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                >
                  {updateConfig.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : lifecycleAnalyticsEnabled ? (
                    'Disable Lifecycle Analytics'
                  ) : (
                    'Enable Lifecycle Analytics'
                  )}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Config Values */}
        <Card id="general-configuration" className="h-full flex flex-col rounded-xl scroll-mt-24 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#171b21] dark:text-slate-100">
              <Settings className="h-5 w-5 text-[#8a939d] dark:text-slate-400" />
              General Configuration
            </CardTitle>
            <CardDescription className="text-[#616a74] dark:text-slate-400">
              Use Easy Settings for day-to-day changes. Use Advanced Settings only for technical or JSON values.
            </CardDescription>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-200">
                Core: safer numeric values
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-semibold text-amber-700 dark:text-amber-200">
                Advanced: content or file-based settings
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {configsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : !configs || configs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                No configuration entries found.
              </div>
            ) : (
              <div className="space-y-6">
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#171b21] dark:text-slate-100">Easy Settings</h3>
                    <p className="text-xs text-[#616a74] dark:text-slate-400">
                      Clear labels for common values. Edit and save each field directly.
                    </p>
                  </div>

                  {simpleConfigs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-600 dark:border-slate-700 dark:text-slate-400">
                      No easy settings are configured yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {groupedSimpleConfigs.map((group) => (
                        <div key={group.id} className="rounded-2xl border border-[color:var(--color-border)]/70 bg-[var(--color-card)]/55 p-4">
                          <div>
                            <p className="text-sm font-semibold text-[#171b21] dark:text-slate-100">{group.title}</p>
                            <p className="mt-1 text-xs text-[#616a74] dark:text-slate-400">{group.description}</p>
                          </div>

                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            {group.configs.map((cfg) => {
                              const field = SIMPLE_CONFIG_FIELDS[cfg.key];
                              if (!field) return null;
                              const isSaving = simpleConfigSavingKey === cfg.key && updateConfig.isPending;
                              const changed = isSimpleConfigChanged(cfg);

                              return (
                                <div
                                  key={cfg._id}
                                  className="rounded-2xl border border-[color:var(--color-border)]/70 bg-[var(--color-card)]/80 p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-[#171b21] dark:text-slate-100">{field.label}</p>
                                      <p className="mt-1 text-xs leading-5 text-[#616a74] dark:text-slate-400">{field.help}</p>
                                    </div>
                                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#7b8490] dark:text-slate-500">{cfg.key}</p>
                                  </div>

                                  <div className="mt-3 flex items-end gap-2">
                                    <div className="flex-1">
                                      <Input
                                        type={field.inputType}
                                        value={simpleConfigValues[cfg.key] ?? ''}
                                        min={field.min}
                                        step={field.step}
                                        onChange={(event) =>
                                          setSimpleConfigValues((previous) => ({
                                            ...previous,
                                            [cfg.key]: event.target.value,
                                          }))
                                        }
                                        className="metal-input h-10"
                                      />
                                    </div>
                                    {field.unit ? (
                                      <span className="mb-2 whitespace-nowrap text-xs font-medium text-[#616a74] dark:text-slate-400">
                                        {field.unit}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-3 flex items-center justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => void handleSaveSimpleConfig(cfg)}
                                      disabled={!changed || isSaving}
                                      className="h-8 rounded-lg px-3 text-xs"
                                    >
                                      {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#171b21] dark:text-slate-100">Advanced Settings</h3>
                    <p className="text-xs text-[#616a74] dark:text-slate-400">
                      For technical values and JSON content. If unsure, leave unchanged and consult your technical lead.
                    </p>
                  </div>

                  {advancedConfigs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-600 dark:border-slate-700 dark:text-slate-400">
                      No advanced settings available.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {advancedConfigs.map((cfg) => {
                        const tier = getConfigTier(cfg.key);
                        const preview = getConfigPreview(cfg.value, cfg.key);

                        return (
                          <div
                            key={cfg._id}
                            className="metal-panel rounded-2xl border border-[color:var(--color-border)]/60 p-4 transition-colors hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_18px_28px_rgba(18,22,27,0.08)]"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                    {cfg.key}
                                  </p>
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                                    tier.tone === 'warning'
                                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                                      : tier.tone === 'success'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                                        : tier.tone === 'info'
                                          ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-200'
                                          : 'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-200'
                                  }`}>
                                    {tier.label}
                                  </span>
                                </div>
                                {cfg.description && (
                                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">{cfg.description}</p>
                                )}
                                {!cfg.description && (
                                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-slate-300">
                                    Technical system value. Open to review before editing.
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditConfig(cfg)}
                                  className="h-8 rounded-lg border-[color:var(--color-border)]/70 bg-white/90 px-3 text-xs text-[var(--color-card-foreground)] hover:bg-white dark:border-slate-600/80 dark:bg-slate-900/75 dark:text-slate-100 dark:hover:bg-slate-800/90"
                                >
                                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                                  Edit value
                                </Button>
                              </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(248,250,252,0.92)_100%)] p-3 dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.78)_0%,rgba(15,23,42,0.94)_100%)]">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8490] dark:text-slate-400">
                                Current value
                              </p>
                              <div className="mt-2 space-y-2 font-mono text-sm leading-6 text-[#434c56] dark:text-slate-200">
                                {preview.kind === 'text' ? (
                                  <p className="break-all">{preview.summary}</p>
                                ) : (
                                  <>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#171b21] dark:text-slate-100">
                                      <span>{preview.summary}</span>
                                      {preview.details && <span className="text-[#7b8490] dark:text-slate-400">{preview.details}</span>}
                                    </div>
                                    <p className="line-clamp-3 break-words text-xs leading-5 text-[#616a74] dark:text-slate-400">
                                      {preview.excerpt}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Edit Config Dialog */}
      <Dialog
        open={!!editConfig}
        onOpenChange={(o) => {
          if (!o) setEditConfig(null);
        }}
      >
        <DialogContent className="metal-panel max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#171b21] dark:text-slate-100">Update Configuration</DialogTitle>
            <DialogDescription className="text-[#616a74] dark:text-slate-100">
              Modifying system constants can affect application behavior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono text-gray-500 dark:text-slate-300 uppercase">Key</Label>
              <Input
                value={editConfig?.key || ''}
                disabled
                className="metal-input bg-white/30 font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="cfg-value"
                className="text-[13px] font-medium text-gray-700 dark:text-slate-300"
              >
                Value
              </Label>
              <Input
                id="cfg-value"
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                className={`font-mono ${inputClasses}`}
              />
              <p className="text-xs text-gray-400 dark:text-slate-300">JSON objects are supported.</p>
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewConfigImpact}
                  disabled={previewConfigImpact.isPending}
                  className="rounded-lg"
                >
                  {previewConfigImpact.isPending ? (
                    <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                  )}
                  Preview Impact
                </Button>
                {configImpact?.riskLevel && (
                  <span className={`text-xs font-semibold uppercase tracking-wide ${getRiskLabelClass(configImpact.riskLevel)}`}>
                    Risk: {configImpact.riskLevel}
                  </span>
                )}
              </div>
            </div>
            {configImpact && (
              <div className={`rounded-xl border p-3 ${getRiskPanelClass(configImpact.riskLevel)}`}>
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">Impact Preview</p>
                <p className="mt-1 text-xs text-gray-700 dark:text-slate-300">{getImpactSummaryText(configImpact)}</p>
                {configImpact.warnings.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-slate-300">
                    {configImpact.warnings.map((warning, idx) => (
                      <li key={idx}>- {warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:text-slate-300">Version History</p>
              </div>
              {getVersionHistoryStatus(configVersionsLoading, configVersionHistory?.versions?.length || 0) === 'loading' ? (
                <p className="text-xs text-gray-500 dark:text-slate-400">Loading previous versions...</p>
              ) : getVersionHistoryStatus(configVersionsLoading, configVersionHistory?.versions?.length || 0) === 'empty' ? (
                <p className="text-xs text-gray-500 dark:text-slate-400">No previous versions available yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {configVersionHistory?.versions?.map((version) => (
                    <div key={version._id} className="rounded-lg border border-gray-200 dark:border-slate-700 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-gray-600 dark:text-slate-300">
                          {new Date(version.updatedAt).toLocaleString()}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void handleRollbackConfigVersion(version._id)}
                          disabled={rollbackConfigVersion.isPending}
                          className="h-6 rounded-md text-[10px]"
                        >
                          Rollback
                        </Button>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-gray-700 dark:text-slate-300 break-all">
                        {typeof version.value === 'string' ? version.value : JSON.stringify(version.value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="cfg-desc"
                className="text-[13px] font-medium text-gray-700 dark:text-slate-300"
              >
                Description
              </Label>
              <Input
                id="cfg-desc"
                value={configDesc}
                onChange={(e) => setConfigDesc(e.target.value)}
                placeholder="Optional description"
                className={inputClasses}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setEditConfig(null)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={updateConfig.isPending}
                className="rounded-lg text-white dark:text-white"
              >
                {updateConfig.isPending ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
