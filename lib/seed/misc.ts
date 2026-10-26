/** Dữ liệu mẫu: tuyến, ô đón khách, thông báo điều hành, điều chỉnh vị trí, biên bản, báo cáo nhà xe. */
import { formatDate } from "../format";
import type {
  Bay,
  BayAdjustment,
  Dossier,
  Notice,
  Notification,
  Report,
  Route,
  Trip,
  Violation,
} from "@/types";
import { byRole, STAFF } from "./people";
import {
  at,
  between,
  dateOf,
  dayOf,
  HOUR,
  MIN,
  pick,
  stamp,
  type Rnd,
} from "./util";

export const ROUTES: Route[] = [
  {
    id: "t1",
    code: "PY-HCM",
    from: "Tuy Hòa",
    to: "TP. Hồ Chí Minh",
    km: 560,
    minutes: 660,
    fare: 420000,
  },
  {
    id: "t2",
    code: "PY-HN",
    from: "Tuy Hòa",
    to: "Hà Nội",
    km: 1160,
    minutes: 1320,
    fare: 900000,
  },
  {
    id: "t3",
    code: "PY-DN",
    from: "Tuy Hòa",
    to: "Đà Nẵng",
    km: 420,
    minutes: 510,
    fare: 300000,
  },
  {
    id: "t4",
    code: "PY-NT",
    from: "Tuy Hòa",
    to: "Nha Trang",
    km: 125,
    minutes: 180,
    fare: 110000,
  },
  {
    id: "t5",
    code: "PY-QN",
    from: "Tuy Hòa",
    to: "Quy Nhơn",
    km: 100,
    minutes: 150,
    fare: 95000,
  },
  {
    id: "t6",
    code: "PY-BMT",
    from: "Tuy Hòa",
    to: "Buôn Ma Thuột",
    km: 190,
    minutes: 270,
    fare: 170000,
  },
  {
    id: "t7",
    code: "PY-PK",
    from: "Tuy Hòa",
    to: "Pleiku",
    km: 265,
    minutes: 360,
    fare: 220000,
  },
  {
    id: "t8",
    code: "PY-CT",
    from: "Tuy Hòa",
    to: "Cần Thơ",
    km: 730,
    minutes: 840,
    fare: 520000,
  },
];

/** Mười hai ô trong khu vực lên khách */
export const BAYS: Bay[] = Array.from({ length: 12 }, (_, i) => ({
  id: `b${i + 1}`,
  code: `Ô ${String(i + 1).padStart(2, "0")}`,
}));

// thông báo điều hành

export function notices(now: number): Notice[] {
  const d = (n: number) => formatDate(dayOf(now, n));
  return [
    {
      id: "tb1",
      date: dayOf(now, -1),
      title: `Điều chỉnh lối ra bến từ ngày ${d(-1)} đến hết ngày ${d(7)}`,
      text: `Để phục vụ thi công nâng cấp mặt sân khu C, từ 05h00 ngày ${d(-1)} đến hết ngày ${d(7)}, xe xuất bến đi theo lối phụ cạnh Cổng 2. Cổng 1 vẫn là cổng vào bến. Đề nghị các đơn vị vận tải phổ biến đến lái xe.`,
    },
    {
      id: "tb2",
      date: dayOf(now, -5),
      title:
        "Công bố bổ sung suất khai thác tuyến Tuy Hòa - Pleiku khung 20h15",
      text: `Bến xe công bố bổ sung 01 suất khai thác tuyến Tuy Hòa - Pleiku khung giờ 20h15 hằng ngày. Đơn vị vận tải có nhu cầu gửi hồ sơ đăng ký khai thác trước ngày ${d(9)}.`,
    },
    {
      id: "tb3",
      date: dayOf(now, -9),
      title: "Triển khai xác nhận xe vào, ra bến bằng thẻ NFC",
      text: "Từ nay lái xe quẹt thẻ NFC tại cổng để yêu cầu vào bến và ra bến; nhân viên điều độ ngoài trời xác nhận trên hệ thống. Xe chỉ được ra bến khi đã kiểm tra đạt và có lệnh xuất bến.",
    },
    {
      id: "tb4",
      date: dayOf(now, -14),
      title: "Thông báo giá dịch vụ xe ra vào bến năm 2026",
      text: "Giá dịch vụ xe ra vào bến áp dụng từ ngày 01/01/2026 theo quyết định của Sở Giao thông vận tải tỉnh Phú Yên. Bảng giá niêm yết công khai tại quầy điều độ và trên hệ thống.",
    },
    {
      id: "tb5",
      date: dayOf(now, -20),
      title: "Quy định thời gian kiểm tra xe trước giờ xuất bến",
      text: "Nhân viên an ninh trật tự kiểm tra an toàn xe, người lái, hành khách và hàng hóa trong vòng 30 phút trước giờ xuất bến. Xe chưa đạt không được cấp lệnh xuất bến.",
    },
  ];
}

