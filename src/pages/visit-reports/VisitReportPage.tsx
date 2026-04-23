import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format, addDays, getDay, startOfDay } from 'date-fns';
import {
  ArrowLeft,
  Save,
  Send,
  RotateCcw,
  Ruler,
  Paintbrush,
  Package,
  StickyNote,
  Camera,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Layers,
  FolderOpen,
  AlertTriangle,
  Wrench,
  Home,
  Briefcase,
  ExternalLink,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { extractErrorMessage, extractLocalDateValue, serializeDateOnlyAsUtcNoon, cn } from '@/lib/utils';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PageLoader } from '@/components/shared/PageLoader';
import { PageError } from '@/components/shared/PageError';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { ServiceTypePicker } from '@/components/shared/ServiceTypePicker';
import { LineItemsEditor } from '@/components/shared/LineItemsEditor';
import { SiteConditionsPanel } from '@/components/shared/SiteConditionsPanel';
import { PhotoUploadGrid } from '@/components/shared/PhotoUploadGrid';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProjectNavigator } from '@/components/shared/ProjectNavigator';
import {
  useVisitReport,
  useUpdateVisitReport,
  useSubmitVisitReport,
  useReturnVisitReport,
  useReopenVisitReportForRepair,
} from '@/hooks/useVisitReports';
import { useProjectByVisitReport } from '@/hooks/useProjects';
import { useHolidays, useBlockedSlots } from '@/hooks/useConfig';
import { useAuthStore } from '@/stores/auth.store';
import {
  Role,
  VisitReportStatus,
  ServiceType,
  MeasurementUnit,
  SERVICE_TYPE_LABELS,
  MEASUREMENT_UNIT_LABELS,
  ENVIRONMENT_LABELS,
  Environment,
  SLOT_CODES,
} from '@/lib/constants';
import type { LineItem, SiteConditions, VisitReport } from '@/lib/types';


const DEFAULT_SITE_CONDITIONS: SiteConditions = {
  environment: Environment.INDOOR,
  hasElectrical: false,
  hasPlumbing: false,
};

function formatSlotTime(slotCode: string): string {
  const hour = parseInt(slotCode.split(':')[0] ?? '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${ampm}`;
}

/** Mongoose populate may return an object with _id; this always gives the raw string ID. */
function rawId(field: unknown): string {
  if (typeof field === 'string') return field;
  if (field && typeof field === 'object' && '_id' in (field as Record<string, unknown>))
    return String((field as Record<string, unknown>)._id);
  return String(field);
}

function isNonEmptyString(value?: string | null) {
  return Boolean(value?.trim());
}

function getIncompleteOcularFields(report: {
  actualVisitDateTime?: string;
  lineItems?: LineItem[];
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    thickness?: number;
    raw?: string;
  };
  siteConditions?: SiteConditions;
  materials?: string;
  finishes?: string;
  preferredDesign?: string;
  photoKeys?: string[];
  initialDesignKeys?: string[];
  initialDesignNotes?: string;
}) {
  const missing: string[] = [];

  if (!isNonEmptyString(report.actualVisitDateTime)) {
    missing.push('actual visit date and time');
  }

  const lineItems = report.lineItems || [];
  if (lineItems.length > 0) {
    lineItems.forEach((item, index) => {
      const isComplete = isNonEmptyString(item.label)
        && item.quantity >= 1
        && item.length != null
        && item.width != null
        && item.height != null
        && item.thickness != null
        && item.area != null
        && isNonEmptyString(item.notes);

      if (!isComplete) {
        missing.push(`complete measurement details for line item ${index + 1}`);
      }
    });
  } else {
    const legacy = report.measurements;
    const hasCompleteLegacyMeasurements = Boolean(
      legacy
      && legacy.length != null
      && legacy.width != null
      && legacy.height != null
      && legacy.thickness != null
      && legacy.area != null
      && isNonEmptyString(legacy.raw),
    );

    if (!hasCompleteLegacyMeasurements) {
      missing.push('at least one complete measurement item');
    }
  }

  if (!isNonEmptyString(report.siteConditions?.environment)) missing.push('site environment');
  if (!isNonEmptyString(report.siteConditions?.floorType)) missing.push('floor type');
  if (!isNonEmptyString(report.siteConditions?.wallMaterial)) missing.push('wall material');
  if (report.siteConditions?.hasElectrical === undefined) missing.push('electrical nearby status');
  if (report.siteConditions?.hasPlumbing === undefined) missing.push('plumbing nearby status');
  if (!isNonEmptyString(report.siteConditions?.accessNotes)) missing.push('access notes');
  if (!isNonEmptyString(report.siteConditions?.obstaclesOrConstraints)) missing.push('obstacles or constraints');

  if (!isNonEmptyString(report.materials)) missing.push('materials');
  if (!isNonEmptyString(report.finishes)) missing.push('finishes');
  if (!isNonEmptyString(report.preferredDesign)) missing.push('preferred design');
  if ((report.photoKeys?.length || 0) === 0) missing.push('site photos');
  if ((report.initialDesignKeys?.length || 0) === 0) missing.push('initial design files');
  if (!isNonEmptyString(report.initialDesignNotes)) missing.push('initial design notes');

  return [...new Set(missing)];
}

function formatIncompleteOcularMessage(missingFields: string[]) {
  return `You have not yet provided information on: ${missingFields.join(', ')}.`;
}

