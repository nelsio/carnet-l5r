import { useState, type ReactNode } from "react";
import {
  attackTrait, computePool, formatDice, isRanged, rings, ROLL_TRAITS,
  type Character, type RollTrait, type TraitKey,
} from "@carnet/core";
import { RINGS, TRAIT_LABELS, type RingKey } from "../../rules/l5r4e";
import { decimal } from "../format";
import { effectiveManeuvers } from "../rolls";
import { useCharacter, useStore, type ListKey } from "../store";
import { FileActions } from "./FileActions";
import { ListField, NumberField } from "./fields";

const CLAN_SUGGESTIONS = ["Crabe", "Grue", "Dragon", "Licorne", "Lion", "Mante", "Phénix", "Scorpion", "Araignée", "Impérial"];
const RING_ORDER: RingKey[] = ["earth", "water", "fire", "air", "void"];

type Setter = (path: (string | number)[], value: unknown) => void;

function useSheet() {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const set: Setter = (path, value) => dispatch({ type: "set", path, value });
  return { c, edit: state.ui.edit, dispatch, set };
}

const pool = (c: Character, trait: RollTrait, skill: string) => {
  const p = computePool(c, { kind: "skill", skill, trait }, {});
  return formatDice(p.rolled, p.kept);
};

export function Sheet() {
  const { edit, dispatch } = useSheet();
  const { state, library } = useStore();
  const readonly = state.mode === "readonly";
  return (
    <div className="grid">
      {readonly && (
        <p className="hint" style={{ margin: 0 }}>
          Fiche en consultation : lecture seule. Le lanceur reste utilisable mais ne dépense rien.
        </p>
      )}
      <div className="panel">
        <div className="panel-head">
          <h2>Anneaux &amp; Traits</h2>
          {readonly ? (
            <button type="button" className="btn" onClick={() => void library.makeEditableCopy()}>Rendre modifiable</button>
          ) : (
            <button type="button" className={`btn${edit ? " gold" : ""}`} onClick={() => dispatch({ type: "toggleEdit" })}>
              {edit ? "Terminer" : "Modifier la fiche"}
            </button>
          )}
        </div>
        <Rings />
      </div>
      <div className="panel"><h2>Identité &amp; réputation</h2><Identity /></div>
      <div className="grid cols-2">
        <div className="panel"><h2>Compétences</h2><Skills /></div>
        <div className="grid">
          <div className="panel"><h2>Armes</h2><Weapons /></div>
          <div className="panel"><h2>Techniques d'école</h2><Techniques /></div>
          <div className="panel"><h2>Manœuvres</h2><Maneuvers /></div>
        </div>
      </div>
      <div className="panel">
        <h2>Avantages, désavantages, notes</h2>
        <div className="grid cols-2">
          <LongText field="advantages" label="Avantages" />
          <LongText field="disadvantages" label="Désavantages" />
        </div>
        <div style={{ marginTop: 14 }}><LongText field="notes" label="Notes de campagne" /></div>
      </div>
      <FileActions />
      {edit && <DeleteCharacter />}
    </div>
  );
}

