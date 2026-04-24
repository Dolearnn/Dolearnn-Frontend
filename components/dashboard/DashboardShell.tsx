'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  BookOpen,
  Calendar,
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  CreditCard,
  FileSearch,
  Inbox,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Settings,
  Users,
  Wallet,
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
};

const familyNav: NavItem[] = [
  { label: 'Home', href: '/family', icon: Home },
  { label: 'My Children', href: '/family/children', icon: Users },
  { label: 'Sessions', href: '/family/sessions', icon: Calendar },
  { label: 'Learning', href: '/family/learning', icon: BookOpen },
  { label: 'Payments', href: '/family/payments', icon: CreditCard },
  { label: 'Reports', href: '/family/reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Notifications', href: '/family/notifications', icon: Bell },
];

const teacherNav: NavItem[] = [
  { label: 'Home', href: '/teacher', icon: Home },
  { label: 'Schedule', href: '/teacher/schedule', icon: Calendar },
  { label: 'Students', href: '/teacher/students', icon: Users },
  { label: 'Session Notes', href: '/teacher/notes', icon: ClipboardList },
  { label: 'Notifications', href: '/teacher/notifications', icon: Bell },
  { label: 'Earnings', href: '/teacher/earnings', icon: Wallet },
  { label: 'Reports', href: '/teacher/reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Profile', href: '/teacher/profile', icon: Settings },
];

const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: Home },
  { label: 'Intakes', href: '/admin/intakes', icon: ClipboardList },
  { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
  { label: 'Sessions', href: '/admin/sessions', icon: Calendar },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Leads', href: '/admin/leads', icon: Inbox },
  { label: 'Reports', href: '/admin/reports', icon: ChartNoAxesColumnIncreasing },
  { label: 'Audit', href: '/admin/audit', icon: FileSearch },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
];

type Role = 'family' | 'teacher' | 'admin';

function roleFromPath(path: string): Role {
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/admin')) return 'admin';
  return 'family';
}

function navForRole(role: Role): NavItem[] {
  switch (role) {
    case 'teacher':
      return teacherNav;
    case 'admin':
      return adminNav;
    default:
      return familyNav;
  }
}

function roleForAuthUser(user: AuthUser | null): Role | null {
  if (!user) return null;
  if (user.role === 'ADMIN') return 'admin';
  if (user.role === 'TEACHER') return 'teacher';
  return 'family';
}

const roleLabel: Record<Role, string> = {
  family: 'Family',
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

  const notificationsQuery = useQuery({
    queryKey: notificationKeys.all,
    queryFn: listNotifications,
    enabled: authChecked && !!authUser && !isWrongWorkspace,
    refetchInterval: 30000,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-brand text-white dark:bg-[hsl(215,40%,6%)] dark:border-r dark:border-white/5">
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
          <div className="lg:hidden fixed inset-0 z-40 flex">
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
        <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-border px-4 lg:px-8 py-3 flex items-center justify-between backdrop-blur-md bg-white/80 dark:bg-card/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-accent2-400 transition"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm text-gray-500 dark:text-muted-foreground">
              {roleLabel[role]} Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu user={authUser} onLogout={handleLogout} />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContents({
  nav,
  role,
  pathname,
  unreadNotificationCount,
}: {
  nav: NavItem[];
  role: Role;
  pathname: string;
  unreadNotificationCount: number;
}) {
  return (
    <>
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="text-xl font-bold">
          DoLearn
        </Link>
        <p className="text-xs text-white/60 mt-1 capitalize">{role} workspace</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));
          const hasUnreadNotifications =
            item.label === 'Notifications' && unreadNotificationCount > 0;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
            >
              <Link
                href={item.href}
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
            </motion.div>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-white/50">
        DoLearn MVP · v0.1
      </div>
    </>
  );
}

function UserMenu({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void | Promise<void>;
}) {
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
