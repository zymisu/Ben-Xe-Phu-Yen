/**
 * Nội dung hồ sơ đơn vị vận tải dùng chung cho đăng ký, cập nhật, đối chiếu.
 * Thuần dữ liệu và quy tắc, không có React.
 */
import { formatDate, todayISO } from "@/lib/format";
import { normalizePlate, PHONE, PLATE } from "@/lib/rules";
import {
  fail,
  ok,
  SERVICE_TYPES,
  type Driver,
  type DossierInfo,
  type Result,
  type Vehicle,
} from "@/types";

const TAX = /^\d{10}(-\d{3})?$/;
const EMAIL = /^\S+@\S+\.\S+$/;

/** Dạng chuỗi của một xe trong biểu mẫu, chưa ép kiểu */
export type VehicleForm = Omit<Vehicle, "seats"> & { seats: string };

/** Dạng chuỗi của hồ sơ trong biểu mẫu, chưa ép kiểu */
export type Profile = Omit<DossierInfo, "vehicles"> & {
  vehicles: VehicleForm[];
};

let counter = 0;
/** Mã tạm cho dòng mới thêm vào danh sách trong biểu mẫu */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter}`;
}

export function emptyDriver(id = newId("d")): Driver {
  return { id, name: "", phone: "" };
}

export function emptyVehicle(id = newId("v")): VehicleForm {
  return {
    id,
    plate: "",
    seats: "",
    registrationNo: "",
    inspectionNo: "",
    inspectionExpiry: "",
    insuranceNo: "",
    insuranceExpiry: "",
  };
}

export const EMPTY_PROFILE: Profile = {
  companyName: "",
  taxCode: "",
  address: "",
  representative: "",
  position: "",
  email: "",
  bizNo: "",
  bizDate: "",
  transportNo: "",
  transportDate: "",
  transportIssuer: "Sở Giao thông vận tải tỉnh Phú Yên",
  serviceType: SERVICE_TYPES[0],
  routeFrom: "Phú Yên",
  routeTo: "",
  drivers: [emptyDriver("d0")],
  vehicles: [emptyVehicle("v0")],
};

export function toProfile(info: DossierInfo): Profile {
  const p = pickInfo(info);
  return {
    ...p,
    vehicles: p.vehicles.map((v) => ({ ...v, seats: String(v.seats) })),
  };
}

/** Chỉ lấy đúng các trường của hồ sơ, bỏ phần quản lý của bản ghi */
export function pickInfo(d: DossierInfo): DossierInfo {
  return {
    companyName: d.companyName,
    taxCode: d.taxCode,
    address: d.address,
    representative: d.representative,
    position: d.position,
    email: d.email,
    bizNo: d.bizNo,
    bizDate: d.bizDate,
    transportNo: d.transportNo,
    transportDate: d.transportDate,
    transportIssuer: d.transportIssuer,
    serviceType: d.serviceType,
    routeFrom: d.routeFrom,
    routeTo: d.routeTo,
    drivers: d.drivers.map((x) => ({ ...x })),
    vehicles: d.vehicles.map((x) => ({ ...x })),
  };
}

/** Kiểm tra danh sách tài xế: có ít nhất một người, đủ tên, số điện thoại hợp lệ và không trùng */
function checkDrivers(list: Driver[]): Result {
  if (list.length === 0) return fail("Cần khai ít nhất một tài xế.");
  const seen = new Set<string>();
  for (const [i, d] of list.entries()) {
    const at = `Tài xế ${i + 1}: `;
    if (!d.name.trim()) return fail(`${at}chưa nhập họ tên.`);
    if (!PHONE.test(d.phone.trim()))
      return fail(`${at}số điện thoại sai định dạng.`);
    const key = d.phone.replace(/\s/g, "");
    if (seen.has(key)) return fail(`${at}số điện thoại bị trùng.`);
    seen.add(key);
  }
  return ok("");
}

/** Kiểm tra danh sách xe: biển số, số chỗ và giấy tờ đều phải đủ và còn hạn */
function checkVehicles(list: VehicleForm[]): Result {
  if (list.length === 0) return fail("Cần khai ít nhất một xe.");
  const seen = new Set<string>();
  const today = todayISO();
  for (const [i, v] of list.entries()) {
    const at = `Xe ${i + 1}: `;
    const plate = normalizePlate(v.plate);
    if (!plate) return fail(`${at}chưa nhập biển số.`);
    if (!PLATE.test(plate))
      return fail(`${at}biển số sai định dạng, ví dụ 78B-012.34.`);
    if (seen.has(plate)) return fail(`${at}biển số bị trùng.`);
    seen.add(plate);
    const seats = Number(v.seats);
    if (!v.seats || !Number.isInteger(seats) || seats < 4 || seats > 60)
      return fail(`${at}số chỗ ngồi phải từ 4 đến 60.`);
    if (!v.registrationNo.trim())
      return fail(`${at}chưa nhập số Giấy đăng ký xe.`);
    if (!v.inspectionNo.trim())
      return fail(`${at}chưa nhập số Giấy chứng nhận kiểm định.`);
    if (!v.inspectionExpiry)
      return fail(`${at}chưa nhập hạn Giấy chứng nhận kiểm định.`);
    if (v.inspectionExpiry < today)
      return fail(`${at}Giấy chứng nhận kiểm định đã hết hạn.`);
    if (!v.insuranceNo.trim())
      return fail(`${at}chưa nhập số bảo hiểm trách nhiệm dân sự.`);
    if (!v.insuranceExpiry)
      return fail(`${at}chưa nhập hạn bảo hiểm trách nhiệm dân sự.`);
    if (v.insuranceExpiry < today)
      return fail(`${at}bảo hiểm trách nhiệm dân sự đã hết hạn.`);
  }
  return ok("");
}

/** Hồ sơ phải đủ các mục nhân viên bến xe cần để đối chiếu */
export function checkProfile(p: Profile): Result {
  if (!p.companyName.trim()) return fail("Chưa nhập tên đơn vị vận tải.");
  if (!TAX.test(p.taxCode.trim()))
    return fail("Mã số thuế gồm 10 chữ số, đơn vị trực thuộc thêm 3 chữ số.");
  if (!p.address.trim()) return fail("Chưa nhập địa chỉ trụ sở.");
  if (!p.representative.trim())
    return fail("Chưa nhập người đại diện pháp luật.");
  if (p.email.trim() && !EMAIL.test(p.email.trim()))
    return fail("Thư điện tử không hợp lệ.");
  if (!p.bizNo.trim())
    return fail("Chưa nhập số Giấy chứng nhận đăng ký doanh nghiệp.");
  if (!p.bizDate) return fail("Chưa nhập ngày cấp Giấy chứng nhận.");
  if (!p.transportNo.trim())
    return fail("Chưa nhập số Giấy phép kinh doanh vận tải bằng xe ô tô.");
  if (!p.transportDate) return fail("Chưa nhập ngày cấp Giấy phép kinh doanh.");
  if (!p.transportIssuer.trim()) return fail("Chưa nhập nơi cấp Giấy phép.");
  if (!p.routeFrom) return fail("Chưa chọn nơi đi của tuyến đề nghị.");
  if (!p.routeTo) return fail("Chưa chọn nơi đến của tuyến đề nghị.");
  if (p.routeFrom === p.routeTo)
    return fail("Nơi đi và nơi đến của tuyến phải khác nhau.");
  const drivers = checkDrivers(p.drivers);
  if (!drivers.ok) return drivers;
  return checkVehicles(p.vehicles);
}

export function toInfo(p: Profile): DossierInfo {
  return {
    companyName: p.companyName.trim(),
    taxCode: p.taxCode.trim(),
    address: p.address.trim(),
    representative: p.representative.trim(),
    position: p.position.trim(),
    email: p.email.trim(),
    bizNo: p.bizNo.trim(),
    bizDate: p.bizDate,
    transportNo: p.transportNo.trim(),
    transportDate: p.transportDate,
    transportIssuer: p.transportIssuer.trim(),
    serviceType: p.serviceType,
    routeFrom: p.routeFrom,
    routeTo: p.routeTo,
    drivers: p.drivers.map((d) => ({
      id: d.id,
      name: d.name.trim(),
      phone: d.phone.trim(),
    })),
    vehicles: p.vehicles.map((v) => ({
      id: v.id,
      plate: normalizePlate(v.plate),
      seats: Number(v.seats),
      registrationNo: v.registrationNo.trim(),
      inspectionNo: v.inspectionNo.trim(),
      inspectionExpiry: v.inspectionExpiry,
      insuranceNo: v.insuranceNo.trim(),
      insuranceExpiry: v.insuranceExpiry,
    })),
  };
}

// hiển thị

export const PROFILE_GROUPS: {
  title: string;
  rows: { key: keyof DossierInfo; label: string }[];
}[] = [
  {
    title: "Thông tin đơn vị",
    rows: [
      { key: "companyName", label: "Tên đơn vị vận tải" },
      { key: "taxCode", label: "Mã số thuế" },
      { key: "address", label: "Địa chỉ trụ sở" },
      { key: "representative", label: "Người đại diện pháp luật" },
      { key: "position", label: "Chức vụ" },
      { key: "email", label: "Thư điện tử" },
    ],
  },
  {
    title: "Giấy tờ pháp lý",
    rows: [
      { key: "bizNo", label: "Số Giấy chứng nhận đăng ký doanh nghiệp" },
      { key: "bizDate", label: "Ngày cấp Giấy chứng nhận" },
      { key: "transportNo", label: "Số Giấy phép kinh doanh vận tải" },
      { key: "transportDate", label: "Ngày cấp Giấy phép" },
      { key: "transportIssuer", label: "Nơi cấp Giấy phép" },
    ],
  },
  {
    title: "Nội dung đề nghị",
    rows: [
      { key: "serviceType", label: "Loại hình kinh doanh" },
      { key: "routeFrom", label: "Tuyến đề nghị - nơi đi" },
      { key: "routeTo", label: "Tuyến đề nghị - nơi đến" },
    ],
  },
  {
    title: "Tài xế và phương tiện",
    rows: [
      { key: "drivers", label: "Danh sách tài xế" },
      { key: "vehicles", label: "Danh sách xe" },
    ],
  },
];

/** Tên tuyến để hiện trong danh sách */
export function routeLabel(d: DossierInfo): string {
  return `${d.routeFrom} - ${d.routeTo}`;
}

/** Mỗi xe một dòng, kèm số giấy tờ và hạn */
export function vehicleLine(v: Vehicle): string {
  return `${v.plate} · ${v.seats} chỗ · Đăng ký ${v.registrationNo} · Kiểm định ${v.inspectionNo} (hạn ${formatDate(v.inspectionExpiry)}) · Bảo hiểm ${v.insuranceNo} (hạn ${formatDate(v.insuranceExpiry)})`;
}

export function showValue(info: DossierInfo, key: keyof DossierInfo): string {
  if (key === "bizDate" || key === "transportDate") {
    return info[key] ? formatDate(info[key]) : "";
  }
  if (key === "drivers") {
    return info.drivers.map((d) => `${d.name} · ${d.phone}`).join("\n");
  }
  if (key === "vehicles") return info.vehicles.map(vehicleLine).join("\n");
  return String(info[key] ?? "");
}

/**
 * Chặn xóa xe hoặc tài xế đang dùng cho chuyến chưa khởi hành, vì chuyến đó
 * sẽ mất xe hoặc tài xế mà nhà xe không còn chọn lại được.
 */
export function checkNoRemovedInUse(
  next: Profile,
  current: DossierInfo,
  usage: { vehicles: Record<string, number>; drivers: Record<string, number> },
): Result {
  for (const v of current.vehicles) {
    const n = usage.vehicles[v.id] ?? 0;
    if (n > 0 && !next.vehicles.some((x) => x.id === v.id))
      return fail(
        `Xe ${v.plate} đang dùng cho ${n} chuyến chưa khởi hành, không thể xóa khỏi hồ sơ.`,
      );
  }
  for (const d of current.drivers) {
    const n = usage.drivers[d.id] ?? 0;
    if (n > 0 && !next.drivers.some((x) => x.id === d.id))
      return fail(
        `Tài xế ${d.name} đang dùng cho ${n} chuyến chưa khởi hành, không thể xóa khỏi hồ sơ.`,
      );
  }
  return ok("");
}
