/**
 * Bảng biểu tượng dùng chung và logo bến xe.
 */
import {
  AlertTriangle,
  BarChart3,
  Bus,
  CircleDot,
  CheckCheck,
  ChevronRight,
  Clock,
  Download,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Info,
  LayoutGrid,
  ListChecks,
  Lock,
  LogIn,
  Mail,
  Map,
  MapPin,
  Menu,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Trash2,
  User,
  Users,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Ánh xạ tên nghiệp vụ sang biểu tượng lucide; đổi bộ biểu tượng chỉ cần sửa bảng này. */
const MAP: Record<string, LucideIcon> = {
  // điều hướng & khung
  grid: LayoutGrid,
  menu: Menu,
  close: X,
  alert: AlertTriangle,
  info: Info,
  eye: Eye,
  eyeOff: EyeOff,
  chevronRight: ChevronRight,
  logIn: LogIn,
  sun: Sun,
  moon: Moon,

  // nghiệp vụ bến xe
  bus: Bus,
  map: Map,
  pin: MapPin,
  clock: Clock,

  // hồ sơ & xử lý
  file: FileText,
  checklist: ListChecks,
  check: CheckCheck,
  plus: Plus,
  trash: Trash2,
  search: Search,
  filter: Filter,

  // tài khoản & quản trị
  user: User,
  users: Users,
  lock: Lock,
  chart: BarChart3,
  refresh: RefreshCw,

  // liên hệ & tệp
  phone: Phone,
  mail: Mail,
  download: Download,
};

export function Icon({
  name,
  className = "size-4",
  ...p
}: { name: string; className?: string } & Omit<LucideProps, "ref">) {
  const C = MAP[name] ?? CircleDot;
  return (
    <C
      className={className}
      strokeWidth={2}
      absoluteStrokeWidth
      {...p}
      aria-hidden="true"
    />
  );
}

/** Logo bến xe: mái vòm trên khối bo tròn. */
export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--brand)" />
      <path
        d="M8.5 26.5V17.2L20 10.5l11.5 6.7v9.3"
        stroke="var(--brand-ink)"
        strokeWidth="2.6"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M6.5 26.8h27"
        stroke="var(--brand-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect
        x="14.2"
        y="19.6"
        width="11.6"
        height="7.2"
        rx="2.2"
        fill="var(--brand-ink)"
      />
      <circle cx="17.2" cy="29.3" r="1.6" fill="var(--brand-ink)" />
      <circle cx="22.8" cy="29.3" r="1.6" fill="var(--brand-ink)" />
    </svg>
  );
}
