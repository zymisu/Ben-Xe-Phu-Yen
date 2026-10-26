/**
 * Vòng đời nộp - duyệt dùng chung cho hồ sơ và chuyến xe:
 * đang tiếp nhận → đang hoạt động ⇄ đang cập nhật; bị từ chối thì sửa và nộp lại.
 * Yêu cầu cập nhật bị từ chối thì bản đang hoạt động giữ nguyên, lý do ghi ở `updateRejection`.
 */
import { todayISO } from "@/lib/format";
import { fail, ok, type DossierStatus, type Result } from "@/types";

export interface Reviewable {
  status: DossierStatus;
  everApproved: boolean;
  /** Nội dung đề nghị thay đổi, chỉ có khi đang cập nhật */
  request?: object;
  requestedAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectReason?: string;
  updateRejection?: { reason: string; date: string };
}

const today = todayISO;

/** Đang chờ nhân viên quyết định: lập lần đầu hoặc xin cập nhật */
export function isAwaiting(x: Pick<Reviewable, "status">): boolean {
  return x.status === "receiving" || x.status === "updating";
}

/** Từ chối phải nêu lý do để nhà xe biết cần bổ sung gì */
export function checkRejection(reason: string): Result {
  if (!reason.trim()) {
    return fail("Nhập lý do từ chối để nhà xe biết cần bổ sung gì.");
  }
  return ok("");
}

/** Ghi quyết định duyệt hoặc từ chối của nhân viên vào bản ghi */
export function decide<T extends Reviewable>(
  item: T,
  decision: "approve" | "reject",
  reviewerName: string,
  reason = "",
): T {
  const now = today();

  if (decision === "approve") {
    return {
      ...item,
      // Nội dung đề nghị trở thành bản hiện hành
      ...(item.request ?? {}),
      request: undefined,
      requestedAt: undefined,
      status: "active",
      everApproved: true,
      reviewedAt: now,
      reviewerName,
      rejectReason: "",
      updateRejection: undefined,
    };
  }

  if (item.status === "updating") {
    return {
      ...item,
      status: "active",
      request: undefined,
      requestedAt: undefined,
      reviewedAt: now,
      reviewerName,
      updateRejection: { reason: reason.trim(), date: now },
    };
  }

  return {
    ...item,
    status: "rejected",
    reviewedAt: now,
    reviewerName,
    rejectReason: reason.trim(),
  };
}

/**
 * Ghi nội dung nhà xe vừa nộp. Bản đã từng được duyệt chuyển sang đang cập
 * nhật và giữ nguyên nội dung cũ; bản chưa từng được duyệt thì thay luôn nội
 * dung và quay về đang tiếp nhận.
 */
export function submitChange<T extends Reviewable>(item: T, info: object): T {
  if (item.everApproved) {
    return {
      ...item,
      rejectReason: "",
      updateRejection: undefined,
      status: "updating",
      request: info,
      requestedAt: today(),
    };
  }
  return {
    ...item,
    ...info,
    rejectReason: "",
    reviewedAt: undefined,
    reviewerName: undefined,
    status: "receiving",
  };
}
