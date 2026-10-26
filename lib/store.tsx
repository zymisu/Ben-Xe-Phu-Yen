"use client";

/**
 * Kho dữ liệu dùng chung: trạng thái, phiên đăng nhập, thông báo nổi, lưu vào localStorage.
 * Mọi thay đổi đi qua `update`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { seedData } from "./seed";
import type { Account, Data } from "@/types";

/**
 * Đổi số phiên bản mỗi khi cấu trúc `Data` thay đổi, để dữ liệu cũ còn nằm
 * trong trình duyệt người dùng không bị nạp nhầm vào cấu trúc mới.
 */
const EMPTY_DATA: Data = {
  accounts: [],
  dossiers: [],
  routes: [],
  trips: [],
  notices: [],
  bays: [],
  bayAdjustments: [],
  entries: [],
  violations: [],
  yardLogs: [],
  reports: [],
  notifications: [],
};

const DATA_KEY = "bxpy.data.v20";
const SESSION_KEY = "bxpy.session.v20";

/** Các mảng bắt buộc phải có trong một bản ghi `Data` hợp lệ */
const DATA_FIELDS = [
  "accounts",
  "dossiers",
  "routes",
  "trips",
  "notices",
  "bays",
  "bayAdjustments",
  "entries",
  "violations",
  "yardLogs",
  "reports",
  "notifications",
] as const;

/**
 * Dữ liệu trong localStorage có thể cũ hoặc thiếu trường, nên kiểm tra hình dạng trước khi dùng;
 * không hợp lệ thì quay về dữ liệu mẫu.
 */
function parseData(raw: string): Data | null {
  try {
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (!d || typeof d !== "object") return null;
    if (!DATA_FIELDS.every((k) => Array.isArray(d[k]))) return null;
    return d as unknown as Data;
  } catch {
    return null;
  }
}

export interface Toast {
  id: number;
  kind: "ok" | "danger" | "warn" | "info";
  text: string;
}

interface Ctx {
  data: Data;
  ready: boolean;
  user: Account | null;

  /** Cửa ghi duy nhất cho logic của các chức năng */
  update: (fn: (data: Data) => Data) => void;
  setSession: (accountId: string | null) => void;
  logout: () => void;

  /** Thông tin điền sẵn cho trang đăng nhập sau khi đăng ký, chỉ giữ trong bộ nhớ */
  prefill: { phone: string; password: string } | null;
  setPrefill: (v: { phone: string; password: string } | null) => void;

  toasts: Toast[];
  toast: (kind: Toast["kind"], text: string) => void;
  closeToast: (id: number) => void;
}

const C = createContext<Ctx | null>(null);

export function useStore(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error("useStore phải nằm trong <StoreProvider>");
  return c;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Dữ liệu mẫu neo theo ngày hôm nay nên chỉ nạp sau khi gắn vào trình duyệt,
  // tránh lệch nội dung giữa máy chủ (lúc build) và trình duyệt.
  const [data, setData] = useState<Data>(EMPTY_DATA);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [prefill, setPrefill] = useState<Ctx["prefill"]>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCount = useRef(0);

  useEffect(() => {
    // Chỉ đọc sau khi gắn vào DOM: máy chủ không có localStorage, đọc trong
    // lúc render sẽ làm lệch nội dung giữa máy chủ và trình duyệt.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const raw = localStorage.getItem(DATA_KEY);
      const saved = raw ? parseData(raw) : null;
      if (saved) setData(saved);
      else {
        if (raw) localStorage.removeItem(DATA_KEY);
        setData(seedData());
      }

      const session = localStorage.getItem(SESSION_KEY);
      if (session) setSessionId(session);
    } catch {
      /* localStorage có thể bị chặn - vẫn chạy với dữ liệu mẫu trong bộ nhớ */
      setData(seedData());
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Nhiều cửa sổ cùng mở (trạm cổng, màn hình nhân viên) phải thấy dữ liệu của nhau
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEY || !e.newValue) return;
      const next = parseData(e.newValue);
      if (next) setData(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      /* bỏ qua */
    }
  }, [data, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (sessionId) localStorage.setItem(SESSION_KEY, sessionId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* bỏ qua */
    }
  }, [sessionId, ready]);

  const user = useMemo(
    () => data.accounts.find((a) => a.id === sessionId) ?? null,
    [data.accounts, sessionId],
  );

  const update = useCallback(
    (fn: (d: Data) => Data) => setData((d) => fn(d)),
    [],
  );
  const setSession = useCallback((id: string | null) => setSessionId(id), []);

  const toast = useCallback((kind: Toast["kind"], text: string) => {
    toastCount.current += 1;
    const t = { id: toastCount.current, kind, text };
    setToasts((list) => [...list, t]);
    setTimeout(
      () => setToasts((list) => list.filter((x) => x.id !== t.id)),
      6000,
    );
  }, []);

  const closeToast = useCallback(
    (id: number) => setToasts((list) => list.filter((x) => x.id !== id)),
    [],
  );

  const logout = useCallback(() => {
    setSessionId(null);
    toast("info", "Đã đăng xuất.");
  }, [toast]);

  const value = useMemo<Ctx>(
    () => ({
      data,
      ready,
      user,
      update,
      setSession,
      logout,
      prefill,
      setPrefill,
      toasts,
      toast,
      closeToast,
    }),
    [
      data,
      ready,
      user,
      update,
      setSession,
      logout,
      prefill,
      toasts,
      toast,
      closeToast,
    ],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}