export function VisitReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: report, isLoading, isError, refetch } = useVisitReport(id!);

  const updateMutation = useUpdateVisitReport();
  const submitMutation = useSubmitVisitReport();
  const returnMutation = useReturnVisitReport();
  const reopenMutation = useReopenVisitReportForRepair();

  // Fetch the linked project (only when report is submitted/completed)
  const { data: linkedProject } = useProjectByVisitReport(
    report && report.status !== VisitReportStatus.DRAFT ? id : undefined,
  );

  const [submitOpen, setSubmitOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [repairReason, setRepairReason] = useState('');

  // ── Form state ──
  const [visitType, setVisitType] = useState('');
  const [actualVisitDateTime, setActualVisitDateTime] = useState('');
  const [actualVisitDate, setActualVisitDate] = useState('');   // 'YYYY-MM-DD'
  const [actualVisitTime, setActualVisitTime] = useState('');   // slot code e.g. '09:00'
  const [visitDateOpen, setVisitDateOpen] = useState(false);
  const [serviceType, setServiceType] = useState(ServiceType.CUSTOM as string);
  const [serviceTypeCustom, setServiceTypeCustom] = useState('');
  const [materials, setMaterials] = useState('');
  const [finishes, setFinishes] = useState('');
  const [preferredDesign, setPreferredDesign] = useState('');
  const [customerRequirements, setCustomerRequirements] = useState('');
  const [notes, setNotes] = useState('');

  const [discussionNotes, setDiscussionNotes] = useState('');
  const [initialDesignKeys, setInitialDesignKeys] = useState<string[]>([]);
  const [initialDesignNotes, setInitialDesignNotes] = useState('');
  const [initialDesignUploading, setInitialDesignUploading] = useState(false);
  const [recommendedOcularDate, setRecommendedOcularDate] = useState('');
  const [recommendedOcularSlot, setRecommendedOcularSlot] = useState('');
  const [ocularDateOpen, setOcularDateOpen] = useState(false);

  // Measurements
  const [measurementUnit, setMeasurementUnit] = useState(MeasurementUnit.CM as string);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Legacy measurements (for old reports)
  const [legacyLength, setLegacyLength] = useState('');
  const [legacyWidth, setLegacyWidth] = useState('');
  const [legacyHeight, setLegacyHeight] = useState('');
  const [legacyThickness, setLegacyThickness] = useState('');
  const [legacyMeasurementNotes, setLegacyMeasurementNotes] = useState('');

  // Site conditions
  const [siteConditions, setSiteConditions] = useState<SiteConditions>(DEFAULT_SITE_CONDITIONS);

  // File uploads
  const [photoKeys, setPhotoKeys] = useState<string[]>([]);
  const [videoKeys, setVideoKeys] = useState<string[]>([]);
  const [sketchKeys, setSketchKeys] = useState<string[]>([]);
  const [referenceImageKeys, setReferenceImageKeys] = useState<string[]>([]);

  const [formLoaded, setFormLoaded] = useState(false);

  // Reset form when switching between reports (route :id changes)
  useEffect(() => {
    setFormLoaded(false);
  }, [id]);

  // Keep actualVisitDateTime in sync with separate date/time pickers
  useEffect(() => {
    if (actualVisitDate && actualVisitTime) {
      setActualVisitDateTime(`${actualVisitDate}T${actualVisitTime}`);
    } else if (actualVisitDate) {
      setActualVisitDateTime(`${actualVisitDate}T09:00`);
    } else {
      setActualVisitDateTime('');
    }
  }, [actualVisitDate, actualVisitTime]);

  // Fetch holidays & blocked slots for the selected visit date
  const visitDateYear = actualVisitDate ? actualVisitDate.slice(0, 4) : String(new Date().getFullYear());
  const { data: holidays } = useHolidays(visitDateYear);
  const { data: blockedSlots } = useBlockedSlots(actualVisitDate || undefined);

  // Build set of blocked slot codes for the selected date+type
  const blockedSlotCodes = useMemo(() => {
    if (!blockedSlots) return new Set<string>();
    // Block slots of the appointment type matching the visit type ('ocular' or 'office')
    const relevantType = report?.visitType === 'ocular' ? 'ocular' : 'office';
    return new Set(blockedSlots.filter(s => s.type === relevantType).map(s => s.slotCode));
  }, [blockedSlots, report?.visitType]);

  // Build a set of holiday dates for fast lookup (YYYY-MM-DD)
  const holidayDates = useMemo(() => {
    if (!holidays) return new Set<string>();
    return new Set(holidays.map(h => h.date.slice(0, 10)));
  }, [holidays]);

  /** Disable weekends, holidays, and past dates (except today) on the visit date calendar */
  const isVisitDateDisabled = (day: Date): boolean => {
    const dow = getDay(day);
    if (dow === 0 || dow === 6) return true; // weekends
    const dateStr = format(day, 'yyyy-MM-dd');
    if (holidayDates.has(dateStr)) return true; // holidays
    return false;
  };

  const isSalesStaff = user?.roles.includes(Role.SALES_STAFF);
  const isAdmin = user?.roles.includes(Role.ADMIN);
  const isEngineerOrAdmin =
    user?.roles.includes(Role.ENGINEER) || user?.roles.includes(Role.ADMIN);
  const linkedProjectId = linkedProject?._id || (report?.linkedProjectId ? rawId(report.linkedProjectId) : '');
  const isConsultationDraftProject =
    report?.visitType === 'consultation' && linkedProject?.status === 'draft';

  // Calculation of payment dependency
  const appointment = report?.appointmentId;
  const isPopulatedAppt = appointment && typeof appointment === 'object' && 'ocularFeePaid' in (appointment as any);
  
  const isOcularCashFeePending =
    report?.visitType === 'ocular' &&
    isPopulatedAppt &&
    (appointment as any).ocularFeePaymentChoice === 'cash' &&
    !(appointment as any).ocularFeeBreakdown?.isWithinNCR &&
    !(appointment as any).ocularFeePaid;

  const isSubmissionBlocked = isOcularCashFeePending;

  // Pre-fill form when data arrives
  if (report && !formLoaded) {
    setVisitType(report.visitType || '');
    // Convert UTC ISO string to local date + time for split pickers
    if (report.actualVisitDateTime) {
      const d = new Date(report.actualVisitDateTime);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      const isoLocal = local.toISOString().slice(0, 16);
      setActualVisitDateTime(isoLocal);
      setActualVisitDate(isoLocal.slice(0, 10));
      // Snap to nearest slot hour
      const hours = local.getHours();
      const slotHour = String(hours).padStart(2, '0') + ':00';
      setActualVisitTime(slotHour);
    } else {
      setActualVisitDateTime('');
      setActualVisitDate('');
      setActualVisitTime('');
    }
    setServiceType(report.serviceType || ServiceType.CUSTOM);
    setServiceTypeCustom(report.serviceTypeCustom || '');
    setMaterials(report.materials || '');
    setFinishes(report.finishes || '');
    setPreferredDesign(report.preferredDesign || '');
    setCustomerRequirements(report.customerRequirements || '');
    setNotes(report.notes || '');

    // Consultation-specific fields
    setDiscussionNotes(report.discussionNotes || '');
    setInitialDesignKeys(report.initialDesignKeys || []);
    setInitialDesignNotes(report.initialDesignNotes || '');
    if (report.recommendedOcularDate) {
      setRecommendedOcularDate(extractLocalDateValue(report.recommendedOcularDate));
    }
    setRecommendedOcularSlot(report.recommendedOcularSlot || '');

    // New measurement system
    setMeasurementUnit(report.measurementUnit || MeasurementUnit.CM);
    setLineItems(report.lineItems || []);

    // Legacy measurements
    if (report.measurements) {
      setLegacyLength(report.measurements.length?.toString() || '');
      setLegacyWidth(report.measurements.width?.toString() || '');
      setLegacyHeight(report.measurements.height?.toString() || '');
      setLegacyThickness(report.measurements.thickness?.toString() || '');
      setLegacyMeasurementNotes(report.measurements.raw || '');
    }

    // Site conditions
    if (report.siteConditions) {
      setSiteConditions(report.siteConditions);
    }

    // File keys
    setPhotoKeys(report.photoKeys || []);
    setVideoKeys(report.videoKeys || []);
    setSketchKeys(report.sketchKeys || []);
    setReferenceImageKeys(report.referenceImageKeys || []);

    setFormLoaded(true);
  }

  if (isLoading) return <PageLoader />;
  if (isError || !report) return <PageError onRetry={refetch} />;

  const isDraft = report.status === VisitReportStatus.DRAFT;
  const isReturned = report.status === VisitReportStatus.RETURNED;
  const isSubmitted = report.status === VisitReportStatus.SUBMITTED;
  const isCompleted = report.status === VisitReportStatus.COMPLETED;
  const canEdit = isSalesStaff && (isDraft || isReturned);
  const canReturn =
    isEngineerOrAdmin && isSubmitted;
  const reportHasMeasuredLineItems = Boolean(report.lineItems?.some((item) =>
    item.length != null ||
    item.width != null ||
    item.height != null ||
    item.area != null ||
    item.thickness != null,
  ));
  const reportHasLegacyMeasurements = Boolean(
    report.measurements && (
      report.measurements.length != null ||
      report.measurements.width != null ||
      report.measurements.height != null ||
      report.measurements.area != null ||
      report.measurements.thickness != null ||
      report.measurements.raw
    ),
  );
  const reportHasMeasurements = reportHasMeasuredLineItems || reportHasLegacyMeasurements;
  const canReopenForRepair = Boolean(
    report.visitType === 'ocular' &&
    !canEdit &&
    !reportHasMeasurements &&
    (isSalesStaff || isAdmin) &&
    (isSubmitted || isCompleted)
  );

  // Detect if this is an old-style report (has legacy measurements but no lineItems)
  const isLegacyReport = !!(
    report.measurements &&
    (report.measurements.length != null ||
      report.measurements.width != null ||
      report.measurements.height != null) &&
    (!report.lineItems || report.lineItems.length === 0)
  );

  const serviceLabel =
    serviceType === ServiceType.CUSTOM
      ? serviceTypeCustom || 'Custom'
      : SERVICE_TYPE_LABELS[serviceType] || serviceType;

  const saveDraft = async ({
    showSuccessToast = false,
    showErrorToast = true,
  }: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
  } = {}): Promise<VisitReport | null> => {
    try {
      let normalizedActualVisitDateTime: string | undefined;
      if (actualVisitDateTime) {
        const parsedDate = new Date(actualVisitDateTime);
        if (Number.isNaN(parsedDate.getTime())) {
          if (showErrorToast) toast.error('Invalid visit date/time');
          return null;
        }
        normalizedActualVisitDateTime = parsedDate.toISOString();
      }

      // Build legacy measurements only if this is a legacy report
      let measurements: Record<string, unknown> | undefined;
      if (isLegacyReport) {
        measurements = {};
        if (legacyLength) measurements.length = parseFloat(legacyLength);
        if (legacyWidth) measurements.width = parseFloat(legacyWidth);
        if (legacyHeight) measurements.height = parseFloat(legacyHeight);
        if (legacyThickness) measurements.thickness = parseFloat(legacyThickness);
        if (legacyMeasurementNotes) measurements.raw = legacyMeasurementNotes;
        if (!Object.keys(measurements).length) measurements = undefined;
      }

      const savedReport = await updateMutation.mutateAsync({
        id: id!,
        visitType: visitType || undefined,
        actualVisitDateTime: normalizedActualVisitDateTime,
        serviceType: serviceType || undefined,
        serviceTypeCustom: serviceTypeCustom || undefined,
        customerRequirements: customerRequirements || undefined,
        notes: notes || undefined,
        // Ocular-only fields
        ...(visitType === 'ocular' && {
          measurementUnit,
          lineItems,
          measurements,
          siteConditions,
          materials: materials || undefined,
          finishes: finishes || undefined,
          preferredDesign: preferredDesign || undefined,
          photoKeys,
          videoKeys,
          sketchKeys,
          referenceImageKeys,
        }),
        // Consultation-specific fields
        ...(visitType === 'consultation' && {
          discussionNotes: discussionNotes || undefined,
          recommendedOcularDate: serializeDateOnlyAsUtcNoon(recommendedOcularDate),
          recommendedOcularSlot: recommendedOcularSlot || undefined,
        }),
        ...(visitType === 'ocular' && {
          initialDesignKeys,
          initialDesignNotes: initialDesignNotes || undefined,
        }),
      });
      if (showSuccessToast) toast.success('Report saved');
      return savedReport;
    } catch (err) {
      if (showErrorToast) toast.error(extractErrorMessage(err, 'Failed to save report'));
      return null;
    }
  };

  const handleSave = async () => {
    await saveDraft({ showSuccessToast: true, showErrorToast: true });
  };

  const handleBeforeProjectSwitch = async () => {
    if (!canEdit) return true;
    const saved = await saveDraft({ showSuccessToast: false, showErrorToast: true });
    return Boolean(saved);
  };

  const handleSubmit = async () => {
    const isOcular = report?.visitType === 'ocular';

    if (isOcular) {
      const missingFields = getIncompleteOcularFields({
        actualVisitDateTime,
        lineItems,
        measurements: isLegacyReport
          ? {
            length: legacyLength ? parseFloat(legacyLength) : undefined,
            width: legacyWidth ? parseFloat(legacyWidth) : undefined,
            height: legacyHeight ? parseFloat(legacyHeight) : undefined,
            thickness: legacyThickness ? parseFloat(legacyThickness) : undefined,
            raw: legacyMeasurementNotes || undefined,
          }
          : undefined,
        siteConditions,
        materials,
        finishes,
        preferredDesign,
        photoKeys,
        initialDesignKeys,
        initialDesignNotes,
      });

      if (missingFields.length > 0) {
        toast.error(formatIncompleteOcularMessage(missingFields), { duration: 7000 });
        setSubmitOpen(false);
        return;
      }
    }

    try {
      const saved = await saveDraft({ showSuccessToast: false, showErrorToast: true });
      if (!saved) {
        setSubmitOpen(false);
        return;
      }

      if (isOcular) {
        const missingPersistedFields = getIncompleteOcularFields({
          actualVisitDateTime: saved.actualVisitDateTime,
          lineItems: saved.lineItems,
          measurements: saved.measurements,
          siteConditions: saved.siteConditions,
          materials: saved.materials,
          finishes: saved.finishes,
          preferredDesign: saved.preferredDesign,
          photoKeys: saved.photoKeys,
          initialDesignKeys: saved.initialDesignKeys,
          initialDesignNotes: saved.initialDesignNotes,
        });

        if (missingPersistedFields.length > 0) {
          setSubmitOpen(false);
          toast.error(formatIncompleteOcularMessage(missingPersistedFields), { duration: 7000 });
          await refetch();
          return;
        }
      }

      await submitMutation.mutateAsync(id!);
      await refetch();
      toast.success(
        isOcular
          ? 'Report submitted! The existing project has been updated with your on-site data. An engineer will review it next.'
          : 'Report submitted! A draft project has been created. Next: the appointment agent should finalize the ocular visit before engineering begins.',
        { duration: 5000 },
      );
      setSubmitOpen(false);
    } catch (err) {
      setSubmitOpen(false);
      const message = extractErrorMessage(err, 'Failed to submit report');
      if (!message.includes('appointment must be marked as complete')) {
        toast.error(message);
        return;
      }
      const apptId = report ? rawId(report.appointmentId) : null;
      toast((t) => (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            The appointment must be marked as complete first before submitting reports.
          </p>
          {apptId && (
            <button
              type="button"
              onClick={() => { toast.dismiss(t.id); navigate(`/appointments/${apptId}`); }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 text-left"
            >
              Go to Appointment →
            </button>
          )}
        </div>
      ), { duration: 6000, icon: '⚠️' });
    }
  };

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('Please provide a reason for returning');
      return;
    }
    try {
      await returnMutation.mutateAsync({ id: id!, reason: returnReason });
      await refetch();
      toast.success('Report returned to sales staff');
      setReturnOpen(false);
      setReturnReason('');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to return report'));
    }
  };

  const handleReopenForRepair = async () => {
    if (!repairReason.trim()) {
      toast.error('Please explain why this ocular report needs repair.');
      return;
    }
    try {
      await reopenMutation.mutateAsync({ id: id!, reason: repairReason.trim() });
      await refetch();
      toast.success('Ocular report reopened for repair. Sales can now correct and resubmit it.');
      setReopenOpen(false);
      setRepairReason('');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to reopen report for repair'));
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string;
  }) => (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg border border-[#d7dde5] bg-white shadow-[0_4px_12px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-800 p-2">
        <Icon className="h-4 w-4 text-[#5a6675] dark:text-slate-400" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-[#46515f] dark:text-slate-300">{label}</p>
        <p className="text-sm text-[#667282] dark:text-slate-400">{value}</p>
      </div>
    </div>
  );

  const editCardClassName =
    'rounded-xl border border-[#cfd6df] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(17,24,34,0.96)_0%,rgba(10,17,26,0.98)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_36px_rgba(0,0,0,0.26)]';

  const editInputClassName =
    'rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:border-[#6e6e73] focus:ring-[#6e6e73]/20 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/30 dark:focus:border-white/30 dark:focus:ring-[#d6b36a]/20';

  const editSectionClassName =
    'rounded-xl border border-[#cfd6df] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(17,24,34,0.96)_0%,rgba(10,17,26,0.98)_100%)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_36px_rgba(0,0,0,0.26)]';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/projects?tab=visit-reports')}
            className="rounded-xl text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100 truncate">
              {canEdit ? 'Edit Visit Report' : 'Visit Report Details'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-300 mt-0.5 flex items-center gap-2">
              <span className="truncate">{serviceLabel}</span>
              <span className="hidden sm:inline">&middot;</span>
              <span className="shrink-0">{report.visitType === 'ocular' ? 'Ocular Visit' : 'Consultation'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Address & Markers moved to header area for visibility */}
        {report.appointmentId && typeof report.appointmentId === 'object' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-white/10 dark:bg-white/5 max-w-full sm:max-w-xs">
            {((report.appointmentId as any).addressStructured?.addressType === 'personal' || !(report.appointmentId as any).addressStructured?.addressType) ? (
              <Home className="h-4 w-4 text-blue-500 shrink-0" />
            ) : (
              <Briefcase className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <p className="text-xs text-gray-600 dark:text-slate-400 truncate">
              {(report.appointmentId as any).formattedAddress || (report.appointmentId as any).customerAddress || 'No address provided'}
            </p>
          </div>
        )}
      </div>

      {/* ── Project Navigator (multi-project strip) ── */}
      <ProjectNavigator
        appointmentId={rawId(report.appointmentId)}
        activeReportId={String(report._id)}
        canAdd={!!isSalesStaff && (isDraft || isReturned) && report.visitType !== 'ocular'}
        canEdit={!!isSalesStaff && (isDraft || isReturned) && report.visitType !== 'ocular'}
        onBeforeNavigate={handleBeforeProjectSwitch}
      />

      {/* ── Return reason banner ── */}
      {report.returnReason && isReturned && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/60 dark:bg-orange-950/40">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-100">
            Report Returned
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">{report.returnReason}</p>
        </div>
      )}

      {report.visitType === 'ocular' && !reportHasMeasurements && !canEdit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Measurements are missing from this ocular report</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                The engineer can still see the rest of the ocular notes and attachments, but this report does not contain measured line items or legacy dimensions yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {isConsultationDraftProject && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/60 dark:bg-blue-950/40">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Ocular visit is still required</p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-200">
            This consultation created a draft project, but engineering cannot start until the ocular visit is finalized and its report is submitted.
          </p>
        </div>
      )}

      {/* Warning Banner: Unpaid Ocular Cash Fee */}
      {isOcularCashFeePending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Ocular Fee Verification Required
              </p>
              <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                This is an off-site ocular visit with a cash payment choice. You must record the cash collection and have it verified by the cashier before you can submit this report.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3.5 h-8 rounded-lg border-amber-200 bg-white text-xs font-medium text-amber-800 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                onClick={() => {
                  const apptId = report ? rawId(report.appointmentId) : null;
                  if (apptId) navigate(`/appointments/${apptId}`);
                }}
              >
                Go to Appointment to record payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── READ-ONLY VIEWS (for non-editors) ── */}
      {!canEdit && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Report Info */}
            <Card className={editCardClassName}>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-slate-100">Report Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow icon={Layers} label="Service Type" value={serviceLabel} />
                <InfoRow
                  icon={CalendarIcon}
                  label="Created"
                  value={format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                />
                {report.actualVisitDateTime && (
                  <InfoRow
                    icon={CalendarIcon}
                    label="Visit Date"
                    value={format(new Date(report.actualVisitDateTime), 'MMM d, yyyy h:mm a')}
                  />
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card className={editCardClassName}>
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-slate-100">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.materials && (
                  <InfoRow icon={Package} label="Materials" value={report.materials} />
                )}
                {report.finishes && (
                  <InfoRow icon={Paintbrush} label="Finishes" value={report.finishes} />
                )}
                {report.preferredDesign && (
                  <InfoRow icon={Paintbrush} label="Preferred Design" value={report.preferredDesign} />
                )}
                {report.customerRequirements && (
                  <InfoRow icon={StickyNote} label="Customer Requirements" value={report.customerRequirements} />
                )}
                {report.notes && (
                  <InfoRow icon={StickyNote} label="Notes" value={report.notes} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consultation Summary (read-only) */}
          {report.visitType === 'consultation' && (
            <Card className="rounded-xl border-blue-100 dark:border-blue-900/60 dark:bg-slate-900/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <FolderOpen className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                  Project Discussed & Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border border-[#d8dee6] bg-[#f8fafc] p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <StickyNote className="h-4 w-4" /> Discussion Notes
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[#647080] dark:text-slate-400">
                    {report.discussionNotes || 'N/A'}
                  </p>
                </div>

                {(report.recommendedOcularDate || report.recommendedOcularSlot) && (
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                    <p className="text-[13px] font-semibold text-gray-800 dark:text-slate-200 mb-3">Recommended Ocular Schedule</p>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-slate-400">
                      {report.recommendedOcularDate && (
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-blue-500/70" />
                          <span>Date: <strong>{format(new Date(`${extractLocalDateValue(report.recommendedOcularDate)}T00:00:00`), 'MMMM d, yyyy')}</strong></span>
                        </div>
                      )}
                      {report.recommendedOcularSlot && (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 flex items-center justify-center text-[10px] font-bold border border-blue-500/50 rounded-full text-blue-500/70">T</div>
                          <span>Time: <strong>{(() => {
                            const hour = parseInt(report.recommendedOcularSlot.split(':')[0] ?? '0');
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            return `${display}:00 ${ampm}`;
                          })()}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Line Items (read-only) — ocular only */}
          {report.visitType === 'ocular' && report.lineItems && report.lineItems.length > 0 && (
            <Card className={editSectionClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <Ruler className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  Measurements ({MEASUREMENT_UNIT_LABELS[report.measurementUnit || 'cm'] || report.measurementUnit})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {report.lineItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-[#d8dee6] bg-[#f8fafc] p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-800/80">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#cfd6df] bg-white text-xs font-bold text-[#5e6977] shadow-[0_2px_8px_rgba(15,23,42,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.label}</p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#647080] dark:text-slate-400">
                          {item.length != null && <span>L: {item.length}</span>}
                          {item.width != null && <span>W: {item.width}</span>}
                          {item.height != null && <span>H: {item.height}</span>}
                          {item.thickness != null && <span>T: {item.thickness}</span>}
                          {item.area != null && <span>Area: {item.area}</span>}
                          <span>Qty: {item.quantity}</span>
                        </div>
                        {item.notes && (
                          <p className="mt-1 text-xs text-[#7b8694] dark:text-slate-400">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legacy measurements (read-only) — ocular only */}
          {report.visitType === 'ocular' && isLegacyReport && report.measurements && (
            <Card className="rounded-xl border-gray-100 dark:border-slate-700 dark:bg-slate-900/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <Ruler className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  Measurements (Legacy)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2 text-sm text-gray-500 dark:text-slate-400">
                  {report.measurements.length != null && (
                    <span>Length: {report.measurements.length} {report.measurements.unit}</span>
                  )}
                  {report.measurements.width != null && (
                    <span>Width: {report.measurements.width} {report.measurements.unit}</span>
                  )}
                  {report.measurements.height != null && (
                    <span>Height: {report.measurements.height} {report.measurements.unit}</span>
                  )}
                  {report.measurements.thickness != null && (
                    <span>Thickness: {report.measurements.thickness} {report.measurements.unit}</span>
                  )}
                </div>
                {report.measurements.raw && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{report.measurements.raw}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Site Conditions (read-only) — ocular only */}
          {report.visitType === 'ocular' && report.siteConditions && (
            <Card className="rounded-xl border-gray-100 dark:border-slate-700 dark:bg-slate-900/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  Site Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow icon={MapPin} label="Environment" value={ENVIRONMENT_LABELS[report.siteConditions.environment] || report.siteConditions.environment} />
                {report.siteConditions.floorType && (
                  <InfoRow icon={Layers} label="Floor Type" value={report.siteConditions.floorType} />
                )}
                {report.siteConditions.wallMaterial && (
                  <InfoRow icon={Layers} label="Wall Material" value={report.siteConditions.wallMaterial} />
                )}
                {report.siteConditions.accessNotes && (
                  <InfoRow icon={StickyNote} label="Access Notes" value={report.siteConditions.accessNotes} />
                )}
                {report.siteConditions.obstaclesOrConstraints && (
                  <InfoRow icon={StickyNote} label="Obstacles" value={report.siteConditions.obstaclesOrConstraints} />
                )}
                <div className="flex gap-4 text-sm text-gray-500 dark:text-slate-400">
                  {report.siteConditions.hasElectrical && <span>Electrical nearby</span>}
                  {report.siteConditions.hasPlumbing && <span>Plumbing nearby</span>}
                </div>
              </CardContent>
            </Card>
          )}

          {report.visitType === 'ocular' && (report.initialDesignKeys?.length || report.initialDesignNotes) && (
            <Card className="rounded-xl border-gray-100 dark:border-slate-700 dark:bg-slate-900/90 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <Paintbrush className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  Initial Design
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!!report.initialDesignKeys?.length && (
                  <FileUpload
                    folder="visit-reports/initial-design"
                    existingKeys={report.initialDesignKeys}
                    onUploadComplete={() => {}}
                    readOnly
                    label="Initial design files"
                  />
                )}
                {report.initialDesignNotes && (
                  <InfoRow icon={Paintbrush} label="Initial Design Notes" value={report.initialDesignNotes} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Photos (read-only summary) — ocular only */}
          {report.visitType === 'ocular' && (
          <PhotoUploadGrid
            photoKeys={report.photoKeys || []}
            videoKeys={report.videoKeys || []}
            sketchKeys={report.sketchKeys || []}
            referenceImageKeys={report.referenceImageKeys || []}
            onPhotoKeysChange={() => {}}
            onVideoKeysChange={() => {}}
            onSketchKeysChange={() => {}}
            onReferenceImageKeysChange={() => {}}
            disabled
          />
          )}
        </div>
      )}

      {/* ── EDITABLE FORM (Sales Staff on DRAFT/RETURNED) ── */}
      {canEdit && (
        <div className="space-y-6">
          {/* Section 1: Service Type + Visit Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-xl border-gray-100 dark:border-slate-700 dark:bg-slate-900/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-slate-100">
                  Service & Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ServiceTypePicker
                  value={serviceType ? [serviceType] : []}
                  customValue={serviceTypeCustom}
                  onChange={(types, custom) => {
                    setServiceType(types[0] || ServiceType.CUSTOM);
                    setServiceTypeCustom(custom || '');
                  }}
                  disabled={report?.visitType === 'ocular'}
                />

                {/* ── Actual Visit Date (Calendar Popover) ── */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                    Actual Visit Date
                  </Label>
                  <Popover open={visitDateOpen} onOpenChange={setVisitDateOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:focus:ring-[#d6b36a]/20',
                          !actualVisitDate && 'text-gray-400 dark:text-slate-500',
                        )}
                      >
                        <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                        {actualVisitDate
                          ? format(new Date(`${actualVisitDate}T00:00:00`), 'MMMM d, yyyy')
                          : 'Pick a date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={actualVisitDate ? new Date(`${actualVisitDate}T00:00:00`) : undefined}
                        onSelect={(day) => {
                          if (day) {
                            setActualVisitDate(format(day, 'yyyy-MM-dd'));
                            setVisitDateOpen(false);
                          }
                        }}
                        disabled={isVisitDateDisabled}
                        className="rounded-xl border border-[#c8c8cd]/50 dark:border-white/10 dark:bg-white/[0.02]"
                      />
                    </PopoverContent>
                  </Popover>
                  {actualVisitDate && (
                    <p className="text-center text-xs text-[#6e6e73] dark:text-slate-400">
                      Selected: <span className="font-medium text-[#1d1d1f] dark:text-slate-100">{format(new Date(`${actualVisitDate}T00:00:00`), 'MMMM d, yyyy')}</span>
                    </p>
                  )}
                </div>

                {/* ── Actual Visit Time (Slot-Style Buttons) ── */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Visit Time Slot
                  </Label>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {SLOT_CODES.map((slot) => {
                      const isBlocked = blockedSlotCodes.has(slot);
                      const isSelected = actualVisitTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => setActualVisitTime(slot)}
                          className={cn(
                            'rounded-xl border-2 p-2.5 text-center transition-all text-sm font-medium',
                            isSelected
                              ? 'border-[#86868b] bg-[#f5f5f7]/50 text-[#1d1d1f] ring-2 ring-[#d2d2d7] dark:border-[#d6b36a]/35 dark:bg-[linear-gradient(180deg,rgba(255,248,235,0.88)_0%,rgba(224,209,181,0.78)_100%)] dark:text-[#4a3617] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:ring-[#d6b36a]/12'
                              : !isBlocked
                                ? 'border-[#d2d2d7] hover:border-[#c8c8cd] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/[0.05]'
                                : 'cursor-not-allowed border-[#c8c8cd]/50 bg-[#f5f5f7] text-[#86868b] opacity-50 dark:border-white/8 dark:bg-white/[0.02] dark:text-slate-500',
                          )}
                        >
                          {formatSlotTime(slot)}
                          {isBlocked && (
                            <p className="mt-0.5 text-[10px] text-red-400">Blocked</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!actualVisitDate && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#d2d2d7]/50 bg-[#f0f0f5]/70 p-2.5 dark:border-white/10 dark:bg-white/[0.04]">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6e6e73] dark:text-slate-300" />
                      <p className="text-xs text-[#6e6e73] dark:text-slate-400">Select a date first to see available time slots</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Only show Requirements/Notes separately for Ocular visits. 
                For consultations, they are consolidated into Discussion Notes below. */}
            {visitType === 'ocular' && (
              <Card className={editSectionClassName}>
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-slate-100">
                    Customer Requirements & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                      Customer Requirements
                    </Label>
                    <Textarea
                      value={customerRequirements}
                      onChange={(e) => setCustomerRequirements(e.target.value)}
                      placeholder="What the customer needs..."
                      className="min-h-[80px] rounded-xl border-gray-200 bg-gray-50/50 focus:border-[#6e6e73] focus:ring-[#6e6e73]/20 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/30 dark:focus:border-white/30 dark:focus:ring-[#d6b36a]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                      General Notes
                    </Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional observations..."
                      className="min-h-[80px] rounded-xl border-gray-200 bg-gray-50/50 focus:border-[#6e6e73] focus:ring-[#6e6e73]/20 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/30 dark:focus:border-white/30 dark:focus:ring-[#d6b36a]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Consultation Summary (only for consultation visit type) */}
          {visitType === 'consultation' && (
            <Card className={editSectionClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <FolderOpen className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Project Discussed & Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5 mb-4">
                  <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                    Discussion Notes
                  </Label>
                  <Textarea
                    value={discussionNotes}
                    onChange={(e) => setDiscussionNotes(e.target.value)}
                    placeholder="Provide details about products discussed, project scope, design preferences, and material options..."
                    className={cn('min-h-[160px]', editInputClassName)}
                  />
                </div>

                <div className="border-t border-gray-100 pt-4 dark:border-white/10">
                  <p className="mb-3 text-[13px] font-semibold text-gray-800 dark:text-slate-200">
                    Recommended Ocular Schedule
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                        Date
                      </Label>
                      <Popover open={ocularDateOpen} onOpenChange={setOcularDateOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:border-white/30 dark:hover:bg-white/[0.08] dark:focus:ring-[#d6b36a]/20',
                              !recommendedOcularDate && 'text-gray-400 dark:text-slate-500',
                            )}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500" />
                            {recommendedOcularDate
                              ? format(new Date(`${recommendedOcularDate}T00:00:00`), 'MMMM d, yyyy')
                              : 'Pick a date'}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarUI
                            mode="single"
                            selected={recommendedOcularDate ? new Date(`${recommendedOcularDate}T00:00:00`) : undefined}
                            onSelect={(day) => {
                              if (day) {
                                setRecommendedOcularDate(format(day, 'yyyy-MM-dd'));
                                setOcularDateOpen(false);
                              }
                            }}
                            disabled={(day) => {
                              const dow = getDay(day);
                              if (dow === 0 || dow === 6) return true;
                              if (startOfDay(day) < startOfDay(addDays(new Date(), 3))) return true;
                              const dateStr = format(day, 'yyyy-MM-dd');
                              if (holidayDates.has(dateStr)) return true;
                              return false;
                            }}
                            fromMonth={addDays(new Date(), 3)}
                            className="rounded-xl"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-medium text-gray-700 dark:text-slate-300">
                        Time Slot
                      </Label>
                      <Select value={recommendedOcularSlot} onValueChange={setRecommendedOcularSlot}>
                        <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 dark:border-white/15 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:border-white/30 dark:focus:ring-[#d6b36a]/20">
                          <SelectValue placeholder="Select a slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {SLOT_CODES.map((slot) => {
                            const hour = parseInt(slot.split(':')[0] ?? '0');
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                            return (
                              <SelectItem key={slot} value={slot}>
                                {displayHour}:00 {ampm}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Projects (Newly Added based on Reqs) */}
          {report?.sampleProjects && report.sampleProjects.length > 0 && (
            <Card className={editSectionClassName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                  <Briefcase className="h-5 w-5 text-gray-500 dark:text-slate-300" />
                  Sample Projects for this Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {report.sampleProjects.map((p) => (
                    <div
                      key={p.projectId}
                      className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate dark:text-slate-100">
                          {p.title}
                        </p>
                        <p className="text-[12px] text-gray-500 dark:text-slate-400 capitalize">
                          {p.serviceType || 'Standard'} • {p.status?.replace(/_/g, ' ') || 'Draft'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full hover:bg-white dark:hover:bg-slate-800"
                        asChild
                      >
                        <Link to={p.path} target="_blank">
                          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-slate-100" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


          {/* Sections 2-4: Only for ocular visits */}
          {visitType === 'ocular' && (<>

          {/* Section 2: Measurements */}
          <Card className={editCardClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                <Ruler className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Measurements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLegacyReport ? (
                /* Legacy flat measurements for old reports */
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/35 dark:bg-amber-950/20">
                    <p className="text-xs text-amber-700 dark:text-amber-200">
                      This report uses the old measurement format. New reports use per-component line items.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Length', value: legacyLength, set: setLegacyLength },
                      { label: 'Width', value: legacyWidth, set: setLegacyWidth },
                      { label: 'Height', value: legacyHeight, set: setLegacyHeight },
                      { label: 'Thickness', value: legacyThickness, set: setLegacyThickness },
                    ].map(({ label, value, set }) => (
                      <div key={label} className="space-y-1.5">
                        <Label className="text-[13px] font-medium text-gray-700">
                          {label} (cm)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) => set(e.target.value)}
                          className={cn('h-11', editInputClassName)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-gray-700">
                      Measurement Notes
                    </Label>
                    <Textarea
                      value={legacyMeasurementNotes}
                      onChange={(e) => setLegacyMeasurementNotes(e.target.value)}
                      placeholder="Special conditions, non-standard shapes..."
                      className={cn('min-h-[60px]', editInputClassName)}
                    />
                  </div>
                </div>
              ) : (
                /* New line-item based measurements */
                <LineItemsEditor
                  items={lineItems}
                  unit={measurementUnit}
                  onItemsChange={setLineItems}
                  onUnitChange={setMeasurementUnit}
                />
              )}
            </CardContent>
          </Card>

          {/* Section 3: Site Conditions */}
          <Card className={editCardClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Site Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SiteConditionsPanel
                value={siteConditions}
                onChange={setSiteConditions}
              />
            </CardContent>
          </Card>

          {/* Section 4: Materials & Design */}
          <Card className={editCardClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                <Package className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Materials & Design
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-gray-700">
                  Materials
                </Label>
                <Input
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="e.g., Stainless 304"
                  className={cn('h-11', editInputClassName)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-gray-700">
                  Finishes
                </Label>
                <Input
                  value={finishes}
                  onChange={(e) => setFinishes(e.target.value)}
                  placeholder="e.g., Brushed, Mirror"
                  className={cn('h-11', editInputClassName)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-gray-700">
                  Preferred Design
                </Label>
                <Input
                  value={preferredDesign}
                  onChange={(e) => setPreferredDesign(e.target.value)}
                  placeholder="e.g., Modern minimalist"
                  className={cn('h-11', editInputClassName)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={editCardClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                <Paintbrush className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Initial Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">
                After capturing the site measurements and ocular findings, attach the initial design references or sketch notes that engineering should review next.
              </p>
              <FileUpload
                folder="visit-reports/initial-design"
                accept="image/*,.pdf"
                maxSizeMB={5}
                maxFiles={10}
                label="Upload initial design files"
                existingKeys={initialDesignKeys}
                onUploadComplete={setInitialDesignKeys}
                onUploadingChange={setInitialDesignUploading}
              />
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium text-gray-700">
                  Initial Design Notes
                </Label>
                <Textarea
                  value={initialDesignNotes}
                  onChange={(e) => setInitialDesignNotes(e.target.value)}
                  placeholder="Explain the design direction, references, or assumptions based on the actual ocular findings."
                  className={cn('min-h-[80px]', editInputClassName)}
                />
              </div>
            </CardContent>
          </Card>

          </>)}{/* end ocular-only sections */}

          {/* Section 5: File Uploads — ocular only */}
          {visitType === 'ocular' && (
          <Card className={editCardClassName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-slate-100">
                <Camera className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                Photos & Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUploadGrid
                photoKeys={photoKeys}
                videoKeys={videoKeys}
                sketchKeys={sketchKeys}
                referenceImageKeys={referenceImageKeys}
                onPhotoKeysChange={setPhotoKeys}
                onVideoKeysChange={setVideoKeys}
                onSketchKeysChange={setSketchKeys}
                onReferenceImageKeysChange={setReferenceImageKeys}
              />
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || initialDesignUploading}
              className="rounded-xl [background-image:none] bg-gray-900 text-white hover:bg-gray-800 dark:border dark:border-white/12 dark:[background-image:none] dark:bg-[#223246] dark:text-slate-100 dark:hover:bg-[#2a3c52]"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={() => setSubmitOpen(true)}
              disabled={submitMutation.isPending || initialDesignUploading || !!isSubmissionBlocked}
              className="rounded-xl [background-image:none] bg-emerald-600 text-white hover:bg-emerald-700 dark:border dark:border-emerald-700/45 dark:[background-image:none] dark:bg-[#1f7a5b] dark:text-white dark:shadow-[0_12px_24px_rgba(16,97,71,0.24)] dark:hover:bg-[#248667]"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit Visit Report
            </Button>
          </>
        )}

        {visitType === 'consultation' && !linkedProjectId && (
          <Button
            onClick={() => setSubmitOpen(true)}
            disabled={submitMutation.isPending}
            className="rounded-xl [background-image:none] bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Add Specification
          </Button>
        )}

        <Button
          onClick={() => window.open('https://rmvstainless.com/brochure', '_blank')}
          variant="outline"
          className="rounded-xl border-[#c8c8cd] text-[#1d1d1f] hover:bg-[#f0f0f5] dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Brochure
        </Button>

        {canReturn && (
          <Button
            onClick={() => setReturnOpen(true)}
            disabled={returnMutation.isPending}
            variant="outline"
            className="border-[#c8c8cd] text-[#1d1d1f] hover:bg-[#f0f0f5] rounded-xl dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Return for Revision
          </Button>
        )}

        {canReopenForRepair && (
          <Button
            onClick={() => {
              setRepairReason('Reopened for repair because required ocular measurements were missing from the submitted report.');
              setReopenOpen(true);
            }}
            disabled={reopenMutation.isPending}
            variant="outline"
            className="border-amber-300 text-amber-900 hover:bg-amber-50 rounded-xl"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Reopen for Repair
          </Button>
        )}

        {linkedProjectId && (
          <Button
            onClick={() => navigate(`/projects/${linkedProjectId}`)}
            variant="prominent"
            className="rounded-xl"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            {isConsultationDraftProject ? 'Go to Draft Project' : 'Go to Project'}
          </Button>
        )}

        {isConsultationDraftProject && (isSalesStaff || isAdmin) && (
          <Button
            onClick={() => navigate(`/appointments/${rawId(report.appointmentId)}`)}
            variant="outline"
            className="rounded-xl border-[#c8c8cd] text-[#1d1d1f] hover:bg-[#f0f0f5] dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Go to Appointment
          </Button>
        )}
      </div>

      {/* ── Submit Confirmation ── */}
      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit Visit Report"
        description={
          report?.visitType === 'ocular'
            ? 'This will update the existing project with the on-site measurements and details collected during the ocular visit. The initial design package will also be submitted to engineering for approval, and the appointment will be marked as completed. Are you sure?'
            : 'This will create a draft project from the consultation and hand the workflow to ocular scheduling. Engineering starts only after the ocular visit is completed. Are you sure?'
        }
        confirmLabel="Submit"
        confirmClassName="rounded-xl [background-image:none] bg-emerald-600 text-white hover:bg-emerald-700 dark:border dark:border-emerald-700/45 dark:[background-image:none] dark:bg-[#1f7a5b] dark:text-white dark:shadow-[0_12px_24px_rgba(16,97,71,0.24)] dark:hover:bg-[#248667]"
        isLoading={submitMutation.isPending}
        onConfirm={handleSubmit}
      />

      {/* ── Return Dialog ── */}
      <ConfirmDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title="Return Visit Report"
        description=""
        variant="destructive"
        confirmLabel="Return Report"
        isLoading={returnMutation.isPending}
        onConfirm={handleReturn}
      >
        <div className="space-y-2.5">
          <Label className="text-[13px] font-semibold tracking-[0.01em] text-[color:var(--text-metal-color)] dark:text-slate-200">
            Reason for returning
          </Label>
          <Textarea
            value={returnReason}
            onChange={(e) => setReturnReason(e.target.value)}
            placeholder="Explain what needs to be corrected..."
            className="min-h-[108px] rounded-[1.35rem] border-[color:var(--metal-input-border)] bg-[var(--metal-input-background)] px-4 py-3 text-[15px] text-[#182029] shadow-[var(--metal-input-shadow)] placeholder:text-[color:var(--text-metal-muted-color)] focus-visible:ring-[color:var(--color-ring)] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={reopenOpen}
        onOpenChange={setReopenOpen}
        title="Reopen Ocular Report for Repair"
        description="This will move the report back to Returned so sales staff can correct the site data and resubmit it. The linked project stays visible, but engineers should wait for the repaired report."
        confirmLabel="Reopen Report"
        isLoading={reopenMutation.isPending}
        onConfirm={handleReopenForRepair}
      >
        <div className="space-y-2.5">
          <Label className="text-[13px] font-semibold tracking-[0.01em] text-[color:var(--text-metal-color)] dark:text-slate-200">
            Repair reason
          </Label>
          <Textarea
            value={repairReason}
            onChange={(e) => setRepairReason(e.target.value)}
            placeholder="Explain what needs to be fixed before engineering relies on this report..."
            className="min-h-[108px] rounded-[1.35rem] border-[color:var(--metal-input-border)] bg-[var(--metal-input-background)] px-4 py-3 text-[15px] text-[#182029] shadow-[var(--metal-input-shadow)] placeholder:text-[color:var(--text-metal-muted-color)] focus-visible:ring-[color:var(--color-ring)] dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