// điều chỉnh vị trí đón khách

export function bayAdjustments(
  now: number,
  r: Rnd,
  trips: Trip[],
): BayAdjustment[] {
  const outdoor = byRole("outdoor");
  const list: BayAdjustment[] = [];
  const reasons = {
    unavailable: [
      "Xe hư chưa di dời khỏi vị trí",
      "Sửa chữa mặt sân tại vị trí",
      "Rào chắn tạm thời do vệ sinh",
    ],
    delay: [
      "Xe trước ra bến chậm, các chuyến sau lệch giờ",
      "Khách lên xe đông, kéo dài thời gian đón",
    ],
  };
  // Lịch sử những ngày trước: đã kết thúc
  for (let i = 0; i < 8; i++) {
    const day = -between(r, 1, 12);
    const from = at(
      dayOf(now, day),
      `${String(between(r, 6, 17)).padStart(2, "0")}:00`,
    );
    const kind = i % 3 === 0 ? "delay" : "unavailable";
    const until = from + between(r, 1, 3) * HOUR;
    list.push({
      id: `dc${i + 1}`,
      bayId: `b${between(r, 1, 12)}`,
      kind,
      from: stamp(from),
      until: stamp(until),
      minutes: kind === "delay" ? between(r, 5, 15) : undefined,
      reason: pick(r, reasons[kind]),
      byName: pick(r, outdoor).name,
      createdAt: stamp(from),
      endedAt: stamp(until),
    });
  }
  // Đang hiệu lực: một ô tạm ngưng, một ô lệch giờ
  list.push({
    id: "dc90",
    bayId: "b5",
    kind: "unavailable",
    from: stamp(now - 30 * MIN),
    until: stamp(now + 90 * MIN),
    reason: "Xe hư chưa di dời khỏi vị trí",
    byName: outdoor[0].name,
    createdAt: stamp(now - 30 * MIN),
  });
  list.push({
    id: "dc91",
    bayId: "b2",
    kind: "delay",
    from: stamp(now - 10 * MIN),
    until: stamp(now + 240 * MIN),
    minutes: 5,
    reason: "Xe trước ra bến chậm, các chuyến sau lệch giờ",
    byName: outdoor[1].name,
    createdAt: stamp(now - 10 * MIN),
  });
  void trips;
  return list;
}

// biên bản vi phạm

const VIOLATION_TEXT: Record<string, { where: string[]; text: string }> = {
  "Dừng xe trả khách quá lâu": {
    where: ["Cổng 1", "Khu vực chờ lên khách"],
    text: "Xe dừng trả khách quá thời gian cho phép, gây ùn tắc cho xe phía sau, đã nhắc nhở nhưng chưa di chuyển ngay.",
  },
  "Đi sai cổng": {
    where: ["Cổng 1", "Cổng 2"],
    text: "Xe đi vào hoặc ra bằng cổng không đúng quy định, đã hướng dẫn đi lại đúng cổng.",
  },
  "Đỗ sai vị trí quy định": {
    where: ["Bãi đỗ xe", "Khu vực chờ lên khách"],
    text: "Xe đỗ ngoài vị trí được phân công, lấn sang lối đi của xe khác.",
  },
  "Xe không đủ điều kiện vào bến": {
    where: ["Cổng 1"],
    text: "Xe vào bến khi chưa có chuyến được duyệt trong ngày, nhân viên yêu cầu rời bến.",
  },
};

export function violations(now: number, r: Rnd, trips: Trip[]): Violation[] {
  const security = byRole("security");
  const past = trips.filter(
    (t) =>
      t.arrival &&
      at(t.arrival.at.split("T")[0], t.arrival.at.split("T")[1]) <
        now - 3 * HOUR,
  );
  const types = Object.keys(VIOLATION_TEXT);
  const out: Violation[] = [];
  for (let i = 0; i < 14 && past.length > 0; i++) {
    const t = pick(r, past);
    const type = types[i % types.length];
    const spec = VIOLATION_TEXT[type];
    const arrival = at(
      t.arrival!.at.split("T")[0],
      t.arrival!.at.split("T")[1],
    );
    const occurred = arrival + between(r, -20, 20) * MIN;
    const created = Math.min(occurred + between(r, 10, 50) * MIN, now - MIN);
    out.push({
      id: `vp${i + 1}`,
      code: `BB-${String(i + 1).padStart(4, "0")}`,
      type,
      dossierId: t.dossierId,
      plate: t.plate,
      driverName: t.driverName,
      occurredAt: stamp(occurred),
      location: pick(r, spec.where),
      description: spec.text,
      createdBy: pick(r, security).name,
      createdAt: stamp(created),
    });
  }
  // Mã biên bản theo thứ tự thời gian lập
  return out
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((v, i) => ({ ...v, code: `BB-${String(i + 1).padStart(4, "0")}` }));
}

