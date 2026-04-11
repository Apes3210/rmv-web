import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';

import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { useUpdateProfile } from '@/hooks/useUsers';
import { Role } from '@/lib/constants';

// ── Which notification toggles each role should see ──
const ALL_NOTIF_PREFS = [
  {
    key: 'appointment' as const,
    label: 'Appointments',
    description: 'Booking confirmations, reschedules, and cancellations',
    roles: [Role.CUSTOMER, Role.APPOINTMENT_AGENT, Role.SALES_STAFF, Role.ADMIN],
  },
  {
    key: 'payment' as const,
    label: 'Payments',
    description: 'Payment verifications, receipts, and reminders',
    roles: [Role.CUSTOMER, Role.SALES_STAFF, Role.CASHIER, Role.ADMIN],
  },
  {
    key: 'project' as const,
    label: 'Projects',
    description: 'New projects from visit reports, engineer assignments, and status updates',
    roles: [Role.CUSTOMER, Role.SALES_STAFF, Role.ENGINEER, Role.ADMIN],
  },
  {
    key: 'blueprint' as const,
    label: 'Blueprints',
    description: 'Blueprint uploads, approvals, and revision requests',
    roles: [Role.CUSTOMER, Role.ENGINEER, Role.ADMIN],
  },
  {
    key: 'fabrication' as const,
    label: 'Fabrication',
    description: 'Workshop progress updates and status changes',
    roles: [Role.CUSTOMER, Role.ENGINEER, Role.FABRICATION_STAFF, Role.ADMIN],
  },
];

const DEFAULT_NOTIFICATION_PREFERENCES = {
  appointment: true,
  payment: true,
  blueprint: true,
  fabrication: true,
  project: true,
  emailNotifications: true,
};

export function AccountNotificationsPage() {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const visiblePrefs = useMemo(
    () => ALL_NOTIF_PREFS.filter((p) => user?.roles.some((r) => p.roles.includes(r))),
    [user?.roles],
  );

  const prefs = user?.notificationPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES;

  const handleToggle = async (key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES, val: boolean) => {
    try {
      const updated = { ...prefs, [key]: val };
      await updateProfile.mutateAsync({ notificationPreferences: updated });
      // fetchMe is called by the hook automatically
      toast.success(
        key === 'emailNotifications'
          ? `Email notifications ${val ? 'enabled' : 'disabled'}`
          : `${ALL_NOTIF_PREFS.find((p) => p.key === key)?.label ?? key} notifications ${val ? 'enabled' : 'disabled'}`,
      );
    } catch {
      // Error handled by hook
    }
  };

  if (visiblePrefs.length === 0) {
    return (
      <Card className="border-[#d2d2d7]/50 dark:border-white/10 shadow-sm rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0f0f5] dark:bg-slate-800/80 mb-3">
            <Bell className="h-5 w-5 text-[#c8c8cd] dark:text-slate-400" />
          </div>
          <p className="text-sm font-medium text-[#86868b] dark:text-slate-200">No notification settings available</p>
          <p className="text-xs text-[#c8c8cd] dark:text-slate-400 mt-1">
            Your role doesn't have configurable notification preferences.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#d2d2d7]/50 dark:border-white/10 shadow-sm rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-[#1d1d1f] dark:text-slate-100 flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#6e6e73] dark:text-slate-400" />
          Notification Preferences
        </CardTitle>
        <CardDescription className="text-[#86868b] dark:text-slate-300/90">
          Choose which notifications you'd like to receive. This controls push and inbox notifications
          — your notification inbox is not affected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-[#d2d2d7]/50 bg-[#eef7ff]/70 p-4 dark:border-white/10 dark:bg-slate-800/70">
          <div>
            <p className="font-medium text-[#1d1d1f] dark:text-slate-100 text-sm">Email notifications</p>
            <p className="mt-0.5 text-xs text-[#86868b] dark:text-slate-300">
              Turn this off to stop outbound notification emails. Sign-in, verification, and password reset emails still send.
            </p>
          </div>
          <Switch
            checked={prefs.emailNotifications ?? true}
            onCheckedChange={(val) => handleToggle('emailNotifications', val)}
          />
        </div>
        {visiblePrefs.map((pref) => {
          const checked = prefs ? prefs[pref.key] : true;

          return (
            <div
              key={pref.key}
              className="flex items-center justify-between p-4 border border-[#d2d2d7]/50 dark:border-white/10 rounded-xl bg-white/60 dark:bg-slate-800/70"
            >
              <div>
                <p className="font-medium text-[#1d1d1f] dark:text-slate-100 text-sm">{pref.label}</p>
                <p className="text-xs text-[#86868b] dark:text-slate-300 mt-0.5">{pref.description}</p>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(val) => handleToggle(pref.key, val)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
