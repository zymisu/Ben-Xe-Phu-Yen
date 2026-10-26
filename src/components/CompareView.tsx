/**
 * Chi tiết một bản ghi theo nhóm, có thể đặt cạnh bản yêu cầu cập nhật để so sánh.
 */
import { cx } from "./ui";

export interface Group<K extends string> {
  title: string;
  rows: { key: K; label: string }[];
}

/**
 * Chi tiết một bản ghi theo nhóm; truyền `request` để đặt cạnh bản yêu cầu
 * cập nhật, các mục thay đổi được tô nổi.
 */
export function CompareView<T, K extends string>({
  groups,
  current,
  request,
  show,
}: {
  groups: Group<K>[];
  current: T;
  request?: T;
  show: (info: T, key: K) => string;
}) {
  const changed = new Set<K>();
  if (request) {
    for (const g of groups)
      for (const r of g.rows)
        if (show(current, r.key) !== show(request, r.key)) changed.add(r.key);
  }

  return (
    <div className="space-y-6">
      {request && (
        <p className="text-sm text-muted">
          {changed.size === 0
            ? "Yêu cầu cập nhật không thay đổi nội dung nào so với bản hiện tại."
            : `Yêu cầu cập nhật thay đổi ${changed.size} mục, được tô nổi bên dưới.`}
        </p>
      )}
      {groups.map((g) => (
        <section key={g.title}>
          <h3 className="text-xs font-bold tracking-wide text-muted uppercase">
            {g.title}
          </h3>
          {request && (
            <div className="mt-2 hidden grid-cols-[180px_1fr_1fr] gap-3 text-[11px] font-semibold text-muted uppercase sm:grid">
              <span />
              <span>Hiện tại</span>
              <span>Yêu cầu cập nhật</span>
            </div>
          )}
          <dl className="mt-1 divide-y divide-line">
            {g.rows.map((r) => {
              const isChanged = changed.has(r.key);
              return (
                <div
                  key={r.key}
                  className={cx(
                    "py-2.5",
                    request
                      ? "grid gap-1 sm:grid-cols-[180px_1fr_1fr] sm:gap-3"
                      : "flex flex-col gap-0.5 sm:flex-row sm:gap-4",
                    isChanged && "-mx-2 rounded-lg bg-warn-soft px-2",
                  )}
                >
                  <dt
                    className={cx(
                      "text-xs text-muted",
                      !request && "shrink-0 sm:w-56 sm:pt-0.5",
                    )}
                  >
                    {r.label}
                  </dt>
                  <dd className="text-sm font-medium break-words whitespace-pre-line text-ink">
                    {request && (
                      <span className="mr-1 text-[11px] font-normal text-muted sm:hidden">
                        Hiện tại:
                      </span>
                    )}
                    {show(current, r.key) || "-"}
                  </dd>
                  {request && (
                    <dd
                      className={cx(
                        "text-sm font-medium break-words whitespace-pre-line",
                        isChanged ? "font-bold text-warn" : "text-ink",
                      )}
                    >
                      <span className="mr-1 text-[11px] font-normal text-muted sm:hidden">
                        Yêu cầu:
                      </span>
                      {show(request, r.key) || "-"}
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </div>
  );
}
