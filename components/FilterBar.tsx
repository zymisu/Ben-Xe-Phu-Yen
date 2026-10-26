"use client";

/**
 * Thanh lọc theo trạng thái kèm ô tra cứu.
 */
import { Icon } from "./Icon";
import { cx, O } from "./ui";

export interface Tab<K extends string> {
  key: K;
  label: string;
}

/** Bộ lọc theo trạng thái và ô tra cứu nằm cùng một hàng */
export function FilterBar<K extends string>({
  tabs,
  value,
  counts,
  onChange,
  query,
  onQuery,
  placeholder,
}: {
  tabs: Tab<K>[];
  value: K;
  counts: Record<K, number>;
  onChange: (k: K) => void;
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div
        role="tablist"
        aria-label="Lọc theo trạng thái"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:pb-0"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={cx(
              "cham-duoc shrink-0 rounded-xl border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors",
              value === t.key
                ? "border-transparent bg-brand text-brand-ink"
                : "border-line bg-card text-muted hover:text-ink",
            )}
          >
            {t.label}
            <span className="tnum ml-1.5 opacity-70">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="relative lg:ml-auto lg:w-72">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
        />
        <O
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="bg-card pl-9"
        />
      </div>
    </div>
  );
}