// báo cáo nhà xe và thông báo

const REPORT_TEXT: [string, string][] = [
  [
    "Đèn chiếu sáng khu vực chờ lên khách hỏng",
    "Đèn chiếu sáng ở dãy ô phía cuối khu vực chờ lên khách tắt từ tối qua, khách và tài xế đi lại khó khăn. Đề nghị bến xe cho kiểm tra sớm.",
  ],
  [
    "Cổng 2 kẹt xe giờ cao điểm",
    "Từ 16h đến 17h xe ra Cổng 2 xếp hàng dài do nhiều chuyến cùng xuất bến. Đề nghị bố trí thêm người điều tiết.",
  ],
  [
    "Nước sinh hoạt khu vực nhà xe bị mất",
    "Từ sáng nay khu vực nhà vệ sinh dành cho lái xe không có nước. Đề nghị bến xe kiểm tra đường ống.",
  ],
  [
    "Tường trình sự việc va chạm nhẹ tại cổng",
    "Khoảng 9h30 xe của công ty va chạm nhẹ với rào chắn khi ra Cổng 2. Không có thiệt hại về người, xe trầy xước nhỏ. Công ty xin tường trình để bến xe nắm thông tin.",
  ],
  [
    "Đề xuất bổ sung biển chỉ dẫn ô đón khách",
    "Tài xế mới thường nhầm vị trí ô đón khách. Đề nghị bổ sung biển chỉ dẫn số ô rõ hơn ở lối vào.",
  ],
  [
    "Mặt sân khu đón khách có ổ gà",
    "Sau trận mưa lớn mặt sân gần Ô 07 và Ô 08 xuất hiện ổ gà, xe ra vào dễ hỏng lốp.",
  ],
  [
    "Màn hình thông tin chuyến mất hiển thị",
    "Màn hình tại phòng chờ không hiện danh sách chuyến từ đầu giờ chiều, hành khách hỏi nhiều.",
  ],
];

export function reports(
  now: number,
  r: Rnd,
  carriers: Dossier[],
): { reports: Report[]; notifications: Notification[] } {
  const indoor = byRole("indoor");
  const reports: Report[] = [];
  const notifications: Notification[] = [];
  REPORT_TEXT.forEach(([title, body], i) => {
    const d = carriers.filter((x) => x.everApproved)[
      (i * 3) % carriers.filter((x) => x.everApproved).length
    ];
    const sentAt = now - ((i * 31 + 25) * HOUR) / 6 - between(r, 0, 90) * MIN;
    const to = indoor
      .filter((_, k) => (i + k) % 3 !== 2)
      .slice(0, i % 2 === 0 ? 2 : 3);
    const read = i >= 3;
    const rep: Report = {
      id: `bc${i + 1}`,
      dossierId: d.id,
      title,
      body,
      plate: i === 3 ? d.vehicles[0].plate : undefined,
      createdAt: stamp(sentAt),
      recipientIds: to.map((s) => s.id),
      reads: read
        ? to.slice(0, i % 2 === 0 ? 1 : 2).map((s, k) => ({
            accountId: s.id,
            name: s.name,
            at: stamp(Math.min(sentAt + (k + 1) * 40 * MIN, now - MIN)),
          }))
        : [],
    };
    reports.push(rep);
    for (const s of to) {
      notifications.push({
        id: `tb-${s.id}-bc${i + 1}`,
        accountId: s.id,
        title: `Báo cáo mới từ ${d.companyName}`,
        text: title,
        createdAt: stamp(sentAt),
        read: rep.reads.some((x) => x.accountId === s.id),
      });
    }
  });

  // Thông báo quản trị: nhân viên được cập nhật thông tin tài khoản
  const admin = STAFF.find((s) => s.role === "admin")!;
  notifications.push(
    {
      id: "tb-u2-1",
      accountId: "u2",
      title: "Thông tin tài khoản đã được cập nhật",
      text: `Quản trị viên ${admin.name} đã cập nhật: địa chỉ liên hệ.`,
      createdAt: stamp(now - 26 * HOUR),
      read: true,
    },
    {
      id: "tb-u2-2",
      accountId: "u2",
      title: "Thông tin tài khoản đã được cập nhật",
      text: `Quản trị viên ${admin.name} đã cập nhật: vai trò.`,
      createdAt: stamp(now - 45 * MIN),
      read: false,
    },
    {
      id: "tb-u21-1",
      accountId: "u21",
      title: "Tài khoản đã được tạo",
      text: `Quản trị viên ${admin.name} đã tạo tài khoản Nhân viên điều độ ngoài trời cho bạn. Đăng nhập bằng số điện thoại 0905 441 202.`,
      createdAt: `${dateOf(now - 14 * 24 * HOUR)}T08:30`,
      read: true,
    },
  );
  return { reports, notifications };
}
