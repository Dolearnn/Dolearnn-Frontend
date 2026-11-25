'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Bell,
  BookOpen,
  Calendar,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  CreditCard,
  Crown,
  FileSearch,
  Inbox,
  GraduationCap,
  Home,
  ListChecks,
  LogOut,
  Moon,
  Settings,
  Sun,
  Swords,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { FullScreenLoader } from '@/components/ui/loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboardPathForRole, logout } from '@/lib/api/auth';
import { getAuthUser, type AuthUser } from '@/lib/api/auth-storage';
import {
  listNotifications,
  notificationKeys,
} from '@/lib/api/notifications';
import { Logo } from '@/components/brand/Logo';
import { claimGuestDaily } from '@/lib/api/daily';
import { trackPageView } from '@/lib/api/activity';
import TutorTabs, { TUTOR_TABS } from '@/components/dashboard/TutorTabs';
import BottomNav from '@/components/dashboard/BottomNav';
import PlanPill from '@/components/billing/PlanPill';

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  // Starts a labelled group in the sidebar.
  section?: string;
  // Other pages that belong to this item, so it stays highlighted on them.
  also?: string[];
  // A shorter name for the phone tab bar.
  short?: string;
  // Kept out of the phone tab bar (reached another way there).
  noTab?: boolean;
};

// One account type for learners: practice, Arena, tutoring and payments together.
const studentNav: NavItem[] = [
  { label: 'Today', href: '/student', icon: Home },
  { label: 'Practice', href: '/student/practice', icon: ListChecks },
  { label: 'Arena', href: '/student/arena', icon: Swords },
  { label: 'Progress', href: '/student/progress', icon: TrendingUp },
  { label: 'Tutor', href: '/student/tutor', icon: GraduationCap, also: TUTOR_TABS.map((tab) => tab.href) },
  { label: 'Notifications', href: '/student/notifications', icon: Bell },
  // On phones the header's "Go Pro" button opens it.
  { label: 'Plan', href: '/student/plan', icon: Crown, noTab: true },
];

const teacherNav: NavItem[] = [
  { label: 'Home', href: '/teacher', icon: Home },
  { label: 'Schedule', href: '/teacher/schedule', icon: Calendar },
  { label: 'Students', href: '/teacher/students', icon: Users },
  { label: 'Session Notes', href: '/teacher/notes', icon: ClipboardList, short: 'Notes' },
  { label: 'Notifications', href: '/teacher/notifications', icon: Bell },
  { label: 'Earnings', href: '/teacher/earnings', icon: Wallet },
  { label: 'Reports', href: '/teacher/reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Profile', href: '/teacher/profile', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: Home },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Tutor requests', href: '/admin/intakes', icon: ClipboardList, section: 'Tutoring', short: 'Requests' },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Question bank', href: '/admin/questions', icon: BookOpen, section: 'Content and growth' },
  { label: 'Daily quiz', href: '/admin/daily', icon: Zap },
  { label: 'Leads', href: '/admin/leads', icon: Inbox },
  { label: 'Reports', href: '/admin/reports', icon: ChartNoAxesColumnIncreasing, section: 'Insights' },
  { label: 'Impact', href: '/admin/impact', icon: Target },
  { label: 'Activity log', href: '/admin/audit', icon: FileSearch },
];

type Role = 'student' | 'teacher' | 'admin';

function roleFromPath(path: string): Role {
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/admin')) return 'admin';
  return 'student';
}

function navForRole(role: Role): NavItem[] {
  switch (role) {
    case 'teacher':
      return teacherNav;
    case 'admin':
      return adminNav;
    default:
      return studentNav;
  }
}

function roleForAuthUser(user: AuthUser | null): Role | null {
  if (!user) return null;
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'TEACHER') return 'teacher';
  // Learners, and older parent accounts, share the learner workspace.
  return 'student';
}

