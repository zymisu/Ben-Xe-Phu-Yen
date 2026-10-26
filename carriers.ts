/** Dữ liệu mẫu: mười nhà xe ở đủ bốn trạng thái hồ sơ, kèm tài khoản, đội xe, tài xế. Thông tin đơn vị đều hư cấu. */
import type {
  Account,
  Dossier,
  DossierInfo,
  DossierStatus,
  Driver,
  Vehicle,
} from "@/types";
import { byRole } from "./people";
import { between, chance, dayOf, type Rnd } from "./util";

interface Spec {
  n: number;
  accountId: string;
  company: string;
  tax: string;
  address: string;
  rep: string;
  position: string;
  phone: string;
  email: string;
  bizDate: string;
  transportDate: string;
  transportIssuer: string;
  routeTo: string;
  /** Mã tuyến bến đang khai thác mà nhà xe chạy */
  routes: string[];
  vehicles: number;
  plateProv: string;
  seats: number[];
  status: DossierStatus;
  everApproved: boolean;
  /** Số ngày trước hôm nay mà tài khoản được tạo và hồ sơ được nộp */
  submittedDaysAgo: number;
  /** Số ngày sau khi nộp thì được duyệt; bỏ trống nếu chưa duyệt */
  reviewedAfter?: number;
}

const PY = "Sở Giao thông vận tải tỉnh Phú Yên";

