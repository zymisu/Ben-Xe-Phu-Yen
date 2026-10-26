"use client";

/**
 * Phân trang danh sách (10 dòng mỗi trang).
 */
import { useState } from "react";
import { Icon } from "./Icon";
import { Button } from "./ui";

export const PAGE_SIZE = 10;

/** Chia danh sách thành từng trang; `resetKey` đổi thì quay về trang đầu. */
export function usePaged<T>(list: T[], resetKey: string, size = PAGE_SIZE) {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const pages = Math.max(1, Math.ceil(list.length / size));
  const wanted = state.key === resetKey ? state.page : 1;
  const page = Math.min(wanted, pages);

  return {
    page,
    pages,
    total: list.length,
    size,
    rows: list.slice((page - 1) * size, page * size),
    setPage: (p: number) => setState({ key: resetKey, page: p }),
  };
}

export type Paged = Pick<
  ReturnType<typeof usePaged>,
  "page" | "pages" | "total" | "size" | "setPage"
>;

/** Thanh chuyển trang; chỉ hiện khi danh sách vượt một trang */
export function Pager({ page, pages, total, size, setPage }: Paged) {
  if (pages <= 1) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <nav
      aria-label="Phân trang"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="tnum text-sm text-muted">
        {from}-{to} / {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="sub"
          small
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <Icon name="chevronRight" className="size-4 rotate-180" />
          Trước
        </Button>
        <span className="tnum min-w-16 text-center text-sm font-semibold text-ink">
          {page} / {pages}
        </span>
        <Button
          variant="sub"
          small
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
        >
          Sau
          <Icon name="chevronRight" className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
