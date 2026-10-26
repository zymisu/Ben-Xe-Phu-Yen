/**
 * Nhân viên bến xe và kho tên dùng để đặt tên tài xế. Tên nhân viên là duy
 * nhất vì các hạng mục lưu theo họ tên người xử lý (xem UC10).
 */
import type { Account, Role } from "@/types";
import { pick, type Rnd } from "./util";

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: Role;
  code: string;
  email: string;
  address: string;
  createdAt: string;
}

const staff = (
  id: string,
  name: string,
  phone: string,
  role: Role,
  code: string,
  email: string,
  address = "",
): Staff => ({
  id,
  name,
  phone,
  role,
  code,
  email,
  address,
  createdAt: "2025-10-06",
});

/** Cơ cấu theo tổ chức của bến: điều độ trong nhà, điều độ ngoài trời, an ninh trật tự */
export const STAFF: Staff[] = [
  staff(
    "u1",
    "Nguyễn Thị Hải Sâm",
    "0257 3824 111",
    "admin",
    "QT-0001",
    "giamdoc@benxephuyen.vn",
    "227 Nguyễn Tất Thành, phường 8, TP. Tuy Hòa",
  ),
  staff(
    "u2",
    "Nguyễn Thị Lan Anh",
    "0905 778 899",
    "reception",
    "NV-0001",
    "lananh@benxephuyen.vn",
  ),
  staff(
    "u3",
    "Lê Minh Trí",
    "0905 334 556",
    "reception",
    "NV-0002",
    "minhtri@benxephuyen.vn",
    "12 Lê Lợi, phường 4, TP. Tuy Hòa",
  ),
  staff(
    "u10",
    "Hoàng Gia Bảo",
    "0905 441 100",
    "indoor",
    "NV-0003",
    "giabao@benxephuyen.vn",
  ),
  staff(
    "u18",
    "Lâm Thị Bích Ngọc",
    "0905 441 101",
    "indoor",
    "NV-0004",
    "bichngoc@benxephuyen.vn",
  ),
  staff(
    "u19",
    "Đoàn Văn Phước",
    "0905 441 102",
    "indoor",
    "NV-0005",
    "vanphuoc@benxephuyen.vn",
  ),
  staff(
    "u11",
    "Trương Quốc Dũng",
    "0905 441 200",
    "outdoor",
    "NV-0006",
    "quocdung@benxephuyen.vn",
  ),
  staff(
    "u20",
    "Mai Văn Tâm",
    "0905 441 201",
    "outdoor",
    "NV-0007",
    "vantam@benxephuyen.vn",
  ),
  staff(
    "u21",
    "Cao Thanh Phong",
    "0905 441 202",
    "outdoor",
    "NV-0008",
    "thanhphong@benxephuyen.vn",
  ),
  staff(
    "u12",
    "Vũ Hoàng Long",
    "0905 441 300",
    "security",
    "NV-0009",
    "hoanglong@benxephuyen.vn",
  ),
  staff(
    "u22",
    "Tạ Minh Khôi",
    "0905 441 301",
    "security",
    "NV-0010",
    "minhkhoi@benxephuyen.vn",
  ),
  staff(
    "u23",
    "Châu Quốc Huy",
    "0905 441 302",
    "security",
    "NV-0011",
    "quochuy@benxephuyen.vn",
  ),
  // Chưa xử lý hạng mục nào nên xóa được (UC10)
  staff(
    "u13",
    "Phạm Thị Mai",
    "0905 441 400",
    "reception",
    "NV-0012",
    "thimai@benxephuyen.vn",
  ),
];

export const byRole = (role: Role): Staff[] =>
  STAFF.filter((s) => s.role === role);

export const staffAccounts = (): Account[] =>
  STAFF.map((s) => ({
    id: s.id,
    username: s.phone,
    password: "123456",
    phone: s.phone,
    email: s.email,
    fullName: s.name,
    role: s.role,
    createdAt: s.createdAt,
    code: s.code,
    address: s.address,
  }));

// tên tài xế

const SURNAME = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Huỳnh",
  "Phan",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
  "Trương",
  "Châu",
];
const MIDDLE = [
  "Văn",
  "Minh",
  "Quốc",
  "Thanh",
  "Hoàng",
  "Đức",
  "Ngọc",
  "Xuân",
  "Hữu",
  "Công",
  "Thành",
  "Anh",
];
const GIVEN = [
  "Bình",
  "Huy",
  "Tuấn",
  "Lộc",
  "Sang",
  "Nam",
  "Tú",
  "Thịnh",
  "Hải",
  "Kiên",
  "Khoa",
  "Phát",
  "Quân",
  "Sơn",
  "Tài",
  "Việt",
  "Hùng",
  "Trung",
  "Nghĩa",
  "Phúc",
  "Đạt",
  "Khánh",
  "Lâm",
  "Toàn",
  "Vinh",
  "Hiếu",
  "Thắng",
  "Duy",
];

/** Kho tên không trùng với nhân viên hay người đã được đặt trước đó */
export function namePool(used: Set<string>, r: Rnd) {
  return () => {
    for (let i = 0; i < 500; i++) {
      const n = `${pick(r, SURNAME)} ${pick(r, MIDDLE)} ${pick(r, GIVEN)}`;
      if (!used.has(n)) {
        used.add(n);
        return n;
      }
    }
    throw new Error("Hết tên mẫu");
  };
}

/** Số điện thoại di động mẫu, không trùng nhau */
export function phonePool(used: Set<string>, r: Rnd) {
  const heads = [
    "0905",
    "0914",
    "0935",
    "0912",
    "0932",
    "0977",
    "0988",
    "0903",
  ];
  return () => {
    for (let i = 0; i < 500; i++) {
      const d = String(Math.floor(r() * 1_000_000)).padStart(6, "0");
      const p = `${pick(r, heads)} ${d.slice(0, 3)} ${d.slice(3)}`;
      if (!used.has(p)) {
        used.add(p);
        return p;
      }
    }
    throw new Error("Hết số điện thoại mẫu");
  };
}
