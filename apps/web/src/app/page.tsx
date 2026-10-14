"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  ListChecks,
  MessageSquare,
  MessageSquareReply,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@task/core/features/auth/store/useAuthStore";
import { UserRole, canManageUsers, canViewDashboards } from "@task/core/features/auth/types";
import { useUnreadReplies } from "@task/core/features/comments/hooks/useUnreadReplies";
import { badgeLabel } from "@task/core/features/comments/unread";
import { SpaceList } from "@/features/spaces/components/SpaceList";
import { useI18n } from "@/contexts/I18nContext";

interface HomeLink {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: number;
}

// Home: the first page after login. It offers everything the sidebar does
// (the same destinations, as cards) followed by the user's spaces.
export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role ?? UserRole.Member);
  const unreadReplies = useUnreadReplies();

  const links: HomeLink[] = [
    { href: "/replies", icon: MessageSquareReply, title: t.replies, description: t.homeRepliesDesc, badge: unreadReplies },
    { href: "/assigned-comments", icon: MessageSquare, title: t.assignedComments, description: t.homeAssignedCommentsDesc },
    { href: "/my-tasks/assigned", icon: ListChecks, title: t.assignedToMe, description: t.homeAssignedToMeDesc },
    { href: "/my-tasks/today", icon: CalendarClock, title: t.todayOverdue, description: t.homeTodayDesc },
    { href: "/my-tasks/personal", icon: UserCircle, title: t.personalList, description: t.homePersonalDesc },
  ];
  if (canViewDashboards(role)) {
    links.push({ href: "/dashboards", icon: BarChart3, title: t.dashboards, description: t.homeDashboardDesc });
  }
  if (canManageUsers(role)) {
    links.push({ href: "/users", icon: Users, title: t.manageUsers, description: t.homeUsersDesc });
  }

  return (
    <main className="main-layout">
      <section>
        <header className="app-header">
          <h2 className="home-section-title">{t.homeQuickAccess}</h2>
        </header>
        <div className="space-grid home-grid">
          {links.map(({ href, icon: Icon, title, description, badge }) => (
            <button key={href} className="space-card home-card" onClick={() => router.push(href)}>
              <div className="space-card-icon home-card-icon">
                <Icon size={20} />
              </div>
              <div className="space-card-body">
                <h3 className="space-card-title">{title}</h3>
                <p className="space-card-desc">{description}</p>
              </div>
              {badge !== undefined && badge > 0 && (
                <span className="nav-badge" aria-label={t.unreadRepliesCount.replace("{count}", String(badge))}>
                  {badgeLabel(badge)}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="home-section">
        <header className="app-header">
          <h2 className="home-section-title">{t.yourSpaces}</h2>
        </header>
        <div className="dashboard-content">
          <SpaceList />
        </div>
      </section>
    </main>
  );
}
