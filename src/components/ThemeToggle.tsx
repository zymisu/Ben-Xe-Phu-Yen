"use client";

/**
 * Nút chuyển giao diện sáng/tối, nhớ lựa chọn trong localStorage.
 */
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cx } from "./ui";

const KHOA = "bxpy.giaodien";

/** Đặt data-theme sớm để tránh nháy màu khi tải trang */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KHOA}");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export function ThemeToggle({ toi = false }: { toi?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // Chỉ đọc được localStorage sau khi gắn vào DOM.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const t = localStorage.getItem(KHOA);
      if (t === "dark" || t === "light") setTheme(t);
      else
        setTheme(
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light",
        );
    } catch {
      setTheme("light");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function doi() {
    const moi = theme === "dark" ? "light" : "dark";
    setTheme(moi);
    document.documentElement.setAttribute("data-theme", moi);
    try {
      localStorage.setItem(KHOA, moi);
    } catch {
      /* bỏ qua */
    }
  }

  return (
    <button
      onClick={doi}
      aria-label={
        theme === "dark"
          ? "Chuyển sang giao diện sáng"
          : "Chuyển sang giao diện tối"
      }
      title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
      className={cx(
        "khong-in rounded-lg border p-2 transition-colors",
        toi
          ? "border-deep-line text-deep-muted hover:bg-white/5 hover:text-deep-ink"
          : "border-line-strong text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" />
    </button>
  );
}
