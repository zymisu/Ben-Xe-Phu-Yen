/**
 * UC4 - Hiển thị chi tiết chuyến, có thể đặt cạnh bản yêu cầu cập nhật.
 */
import { CompareView } from "@/components/CompareView";
import type { Route, TripInfo } from "@/types";
import { showTripValue, TRIP_GROUPS } from "./trip";

/** Chi tiết chuyến; truyền `request` để đặt cạnh bản yêu cầu cập nhật */
export function TripView({
  routes,
  info,
  request,
}: {
  routes: Route[];
  info: TripInfo;
  request?: TripInfo;
}) {
  return (
    <CompareView
      groups={TRIP_GROUPS}
      current={info}
      request={request}
      show={(t, k) => showTripValue(routes, t, k)}
    />
  );
}
