import { useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import NotificationPanel from "../components/NotificationPanel";
import Sidebar from "../components/Sidebar";
import { useAsyncData } from "../hooks/useAsyncData";
import { notifications as fallbackNotifications } from "../lib/mockData";
import { listNotifications, markNotificationRead } from "../services/notifications";

function AppLayout({ children }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsState = useAsyncData(listNotifications, [], []);
  const notifications = notificationsState.data?.length
    ? notificationsState.data.map((item) => ({
        id: item.id,
        title: item.title,
        message: item.message,
        isRead: item.is_read,
      }))
    : notificationsState.isLoading
      ? fallbackNotifications
      : [];
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  async function handleMarkRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      notificationsState.setData((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, is_read: true } : item,
        ),
      );
    } catch (error) {
      notificationsState.reload();
    }
  }

  return (
    <div className="min-h-screen bg-hero-grid">
      <main className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="relative">
            <Navbar
              unreadCount={unreadCount}
              isNotificationsOpen={isNotificationsOpen}
              onToggleNotifications={() => setIsNotificationsOpen((current) => !current)}
            />
            {isNotificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+1rem)] z-20 w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-panel backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Inbox
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-extrabold text-slate-900">
                      Recent notifications
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
                {notificationsState.error ? (
                  <p className="mb-4 text-sm text-rose-600">{notificationsState.error}</p>
                ) : null}
                <NotificationPanel items={notifications.slice(0, 6)} onMarkRead={handleMarkRead} />
              </div>
            ) : null}
          </div>

          <div className="min-w-0 rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-panel backdrop-blur">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
