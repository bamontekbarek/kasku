"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { Sheet, SheetHeader } from "@/components/Sheet";
import { Badge, Button, ChevronRight, Dot, TopBar, labelClass } from "@/components/ui";
import { categories as initial, categoryPalette, type Category } from "@/lib/data";
import { cx } from "@/lib/format";

type Editing = { index: number | "new"; name: string; color: string };

export function CategoriesManager() {
  const [cats, setCats] = useState<Category[]>(initial);
  const [editing, setEditing] = useState<Editing | null>(null);

  const isNew = editing?.index === "new";
  const current = editing && editing.index !== "new" ? cats[editing.index] : null;

  const save = () => {
    if (!editing || !editing.name.trim()) return;
    const name = editing.name.trim();
    // TODO: persist to Supabase
    if (editing.index === "new") {
      const lainnya = cats.length - 1; // keep "Lainnya" last
      setCats([...cats.slice(0, lainnya), { name, short: name, color: editing.color, monthCount: 0 }, cats[lainnya]]);
    } else {
      const i = editing.index;
      setCats(cats.map((c, j) => (j === i ? { ...c, name, color: editing.color } : c)));
    }
    setEditing(null);
  };

  const remove = () => {
    if (!current || editing?.index === "new" || editing == null) return;
    setCats(cats.filter((_, j) => j !== editing.index));
    setEditing(null);
  };

  const openNew = () => setEditing({ index: "new", name: "", color: "#4C8DF6" });

  return (
    <div className="pt-safe min-h-dvh bg-bg pb-10">
      <TopBar
        title="Kelola Kategori"
        back="/settings"
        right={
          <button type="button" onClick={openNew} aria-label="Tambah kategori" className="flex size-11 items-center justify-center border-0 bg-transparent text-accent">
            <Icon name="plus" size={24} strokeWidth={2} />
          </button>
        }
      />

      <div className="flex flex-col gap-3.5 px-4 pt-3">
        <p className="m-0 text-sm leading-5 text-muted">Kategori dipakai untuk form, saran AI saat scan struk, dan anggaran.</p>

        <ul className="m-0 list-none rounded-[14px] bg-card px-3.5 py-0">
          {cats.map((c, i) => (
            <li key={c.name} className={i < cats.length - 1 ? "border-b border-surface" : undefined}>
              <button
                type="button"
                onClick={() => setEditing({ index: i, name: c.name, color: c.color })}
                className="flex min-h-16 w-full items-center gap-3 border-0 bg-transparent p-0 text-left text-fg"
              >
                <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface">
                  <Dot color={c.color} size={12} radius={4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[15px] font-medium">
                    {c.name}
                    {c.locked && <Badge tone="neutral" size="xs">Bawaan</Badge>}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">{c.monthCount} transaksi bulan ini</span>
                </span>
                <ChevronRight />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={openNew}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] border border-dashed border-edge bg-transparent text-[15px] font-semibold text-fg"
        >
          <Icon name="plus" size={18} strokeWidth={2.2} className="text-accent" />
          Tambah kategori
        </button>
      </div>

      {editing && (
        <Sheet labelledBy="sheet-h" onClose={() => setEditing(null)}>
          <SheetHeader id="sheet-h" title={isNew ? "Kategori baru" : "Edit kategori"} onClose={() => setEditing(null)} />

          <div className="flex items-center gap-3 rounded-xl bg-bg p-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-[10px] bg-surface">
              <Dot color={editing.color} size={14} radius={4} />
            </span>
            <span className="text-[15px] font-medium">{editing.name || "Nama kategori"}</span>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="cat-name" className={labelClass}>Nama kategori</label>
            <input
              id="cat-name"
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Contoh: Pendidikan"
              maxLength={24}
              disabled={current?.locked}
              className="box-border h-[50px] rounded-[10px] border border-raised bg-bg px-3.5 text-base text-fg outline-none placeholder:text-muted focus:border-accent disabled:text-muted"
            />
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-medium text-fg-2">Warna</legend>
            <div className="grid grid-cols-8 gap-2">
              {categoryPalette.map(([c, label]) => {
                const on = editing.color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    aria-label={label}
                    aria-pressed={on}
                    className={cx("h-9 rounded-[10px] border-2", on ? "border-fg" : "border-transparent")}
                    style={{ background: c }}
                  />
                );
              })}
            </div>
          </fieldset>

          {current && !current.locked && (
            <div className="flex flex-col gap-1">
              <button type="button" onClick={remove} className="h-11 rounded-[10px] border-0 bg-danger-soft text-[15px] font-semibold text-danger">
                Hapus kategori
              </button>
              <span className="text-center text-xs text-muted">{current.monthCount} transaksi di kategori ini akan dipindah ke &quot;Lainnya&quot;.</span>
            </div>
          )}

          <Button onClick={save} disabled={!editing.name.trim()}>
            {isNew ? "Tambah kategori" : "Simpan perubahan"}
          </Button>
        </Sheet>
      )}
    </div>
  );
}