const SPECS: Spec[] = [
  {
    n: 1,
    accountId: "u4",
    company: "Công ty TNHH Vận tải Cúc Tùng",
    tax: "4401122334",
    address: "145 Trần Hưng Đạo, phường 4, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Trần Quốc Cường",
    position: "Giám đốc",
    phone: "0905 112 233",
    email: "cuctung@example.vn",
    bizDate: "2019-03-12",
    transportDate: "2019-05-04",
    transportIssuer: PY,
    routeTo: "TP. Hồ Chí Minh",
    routes: ["t1", "t8"],
    vehicles: 12,
    plateProv: "78B",
    seats: [29, 34, 45],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 300,
    reviewedAfter: 2,
  },
  {
    n: 2,
    accountId: "u5",
    company: "HTX Vận tải Hồng Sơn Phú Yên",
    tax: "4400998877",
    address: "62 Lê Duẩn, phường 7, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Phạm Hồng Sơn",
    position: "Chủ nhiệm hợp tác xã",
    phone: "0914 220 077",
    email: "hongson@example.vn",
    bizDate: "2021-08-19",
    transportDate: "2021-10-02",
    transportIssuer: PY,
    routeTo: "Đà Nẵng",
    routes: ["t3"],
    vehicles: 8,
    plateProv: "78B",
    seats: [29, 34],
    status: "receiving",
    everApproved: false,
    submittedDaysAgo: 3,
  },
  {
    n: 3,
    accountId: "u6",
    company: "Công ty CP Xe khách Thái Dương",
    tax: "4101556677",
    address: "308 Nguyễn Huệ, phường Lê Lợi, TP. Quy Nhơn, tỉnh Bình Định",
    rep: "Võ Thanh Hải",
    position: "Phó Tổng giám đốc",
    phone: "0938 455 101",
    email: "thaiduong@example.vn",
    bizDate: "2017-11-30",
    transportDate: "2018-02-14",
    transportIssuer: "Sở Giao thông vận tải tỉnh Bình Định",
    routeTo: "Hà Nội",
    routes: ["t2", "t3"],
    vehicles: 21,
    plateProv: "77B",
    seats: [34, 45],
    status: "updating",
    everApproved: true,
    submittedDaysAgo: 250,
    reviewedAfter: 2,
  },
  {
    n: 4,
    accountId: "u7",
    company: "Công ty TNHH An Phú Quý",
    tax: "4400445566",
    address: "17 Hùng Vương, phường 5, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Đặng Thị Kim Chi",
    position: "Giám đốc",
    phone: "0987 600 412",
    email: "anphuquy@example.vn",
    bizDate: "2025-12-01",
    transportDate: "",
    transportIssuer: "",
    routeTo: "Khánh Hòa",
    routes: [],
    vehicles: 4,
    plateProv: "78B",
    seats: [16, 29],
    status: "rejected",
    everApproved: false,
    submittedDaysAgo: 14,
    reviewedAfter: 1,
  },
  {
    n: 5,
    accountId: "u8",
    company: "HTX Vận tải Bình Minh Xanh",
    tax: "4400776655",
    address: "89 Trần Phú, phường 4, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Ngô Thị Thu Hà",
    position: "Chủ nhiệm hợp tác xã",
    phone: "0903 551 220",
    email: "binhminhxanh@example.vn",
    bizDate: "2020-06-09",
    transportDate: "2020-07-21",
    transportIssuer: PY,
    routeTo: "Khánh Hòa",
    routes: ["t4", "t5"],
    vehicles: 6,
    plateProv: "78B",
    seats: [16, 29],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 245,
    reviewedAfter: 2,
  },
  {
    n: 6,
    accountId: "u9",
    company: "Công ty TNHH Vận tải Biển Xanh",
    tax: "4400334455",
    address: "240 Hùng Vương, phường 6, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Lương Quốc Việt",
    position: "Giám đốc",
    phone: "0987 700 400",
    email: "bienxanh@example.vn",
    bizDate: "2018-04-17",
    transportDate: "2018-06-01",
    transportIssuer: PY,
    routeTo: "Cần Thơ",
    routes: ["t8", "t1"],
    vehicles: 9,
    plateProv: "78B",
    seats: [34, 45],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 230,
    reviewedAfter: 2,
  },
  {
    n: 7,
    accountId: "u14",
    company: "Công ty TNHH Vận tải Sông Cầu",
    tax: "4400221100",
    address: "36 Nguyễn Công Trứ, phường 2, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Đoàn Minh Tâm",
    position: "Giám đốc",
    phone: "0908 245 316",
    email: "songcau@example.vn",
    bizDate: "2016-09-05",
    transportDate: "2016-11-18",
    transportIssuer: PY,
    routeTo: "Đà Nẵng",
    routes: ["t3", "t2"],
    vehicles: 8,
    plateProv: "78B",
    seats: [29, 34, 45],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 215,
    reviewedAfter: 2,
  },
  {
    n: 8,
    accountId: "u15",
    company: "Công ty CP Xe khách Tháp Nhạn",
    tax: "4400556677",
    address: "5 Độc Lập, phường 7, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Kiều Văn Lợi",
    position: "Tổng giám đốc",
    phone: "0912 330 458",
    email: "thapnhan@example.vn",
    bizDate: "2015-02-23",
    transportDate: "2015-04-10",
    transportIssuer: PY,
    routeTo: "Đắk Lắk",
    routes: ["t6", "t7"],
    vehicles: 10,
    plateProv: "78B",
    seats: [29, 34, 45],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 195,
    reviewedAfter: 2,
  },
  {
    n: 9,
    accountId: "u16",
    company: "HTX Vận tải Gành Đá Đĩa",
    tax: "4400889900",
    address: "112 Lê Thánh Tông, phường 9, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Tô Thị Mỹ Linh",
    position: "Chủ nhiệm hợp tác xã",
    phone: "0935 771 204",
    email: "gandadia@example.vn",
    bizDate: "2022-01-14",
    transportDate: "2022-03-08",
    transportIssuer: PY,
    routeTo: "Gia Lai",
    routes: [],
    vehicles: 5,
    plateProv: "78B",
    seats: [16, 29],
    status: "receiving",
    everApproved: false,
    submittedDaysAgo: 1,
  },
  {
    n: 10,
    accountId: "u17",
    company: "Công ty TNHH Du lịch và Vận tải Xuân Đài",
    tax: "4400667788",
    address: "73 Lê Lợi, phường 3, TP. Tuy Hòa, tỉnh Phú Yên",
    rep: "Lại Văn Hiếu",
    position: "Giám đốc",
    phone: "0918 662 097",
    email: "xuandai@example.vn",
    bizDate: "2019-07-26",
    transportDate: "2019-09-12",
    transportIssuer: PY,
    routeTo: "Bình Định",
    routes: ["t5", "t4"],
    vehicles: 7,
    plateProv: "78B",
    seats: [16, 29, 34],
    status: "active",
    everApproved: true,
    submittedDaysAgo: 160,
    reviewedAfter: 2,
  },
];

/** Họ tên người đại diện và số điện thoại đã dùng, để tài xế mẫu không trùng */
export const REP_NAMES = SPECS.map((s) => s.rep);
export const CARRIER_PHONES = SPECS.map((s) => s.phone);

/** Mã tuyến mỗi nhà xe đang chạy, theo mã hồ sơ */
export const CARRIER_ROUTES: Record<string, string[]> = Object.fromEntries(
  SPECS.map((s) => [`hs${s.n}`, s.routes]),
);

const REVIEWERS = () => byRole("reception").filter((s) => s.id !== "u13");

export interface Built {
  dossiers: Dossier[];
  accounts: Account[];
}