function Rings() {
  const { c, edit, set } = useSheet();
  const r = rings(c);
  const value = (path: (string | number)[], v: number, label: string) =>
    edit
      ? <NumberField style={{ width: 56 }} min={1} max={10} value={v} aria-label={label} onChange={(n) => set(path, n)} />
      : <b className="mono">{v}</b>;

  return (
    <div className="rings">
      {RING_ORDER.map((key) => (
        <div key={key} className={`ring ${key}`} style={{ ["--rc" as string]: `var(--${key})` }}>
          <div className="rn">{RINGS[key].label}</div>
          <div className="rv">{r[key]}</div>
          {key === "void" ? (
            <>
              <div className="tr"><span>Anneau</span>{value(["voidRing"], c.voidRing, "Anneau de Vide")}</div>
              <div className="tr"><span>Augm. max</span><b className="mono">{c.voidRing}</b></div>
            </>
          ) : (
            RINGS[key].traits.map((t: TraitKey) => (
              <div key={t} className="tr"><span>{TRAIT_LABELS[t]}</span>{value(["traits", t], c.traits[t], TRAIT_LABELS[t])}</div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span className="label">{label}</span>{children}</label>;
}

function Identity() {
  const { c, edit, set } = useSheet();
  const text = (path: string[], value: string, extra?: { list?: string; maxLength?: number }) => (
    <input className="in" type="text" value={value} maxLength={extra?.maxLength ?? 80} list={extra?.list} onChange={(e) => set(path, e.target.value)} />
  );
  const num = (path: string[], value: number, min: number, max?: number, step = 1) => (
    <NumberField min={min} max={max} step={step} value={value} onChange={(n) => set(path, n)} />
  );

  if (edit) {
    return (
      <div className="form-grid">
        <Field label="Nom">{text(["name"], c.name)}</Field>
        <Field label="Clan">
          {text(["clan"], c.clan, { list: "clan-list" })}
          <datalist id="clan-list">{CLAN_SUGGESTIONS.map((n) => <option key={n} value={n} />)}</datalist>
        </Field>
        <Field label="Famille">{text(["family"], c.family)}</Field>
        <Field label="École">{text(["school"], c.school, { maxLength: 120 })}</Field>
        <Field label="Rang (Insight)">{num(["insightRank"], c.insightRank, 1, 10)}</Field>
        <Field label="Honneur">{num(["honor"], c.honor, 0, 10, 0.1)}</Field>
        <Field label="Gloire">{num(["glory"], c.glory, 0, 10, 0.1)}</Field>
        <Field label="Statut">{num(["status"], c.status, 0, 10, 0.1)}</Field>
        <Field label="XP total">{num(["xp", "total"], c.xp.total, 0)}</Field>
        <Field label="XP dépensée">{num(["xp", "spent"], c.xp.spent, 0)}</Field>
        <Field label="Armure">{text(["armor", "name"], c.armor.name)}</Field>
        <Field label="Bonus d'armure (ND)">{num(["armor", "bonus"], c.armor.bonus, 0)}</Field>
        <Field label="Réduction de dégâts">{num(["armor", "reduction"], c.armor.reduction, 0)}</Field>
      </div>
    );
  }
  const init = computePool(c, { kind: "initiative" }, {});
  return (
    <div className="kv">
      <div><span className="label">Honneur</span><b>{decimal(c.honor)}</b></div>
      <div><span className="label">Gloire</span><b>{decimal(c.glory)}</b></div>
      <div><span className="label">Statut</span><b>{decimal(c.status)}</b></div>
      <div><span className="label">XP libre</span><b>{c.xp.total - c.xp.spent}</b></div>
      <div>
        <span className="label">Armure</span>
        <b style={{ fontSize: 15 }}>{c.armor.name || "—"} <span className="muted">ND +{c.armor.bonus} · réd. {c.armor.reduction}</span></b>
      </div>
      <div><span className="label">Initiative</span><b>{formatDice(init.rolled, init.kept)}</b></div>
    </div>
  );
}

function AddButton({ list, label, item }: { list: ListKey; label: string; item: () => unknown }) {
  const { dispatch } = useStore();
  return <button type="button" className="btn sm" onClick={() => dispatch({ type: "add", list, item: item() })}>{label}</button>;
}

function RemoveButton({ list, index, name }: { list: ListKey; index: number; name: string }) {
  const { dispatch } = useStore();
  return (
    <button type="button" className="x" aria-label={`Supprimer ${name || "la ligne"}`} onClick={() => dispatch({ type: "remove", list, index })}>×</button>
  );
}

function Skills() {
  const { c, edit, set } = useSheet();
  if (edit) {
    return (
      <>
        <div className="tbl">
          <table>
            <thead><tr><th>Compétence</th><th>Rang</th><th>Trait</th><th>Spécialisations</th><th /></tr></thead>
            <tbody>
              {c.skills.map((s, i) => (
                <tr key={i}>
                  <td><input className="in" type="text" aria-label="Nom de la compétence" value={s.name} maxLength={80} onChange={(e) => set(["skills", i, "name"], e.target.value)} /></td>
                  <td style={{ width: 70 }}><NumberField aria-label={`Rang de ${s.name}`} min={0} max={10} value={s.rank} onChange={(n) => set(["skills", i, "rank"], n)} /></td>
                  <td style={{ width: 140 }}>
                    <select className="in" aria-label={`Trait de ${s.name}`} value={s.trait} onChange={(e) => set(["skills", i, "trait"], e.target.value)}>
                      {ROLL_TRAITS.map((t) => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
                    </select>
                  </td>
                  <td><ListField aria-label={`Spécialisations de ${s.name}`} placeholder="ex. Fouille, Remarquer" value={s.emphases} onChange={(v) => set(["skills", i, "emphases"], v)} /></td>
                  <td><RemoveButton list="skills" index={i} name={s.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="skills" label="+ Compétence" item={() => ({ name: "", rank: 1, trait: "agility", emphases: [] })} />
      </>
    );
  }
  const sorted = [...c.skills].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Compétence</th><th>Rang</th><th>Trait</th><th>Jet</th></tr></thead>
        <tbody>
          {sorted.length ? sorted.map((s) => (
            <tr key={s.name}>
              <td>
                <b>{s.name}</b>
                {s.emphases.length > 0 && <div>{s.emphases.map((e) => <span key={e} className="tag">{e}</span>)}</div>}
              </td>
              <td className="mono">{s.rank}</td>
              <td className="muted">{TRAIT_LABELS[s.trait]}</td>
              <td className="pool" data-testid={`skill-pool-${s.name}`}>{pool(c, s.trait, s.name)}</td>
            </tr>
          )) : (
            <tr><td colSpan={4} className="muted">Aucune compétence. Passe en mode modification pour en ajouter.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Weapons() {
  const { c, edit, set } = useSheet();
  if (edit) {
    return (
      <>
        <div className="tbl">
          <table>
            <thead><tr><th>Arme</th><th>Compétence</th><th>VD</th><th>Force arc</th><th /></tr></thead>
            <tbody>
              {c.weapons.map((w, i) => (
                <tr key={i}>
                  <td><input className="in" type="text" aria-label="Nom de l'arme" value={w.name} maxLength={80} onChange={(e) => set(["weapons", i, "name"], e.target.value)} /></td>
                  <td><input className="in" type="text" aria-label={`Compétence de ${w.name}`} value={w.skill} maxLength={80} onChange={(e) => set(["weapons", i, "skill"], e.target.value)} /></td>
                  <td style={{ width: 80 }}><input className="in" type="text" aria-label={`VD de ${w.name}`} placeholder="3g2" value={w.dr} onChange={(e) => set(["weapons", i, "dr"], e.target.value)} /></td>
                  <td style={{ width: 70 }}>
                    <OptionalNumber value={w.bowStrength} aria-label={`Force de l'arc ${w.name}`} onChange={(n) => set(["weapons", i, "bowStrength"], n)} />
                  </td>
                  <td><RemoveButton list="weapons" index={i} name={w.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="weapons" label="+ Arme" item={() => ({ name: "", skill: "Kenjutsu", dr: "3g2" })} />
      </>
    );
  }
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Arme</th><th>Attaque</th><th>Dégâts</th></tr></thead>
        <tbody>
          {c.weapons.length ? c.weapons.map((w, i) => {
            const atk = computePool(c, { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true }, {});
            const dmg = computePool(c, { kind: "damage", weapon: w }, {});
            return (
              <tr key={i}>
                <td>
                  <b>{w.name}</b>
                  <div className="muted" style={{ fontSize: 12.5 }}>{w.skill} · VD {w.dr}{isRanged(w) ? ` · arc ${w.bowStrength ?? 0}` : ""}</div>
                </td>
                <td className="pool">{formatDice(atk.rolled, atk.kept)}</td>
                <td className="pool">{formatDice(dmg.rolled, dmg.kept)}</td>
              </tr>
            );
          }) : <tr><td colSpan={3} className="muted">Aucune arme.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/** Nombre facultatif : vide = absent. */
function OptionalNumber({ value, onChange, ...rest }: { value: number | undefined; onChange: (n: number | undefined) => void; "aria-label": string }) {
  return (
    <input
      {...rest} className="in" type="number" min={0} max={10} placeholder="—"
      value={value ?? ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (e.target.value === "") onChange(undefined);
        else if (Number.isInteger(n) && n >= 0 && n <= 10) onChange(n);
      }}
    />
  );
}

function Techniques() {
  const { c, edit, set } = useSheet();
  if (edit) {
    return (
      <>
        {c.techniques.map((t, i) => (
          <div key={i} className="field" style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="in" type="text" aria-label="Nom de la technique" placeholder="Nom de la technique" value={t.name} maxLength={120} onChange={(e) => set(["techniques", i, "name"], e.target.value)} />
              <RemoveButton list="techniques" index={i} name={t.name} />
            </div>
            <textarea className="in" aria-label={`Effet de ${t.name}`} placeholder="Effet" value={t.text} onChange={(e) => set(["techniques", i, "text"], e.target.value)} />
          </div>
        ))}
        <AddButton list="techniques" label="+ Technique / sort / kata" item={() => ({ name: "", text: "" })} />
      </>
    );
  }
  return c.techniques.length
    ? <>{c.techniques.map((t, i) => <div key={i} className="tech"><b>{t.name}</b><div className="prose muted">{t.text}</div></div>)}</>
    : <p className="muted">Aucune technique notée.</p>;
}

function Maneuvers() {
  const { c, edit, set } = useSheet();
  if (edit) {
    return (
      <>
        <p className="hint" style={{ marginTop: 0 }}>Ajuste les coûts à ton livre ou aux règles de ta table. « Cumulable » : on peut la prendre plusieurs fois.</p>
        <div className="tbl">
          <table>
            <thead><tr><th>Manœuvre</th><th>Coût</th><th>Cumul.</th><th /></tr></thead>
            <tbody>
              {c.maneuvers.map((m, i) => (
                <tr key={m.id}>
                  <td>
                    <input className="in" type="text" aria-label="Nom de la manœuvre" value={m.name} maxLength={80} onChange={(e) => set(["maneuvers", i, "name"], e.target.value)} />
                    <textarea className="in" style={{ minHeight: 44, marginTop: 4 }} aria-label={`Effet de ${m.name}`} placeholder="Effet" value={m.effect} onChange={(e) => set(["maneuvers", i, "effect"], e.target.value)} />
                  </td>
                  <td style={{ width: 64 }}><NumberField aria-label={`Coût de ${m.name}`} min={0} max={10} value={m.cost} onChange={(n) => set(["maneuvers", i, "cost"], n)} /></td>
                  <td style={{ width: 50 }}><input type="checkbox" aria-label={`${m.name} cumulable`} checked={m.stackable} onChange={(e) => set(["maneuvers", i, "stackable"], e.target.checked)} /></td>
                  <td><RemoveButton list="maneuvers" index={i} name={m.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="maneuvers" label="+ Manœuvre" item={() => ({ id: `m-${crypto.randomUUID()}`, name: "", cost: 1, effect: "", stackable: false })} />
      </>
    );
  }
  return (
    <div className="tbl">
      <table>
        <tbody>
          {effectiveManeuvers(c).map((m) => (
            <tr key={m.id}>
              <td><b>{m.name}</b><div className="muted" style={{ fontSize: 12.5 }}>{m.effect}</div></td>
              <td className="pool" style={{ whiteSpace: "nowrap" }}>{m.cost} augm.{m.stackable ? " / fois" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LongText({ field, label }: { field: "advantages" | "disadvantages" | "notes"; label: string }) {
  const { c, edit, set } = useSheet();
  return edit ? (
    <label className="field"><span className="label">{label}</span><textarea className="in" value={c[field]} onChange={(e) => set([field], e.target.value)} /></label>
  ) : (
    <div><div className="label">{label}</div><div className="prose">{c[field] || "—"}</div></div>
  );
}

function DeleteCharacter() {
  const { state, library } = useStore();
  const [confirm, setConfirm] = useState(false);
  return (
    <p>
      <button type="button" className="btn" onClick={() => setConfirm(true)}>Supprimer ce personnage…</button>{" "}
      {confirm && (
        <button type="button" className="btn" style={{ color: "var(--bad)" }} onClick={() => state.entryId && void library.remove(state.entryId)}>
          Confirmer la suppression
        </button>
      )}
    </p>
  );
}
