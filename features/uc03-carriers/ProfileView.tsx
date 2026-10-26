/**
 * UC3 - Hiển thị hồ sơ đơn vị, có thể đặt cạnh bản yêu cầu cập nhật.
 */
import { CompareView } from "@/components/CompareView";
import type { DossierInfo } from "@/types";
import { PROFILE_GROUPS, showValue } from "./profile";

/** Hồ sơ đơn vị; truyền `request` để đặt cạnh bản yêu cầu cập nhật */
export function ProfileView({
  info,
  request,
}: {
  info: DossierInfo;
  request?: DossierInfo;
}) {
  return (
    <CompareView
      groups={PROFILE_GROUPS}
      current={info}
      request={request}
      show={showValue}
    />
  );
}
