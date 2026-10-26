"use client";

/**
 * Hook trả về thời điểm hiện tại, làm mới định kỳ.
 */
import { useEffect, useState } from "react";

/** Thời điểm hiện tại, làm mới mỗi nửa phút để trạng thái theo giờ tự cập nhật */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