/** The sidebar label of the page at `path`, e.g. "Practice", for the activity log. */
function pageTitle(nav: NavItem[], path: string) {
  let best: NavItem | undefined;
  for (const item of nav) {
    const hrefs = [item.href, ...(item.also ?? [])];
    for (const href of hrefs) {
      if ((path === href || path.startsWith(`${href}/`)) && href.length >= (best?.href.length ?? 0)) {
        best = { ...item, href };
      }
    }
  }
  return best?.label;
}

function isActiveItem(item: NavItem, pathname: string, role: Role) {
  return (
    pathname === item.href ||
    (item.href !== `/${role}` && pathname.startsWith(item.href)) ||
    Boolean(item.also?.some((path) => pathname.startsWith(path)))
  );
}

const roleLabel: Record<Role, string> = {
  student: 'Learner',
  teacher: 'Teacher',
  admin: 'Admin',
};

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const routeRole = roleFromPath(pathname);
  const allowedRole = roleForAuthUser(authUser);
  const role = allowedRole ?? routeRole;
  const nav = navForRole(role);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    setAuthUser(user);
    setAuthChecked(true);
  }, []);

  // A score from playing the Daily before signing up moves onto the account.
  useEffect(() => {
    if (authUser && role === 'student') void claimGuestDaily();
  }, [authUser, role]);

  useEffect(() => {
    if (!authChecked) return;

    if (!authUser) {
      router.replace('/login');
      return;
    }

    if (authUser.mustChangePassword) {
      router.replace('/change-password');
      return;
    }

    const expectedPath = dashboardPathForRole(authUser.role);
    if (!pathname.startsWith(expectedPath)) {
      router.replace(expectedPath);
    }
  }, [authChecked, authUser, pathname, router]);

  const isWrongWorkspace = useMemo(() => {
    if (!authChecked || !allowedRole) return false;
    return routeRole !== allowedRole;
  }, [allowedRole, authChecked, routeRole]);

  // Every page a signed-in user opens shows up in the admin activity log.
  useEffect(() => {
    if (!authChecked || !authUser || isWrongWorkspace) return;
    trackPageView(pathname, pageTitle(nav, pathname));
    // nav follows the role, which is settled once auth is checked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, authUser, isWrongWorkspace, pathname]);

  const notificationsQuery = useQuery({
    queryKey: notificationKeys.all,
    queryFn: listNotifications,
    enabled: authChecked && !!authUser && !isWrongWorkspace,
    // Avoid a permanent 30-second polling storm as the user base grows.
    // The notifications page still invalidates this query after user actions.
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });

  const unreadNotificationCount = useMemo(
    () =>
      (notificationsQuery.data ?? []).filter(
        (notification) => !notification.read,
      ).length,
    [notificationsQuery.data],
  );

  const handleLogout = async () => {
    await logout();
    setAuthUser(null);
    router.replace('/login');
  };

  if (!authChecked || !authUser || isWrongWorkspace) {
    return <FullScreenLoader label="Loading your dashboard" />;
  }

  // Every role gets a bottom tab bar on phones; notifications move to the
  // header bell. Teachers and admins have more pages than fit, so the rest sit
  // behind "More", which opens the full menu.
  const tabSource = nav.filter((item) => item.label !== 'Notifications' && !item.noTab);
  const tabPicks: Record<Role, NavItem[]> = {
    student: tabSource,
    teacher: tabSource.slice(0, 4),
    // The admin pages used most day to day.
    admin: ['/admin', '/admin/intakes', '/admin/sessions', '/admin/payments']
      .map((href) => tabSource.find((item) => item.href === href))
      .filter((item): item is NavItem => Boolean(item)),
  };
  const hasMore = role !== 'student';
  const tabItems = tabPicks[role].map((item) => ({
    label: item.short ?? item.label,
    href: item.href,
    icon: item.icon,
    active: isActiveItem(item, pathname, role),
  }));
  const moreActive = hasMore && !tabItems.some((item) => item.active);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex">
      {/* Sidebar — desktop */}
      {/* Stays in place while the page scrolls; its own menu scrolls if it is taller than the screen. */}
      <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto w-64 shrink-0 bg-brand text-white dark:bg-[hsl(215,40%,6%)] dark:border-r dark:border-white/5">
        <SidebarContents
          nav={nav}
          role={role}
          pathname={pathname}
          unreadNotificationCount={unreadNotificationCount}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-64 bg-brand text-white dark:bg-[hsl(215,40%,6%)] flex flex-col"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContents
                onNavigate={() => setMobileOpen(false)}
                nav={nav}
                role={role}
                pathname={pathname}
                unreadNotificationCount={unreadNotificationCount}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-border px-4 lg:px-8 h-14 flex items-center justify-between backdrop-blur-md bg-white/85 dark:bg-card/85">
          <div className="flex items-center gap-3">
            <Link href={`/${role}`} aria-label="DoLearnn home" className="lg:hidden">
              <Logo size="sm" />
            </Link>
            <span className="hidden text-sm text-gray-500 dark:text-muted-foreground lg:inline">
              {roleLabel[role]} Dashboard
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {role === 'student' && <PlanPill />}
            <Link
              href={`/${role}/notifications`}
              aria-label={
                unreadNotificationCount > 0
                  ? `Notifications, ${unreadNotificationCount} unread`
                  : 'Notifications'
              }
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 dark:text-white/80 dark:hover:bg-white/10 lg:hidden"
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-card" />
              )}
            </Link>
            {/* On phones the learner header also holds "Go Pro", so the theme
                switch moves into the account menu there. */}
            <ThemeToggle className={role === 'student' ? 'max-sm:hidden' : undefined} />
            <UserMenu user={authUser} onLogout={handleLogout} themeInMenu={role === 'student'} />
          </div>
        </header>
        <main
          className={cn(
            // clip, not hidden: hidden would turn main into a scroll box and break sticky bars.
            'flex-1 p-4 lg:p-8 overflow-x-clip',
            // Room for the bottom tab bar and the phone's home indicator.
            'pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8',
          )}
        >
          <TutorTabs />
          {children}
        </main>
        <BottomNav
          items={tabItems}
          onMore={hasMore ? () => setMobileOpen(true) : undefined}
          moreActive={moreActive}
        />
      </div>
    </div>
  );
}

