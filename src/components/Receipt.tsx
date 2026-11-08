import { cx } from "@/lib/format";

/**
 * Illustrated paper receipt (placeholder for the user's photo).
 * `scale` sets the line heights: sm (thumbnail), md (processing), lg (camera / crop / viewer).
 */
export function ReceiptPaper({
  scale = "lg",
  className,
  style,
  lines = 5,
  footer = true,
  subtotal = true,
}: {
  scale?: "md" | "lg" | "xl";
  className?: string;
  style?: React.CSSProperties;
  lines?: number;
  footer?: boolean;
  subtotal?: boolean;
}) {
  const s = { md: { t: 8, l: 5, b: 7, gap: 7 }, lg: { t: 10, l: 6, b: 9, gap: 9 }, xl: { t: 12, l: 7, b: 11, gap: 11 } }[scale];
  const widths = [48, 56, 40, 52, 44].slice(0, lines);
  return (
    <div className={cx("box-border flex flex-col bg-paper", className)} style={{ gap: s.gap, ...style }} aria-hidden="true">
      <div className="self-center rounded-[2px] bg-[#3A3A3A]" style={{ height: s.t, width: "60%" }} />
      <div className="self-center rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "75%" }} />
      {scale !== "md" && <div className="mb-2 self-center rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "50%" }} />}
      <div className={cx("border-t-2 border-dashed border-[#B5B1AA]", scale === "md" && "mt-1.5")} />
      {widths.map((w, i) => (
        <div key={i} className="flex justify-between">
          <div className="rounded-[2px] bg-[#6E6B66]" style={{ height: s.l, width: `${w}%` }} />
          <div className="rounded-[2px] bg-[#6E6B66]" style={{ height: s.l, width: "22%" }} />
        </div>
      ))}
      <div className="mt-1.5 border-t-2 border-dashed border-[#B5B1AA]" />
      <div className="flex justify-between">
        <div className="rounded-[2px] bg-[#2A2A2A]" style={{ height: s.b, width: "30%" }} />
        <div className="rounded-[2px] bg-[#2A2A2A]" style={{ height: s.b, width: "34%" }} />
      </div>
      {subtotal && scale !== "md" && (
        <div className="flex justify-between">
          <div className="rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "26%" }} />
          <div className="rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "30%" }} />
        </div>
      )}
      {footer && scale !== "md" && (
        <>
          <div className="flex-1" />
          <div className="self-center rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "64%" }} />
          <div className="self-center rounded-[2px] bg-[#9A9792]" style={{ height: s.l, width: "40%" }} />
        </>
      )}
    </div>
  );
}

/** Tiny receipt thumbnail (review / edit headers). */
export function ReceiptThumb({ large = false }: { large?: boolean }) {
  return (
    <span
      className={cx(
        "box-border flex flex-none flex-col gap-1 rounded-md bg-paper",
        large ? "h-[68px] w-[52px] px-[7px] py-2" : "h-[58px] w-11 px-1.5 py-[7px]",
      )}
      aria-hidden="true"
    >
      <span className="block h-1 w-[70%] self-center bg-[#3A3A3A]" />
      <span className="block h-[3px] w-full bg-[#9A9792]" />
      <span className="block h-[3px] w-full bg-[#9A9792]" />
      <span className="block h-[3px] w-[80%] bg-[#9A9792]" />
      {large && <span className="block h-[3px] w-full bg-[#9A9792]" />}
      <span className="mt-0.5 block h-1 w-[60%] self-end bg-[#2A2A2A]" />
    </span>
  );
}
