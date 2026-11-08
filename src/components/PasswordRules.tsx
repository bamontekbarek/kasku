import { Icon } from "./Icon";

export type Rule = { label: string; ok: boolean };

export function passwordRules(p: string): Rule[] {
  return [
    { label: "Minimal 8 karakter", ok: p.length >= 8 },
    { label: "Huruf besar dan kecil", ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
    { label: "Mengandung angka", ok: /\d/.test(p) },
  ];
}

/** Checklist of password requirements (green check when met). */
export function PasswordRules({ rules }: { rules: Rule[] }) {
  return (
    <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0" aria-label="Syarat kata sandi">
      {rules.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-[13px]">
          {r.ok ? (
            <Icon name="check" size={16} strokeWidth={2.6} className="text-success" />
          ) : (
            <Icon name="circle" size={16} strokeWidth={2} className="text-muted" />
          )}
          <span className={r.ok ? "text-fg-2" : "text-muted"}>
            {r.label}
            <span className="sr-only">{r.ok ? " (terpenuhi)" : " (belum)"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
