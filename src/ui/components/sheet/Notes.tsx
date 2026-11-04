import { useSheet } from "./hooks";

export function LongText({ field, label }: { field: "advantages" | "disadvantages" | "notes"; label: string }) {
  const { c, edit, set } = useSheet("notes");
  return edit ? (
    <label className="field"><span className="label">{label}</span><textarea className="in" value={c[field]} onChange={(e) => set([field], e.target.value)} /></label>
  ) : (
    <div><div className="label">{label}</div><div className="prose">{c[field] || "—"}</div></div>
  );
}
