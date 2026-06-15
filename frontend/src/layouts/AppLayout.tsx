import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Tags,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import type { Role } from '../features/auth/types';
import { useAuth } from '../features/auth/useAuth';
import { getDashboardSummary } from '../features/dashboard/api';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../features/notifications/api';
import type { AppNotification } from '../features/notifications/types';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE'] },
  { to: '/users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
  { to: '/departments', label: 'Departments', icon: Building2, roles: ['ADMIN'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: History, roles: ['ADMIN'] },
  { to: '/claims', label: 'My Claims', icon: ReceiptText, roles: ['EMPLOYEE'] },
  { to: '/approvals', label: 'Approval Queue', icon: ClipboardCheck, roles: ['MANAGER'] },
  { to: '/finance-review', label: 'Finance Review', icon: FileText, roles: ['FINANCE'] },
  { to: '/categories', label: 'Categories', icon: Tags, roles: ['FINANCE'] },
] satisfies Array<{
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}>;

const roleLabels: Record<Role, string> = {
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  FINANCE: 'Finance',
};

export function AppLayout() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const visibleNavItems = navItems.filter((item) => user && item.roles.includes(user.role));
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: 30000,
  });
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30000,
  });
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    refetchInterval: 30000,
  });
  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  async function handleLogout() {
    await logoutUser();
    navigate('/login', { replace: true });
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (!notification.read) {
      await readMutation.mutateAsync(notification.id);
    }
    navigate(notification.link);
  }

  const unreadCount = unreadQuery.data?.count ?? 0;
  const summary = dashboardQuery.data;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-border bg-sidebar px-3 py-5 md:block">
        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accentSoft text-accent">
            <ReceiptText size={17} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mutedText">ClaimDesk</p>
            <h1 className="text-sm font-bold text-ink">Expense Approval</h1>
          </div>
        </div>
        <nav className="space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-mutedText transition hover:bg-white/70 hover:text-ink',
                  isActive && 'bg-accentSoft text-accent shadow-sm',
                )
              }
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {navBadgeCount(item.to, user.role, summary) > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                  {navBadgeCount(item.to, user.role, summary)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-10 border-b border-border/70 bg-muted/95 px-4 py-4 backdrop-blur md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedText">{roleLabels[user.role]}</p>
              <h2 className="text-lg font-bold text-ink">{user.name}</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="group relative">
                <Button type="button" variant="secondary" className="relative px-3" aria-label="Notifications">
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                <div className="invisible absolute right-0 top-11 z-20 w-80 rounded-lg border border-border bg-surface shadow-dropdown opacity-0 transition group-hover:visible group-hover:opacity-100">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => readAllMutation.mutate()}
                      disabled={unreadCount === 0 || readAllMutation.isPending}
                    >
                      Mark all read
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {(notificationsQuery.data?.items ?? []).map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={cn(
                          'block w-full border-b border-border px-4 py-3 text-left transition hover:bg-muted',
                          !notification.read && 'bg-accentSoft/70',
                        )}
                        onClick={() => void handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-ink">{notification.title}</p>
                          {!notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-accent" />}
                        </div>
                        <p className="mt-1 text-sm leading-5 text-mutedText">{notification.message}</p>
                        <p className="mt-2 text-xs text-mutedText/70">{notification.createdAt}</p>
                      </button>
                    ))}
                    {!notificationsQuery.isLoading && (notificationsQuery.data?.items ?? []).length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-mutedText">No notifications.</div>
                    )}
                  </div>
                </div>
              </div>
              <span className="hidden rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-mutedText sm:inline-flex">
                {user.email}
              </span>
              <Button type="button" variant="secondary" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <main className="px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function navBadgeCount(to: string, role: Role, summary: Awaited<ReturnType<typeof getDashboardSummary>> | undefined) {
  if (!summary) {
    return 0;
  }

  if (role === 'MANAGER' && to === '/approvals') {
    return summary.pendingApprovals ?? 0;
  }

  if (role === 'FINANCE' && to === '/finance-review') {
    return summary.pendingFinanceReview ?? 0;
  }

  return 0;
}
