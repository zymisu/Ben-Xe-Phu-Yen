"use client";

/**
 * Phía đơn vị vận tải của UC3 - theo dõi kết quả tiếp nhận hồ sơ và gửi yêu
 * cầu cập nhật. Bị từ chối thì hiện kèm lý do.
 */
import { Badge, Button, Dialog, Note, PageHeader, The } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { formatDate } from "@/lib/format";
import { DOSSIER_STATUS_LABEL, DOSSIER_STATUS_TONE } from "@/types";
import { pickInfo } from "../profile";
import { ProfileForm } from "../ProfileForm";
import { ProfileView } from "../ProfileView";
import { useMyDossier } from "./logic";

export function MyDossier() {
  const f = useMyDossier();
  const d = f.dossier;

  if (!d) {
    return (
      <>
        <PageHeader branch="Đơn vị vận tải" title="Hồ sơ đơn vị" />
        <Note tone="info">Tài khoản này chưa có hồ sơ đơn vị vận tải.</Note>
      </>
    );
  }

  return (
    <>
      <PageHeader
        branch="Đơn vị vận tải"
        title="Hồ sơ đơn vị"
        desc={`Hồ sơ nộp ngày ${formatDate(d.submittedAt)}.`}
        phai={
          <>
            <Badge tone={DOSSIER_STATUS_TONE[d.status]} dot>
              {DOSSIER_STATUS_LABEL[d.status]}
            </Badge>
            {f.canEdit && (
              <Button
                variant={d.status === "rejected" ? "chinh" : "sub"}
                small
                onClick={f.openEditor}
              >
                <Icon name="file" className="size-4" />
                {d.status === "rejected"
                  ? "Chỉnh sửa và nộp lại"
                  : "Yêu cầu cập nhật hồ sơ"}
              </Button>
            )}
          </>
        }
      />

      {f.showApproved && (
        <Note tone="ok" title="Hồ sơ đã được phê duyệt">
          Bến xe duyệt hồ sơ ngày {formatDate(d.reviewedAt)}
          {d.reviewerName ? `, nhân viên ${d.reviewerName}` : ""}. Đơn vị được
          đăng ký chuyến xe khai thác tại bến.
        </Note>
      )}
      {d.status === "active" && d.updateRejection && (
        <Note tone="danger" title="Yêu cầu cập nhật bị từ chối">
          {d.updateRejection.reason}
          <span className="mt-1 block text-xs opacity-80">
            Ngày xử lý {formatDate(d.updateRejection.date)}
            {d.reviewerName ? ` · nhân viên ${d.reviewerName}` : ""}. Hồ sơ hiện
            tại vẫn có hiệu lực, bạn có thể gửi yêu cầu cập nhật mới.
          </span>
        </Note>
      )}
      {d.status === "rejected" && (
        <Note tone="danger" title="Hồ sơ bị từ chối">
          {d.rejectReason}
          <span className="mt-1 block text-xs opacity-80">
            Ngày xử lý {formatDate(d.reviewedAt)}
            {d.reviewerName ? ` · nhân viên ${d.reviewerName}` : ""}
          </span>
        </Note>
      )}
      {d.status === "receiving" && (
        <Note tone="warn" title="Hồ sơ đang chờ tiếp nhận">
          Bến xe đối chiếu giấy tờ pháp lý và phản hồi kết quả phê duyệt tại
          trang này.
        </Note>
      )}
      {d.status === "updating" && (
        <Note tone="info" title="Yêu cầu cập nhật đang chờ duyệt">
          Bến xe đang xem xét nội dung bạn đề nghị thay đổi (gửi ngày{" "}
          {formatDate(d.requestedAt)}). Trong thời gian này hồ sơ cũ vẫn có hiệu
          lực.
        </Note>
      )}

      <The className="mt-5">
        <ProfileView info={pickInfo(d)} request={d.request} />
      </The>

      <Dialog
        open={f.editing}
        close={f.closeEditor}
        title={
          d.status === "rejected"
            ? "Chỉnh sửa và nộp lại hồ sơ"
            : "Yêu cầu cập nhật hồ sơ"
        }
        desc="Sửa các mục cần thay đổi rồi gửi tới bến xe."
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeEditor}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-ho-so">
              Gửi tới bến xe
            </Button>
          </>
        }
      >
        {f.profile && (
          <form id="form-ho-so" onSubmit={f.submit} className="space-y-5">
            <ProfileForm
              profile={f.profile}
              setField={f.setField}
              inUse={f.usage}
            />
          </form>
        )}
      </Dialog>
    </>
  );
}
