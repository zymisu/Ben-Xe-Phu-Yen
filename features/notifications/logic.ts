"use client";

/** Thông báo của người dùng đang đăng nhập (mọi vai trò) */
import { useMemo, useState } from "react";
import { matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Data } from "@/types";

export type NotificationFilter = "all" | "unread" | "read";

export function markNotificationRead(data: Data, id: string): Data {
  return {
    ...data,
    notifications: data.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    ),
  };
}

export function useNotifications() {
  const { data, user, update } = useStore();

  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const mine = useMemo(
    () => data.notifications.filter((n) => n.accountId === user?.id),
    [data.notifications, user?.id],
  );

  const list = useMemo(
    () =>
      mine
        .filter((n) =>
          filter === "all" ? true : filter === "unread" ? !n.read : n.read,
        )
        .filter((n) =>
          query.trim() ? matches(`${n.title} ${n.text}`, query) : true,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [mine, filter, query],
  );

  const counts = useMemo<Record<NotificationFilter, number>>(
    () => ({
      all: mine.length,
      unread: mine.filter((n) => !n.read).length,
      read: mine.filter((n) => n.read).length,
    }),
    [mine],
  );

  function open(id: string) {
    setOpenId(id);
    update((d) => markNotificationRead(d, id));
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    current: mine.find((n) => n.id === openId) ?? null,
    open,
    close: () => setOpenId(null),
  };
}