export function buildCarriers(
  now: number,
  r: Rnd,
  newName: () => string,
  newPhone: () => string,
): Built {
  const plates = new Set<string>();
  const newPlate = (prov: string) => {
    for (;;) {
      const p = `${prov}-${String(between(r, 1, 999)).padStart(3, "0")}.${String(between(r, 0, 99)).padStart(2, "0")}`;
      if (!plates.has(p)) {
        plates.add(p);
        return p;
      }
    }
  };

  const dossiers: Dossier[] = [];
  const accounts: Account[] = [];

  for (const s of SPECS) {
    const id = `hs${s.n}`;

    const vehicles: Vehicle[] = Array.from({ length: s.vehicles }, (_, i) => {
      const plate = newPlate(s.plateProv);
      const d = plate.replace(/\D/g, "");
      return {
        id: `${id}-v${i}`,
        plate,
        seats: s.seats[i % s.seats.length],
        registrationNo: `ĐK-${d}`,
        inspectionNo: `KD-${d}`,
        // Giấy tờ đều còn hạn ít nhất 40 ngày; một xe của nhà xe 1 sắp hết hạn kiểm định
        inspectionExpiry: dayOf(
          now,
          id === "hs1" && i === 2 ? 25 : between(r, 40, 330),
        ),
        insuranceNo: `BH-${d}`,
        insuranceExpiry: dayOf(now, between(r, 40, 330)),
      };
    });

    const drivers: Driver[] = Array.from(
      { length: Math.ceil(s.vehicles * 1.25) },
      (_, i) => ({ id: `${id}-d${i}`, name: newName(), phone: newPhone() }),
    );

    const submittedAt = dayOf(now, -s.submittedDaysAgo);
    const reviewedAt =
      s.reviewedAfter !== undefined
        ? dayOf(now, -s.submittedDaysAgo + s.reviewedAfter)
        : undefined;
    const reviewer = REVIEWERS()[s.n % 2].name;

    const info: DossierInfo = {
      companyName: s.company,
      taxCode: s.tax,
      address: s.address,
      representative: s.rep,
      position: s.position,
      email: s.email,
      bizNo: s.tax,
      bizDate: s.bizDate,
      transportNo: s.transportDate
        ? `${String(between(r, 11, 299)).padStart(3, "0")}/GPKDVT-SGTVT`
        : "",
      transportDate: s.transportDate,
      transportIssuer: s.transportIssuer,
      serviceType: "Tuyến cố định",
      routeFrom: "Phú Yên",
      routeTo: s.routeTo,
      drivers,
      vehicles,
    };

    const dossier: Dossier = {
      ...info,
      id,
      accountId: s.accountId,
      phone: s.phone,
      status: s.status,
      everApproved: s.everApproved,
      submittedAt,
      reviewedAt,
      reviewerName: reviewedAt ? reviewer : undefined,
      resultSeen: true,
    };

    if (s.status === "rejected") {
      dossier.rejectReason =
        "Hồ sơ chưa có Giấy phép kinh doanh vận tải bằng xe ô tô. Đề nghị bổ sung bản sao có chứng thực rồi nộp lại hồ sơ.";
    }

    // Nhà xe 3 đã được duyệt, đang xin cập nhật: đổi chức vụ, địa chỉ và thêm một xe
    if (id === "hs3") {
      const extra: Vehicle = {
        ...vehicles[0],
        id: `${id}-v${vehicles.length}`,
        plate: newPlate(s.plateProv),
        registrationNo: "ĐK-91207",
        inspectionNo: "KD-91207",
        insuranceNo: "BH-91207",
        inspectionExpiry: dayOf(now, 200),
        insuranceExpiry: dayOf(now, 210),
      };
      dossier.request = {
        ...info,
        position: "Tổng giám đốc",
        address: "512 Nguyễn Tất Thành, phường 8, TP. Tuy Hòa, tỉnh Phú Yên",
        vehicles: [...vehicles, extra],
      };
      dossier.requestedAt = dayOf(now, -2);
    }

    // Nhà xe 10 từng bị từ chối một yêu cầu cập nhật gần đây, hồ sơ cũ vẫn hiệu lực
    if (id === "hs10") {
      dossier.updateRejection = {
        reason:
          "Giấy chứng nhận đăng ký doanh nghiệp mới chưa đính kèm bản sao. Đề nghị bổ sung rồi gửi lại.",
        date: dayOf(now, -3),
      };
      dossier.reviewedAt = dayOf(now, -3);
      dossier.reviewerName = REVIEWERS()[0].name;
    }

    dossiers.push(dossier);
    accounts.push({
      id: s.accountId,
      username: s.phone,
      password: "123456",
      phone: s.phone,
      email: s.email,
      fullName: s.rep,
      role: "carrier",
      createdAt: submittedAt,
      code: `HS-${String(s.n).padStart(4, "0")}`,
      address: chance(r, 0.3) ? s.address : "",
    });
  }

  return { dossiers, accounts };
}