function SidebarContents({
  nav,
  role,
  pathname,
  unreadNotificationCount,
  onNavigate,
}: {
  nav: NavItem[];
  role: Role;
  pathname: string;
  unreadNotificationCount: number;
  // On phones, closes the menu after a link is tapped.
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" aria-label="DoLearnn home" className="inline-block" onClick={onNavigate}>
          <Logo tone="light" size="sm" />
        </Link>
        <p className="text-xs text-white/60 mt-1 capitalize">{role} workspace</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => {
          const active = isActiveItem(item, pathname, role);
          const hasUnreadNotifications =
            item.label === 'Notifications' && unreadNotificationCount > 0;
          const Icon = item.icon;
          return (
            <div key={item.href}>
              {item.section && (
                <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                  {item.section}
                </p>
              )}
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute inset-0 rounded-lg bg-white/15"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{item.label}</span>
                  {hasUnreadNotifications && (
                    <span
                      className="h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/20"
                      aria-label={`${unreadNotificationCount} unread notifications`}
                    />
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>
    </>
  );
}

function UserMenu({
  user,
  onLogout,
  themeInMenu = false,
}: {
  user: AuthUser;
  onLogout: () => void | Promise<void>;
  // Adds a light/dark switch to the menu on phones.
  themeInMenu?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 dark:hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label="Open account menu"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={undefined} alt={user.name} />
          <AvatarFallback className="bg-brand text-white text-xs font-semibold">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:block text-sm font-medium text-gray-800 dark:text-foreground max-w-[120px] truncate">
          {user.name.split(' ')[0]}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
            {user.name}
          </span>
          <span className="text-xs font-normal text-gray-500 dark:text-muted-foreground truncate">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeInMenu && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTheme(isDark ? 'light' : 'dark');
            }}
            className="cursor-pointer sm:hidden"
          >
            {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            void onLogout();
          }}
          className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
