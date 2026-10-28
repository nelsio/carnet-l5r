import { useState, type ReactNode } from "react";
import {
  activeEffects, affinityOf, armorSheet, attackTrait, catalogGap, catalogWeapon, createSpell, dailyHealing, deficiencyOf, isShugenja, reminderText, computePool, defaultModifiers, isRanged, parseDR, parseWeaponKeywords, rings, ROLL_TRAITS, schoolOf,
  findSchool, schoolRankOf, schoolsByClan, sortSpells, SPELL_ELEMENTS, SPELL_RINGS, spellcastingOf, spellRaises, spellTn, suggestSchool, techniqueCategories, vocabularyChanges, weaponKeywords,
  type ArmorPart, type Character, type PoolAction, type RollTrait, type TraitKey, type VocabularyChange,
} from "@carnet/core";
import { WEAPON_KEYWORD_LABELS } from "../../rules/ecoles";
import { ELEMENT_LABELS, RINGS, SPELL_KEYWORDS, TRAIT_LABELS, UNIVERSAL_SPELLS, type RingKey } from "../../rules/l5r4e";
import { decimal } from "../format";
import { poolLabel } from "../rolls";
import { useCharacter, useStore, type BlockId, type ListKey } from "../store";
import { ArmorFields } from "./ArmorCatalog";
import { FileActions } from "./FileActions";
import { Modifiers } from "./Modifiers";
import { ListField, NumberField, TextListField } from "./fields";

const CLAN_SUGGESTIONS = ["Crabe", "Grue", "Dragon", "Licorne", "Lion", "Mante", "Phénix", "Scorpion", "Araignée", "Impérial"];
const RING_ORDER: RingKey[] = ["earth", "water", "fire", "air", "void"];

type Setter = (path: (string | number)[], value: unknown) => void;

function useSheet(block?: BlockId) {
  const { state, dispatch } = useStore();
  const c = useCharacter();
  const set: Setter = (path, value) => dispatch({ type: "set", path, value });
  return { c, edit: !!block && state.mode === "edit" && state.ui.editing.has(block), dispatch, set };
}

/** Réserve affichée sur la fiche : bonus et techniques d'office, posture Attaque (annexe C.4). */
const poolOf = (c: Character, action: PoolAction) => computePool(c, action, { modifiers: defaultModifiers(c, action) });

const pool = (c: Character, trait: RollTrait, skill: string) => poolLabel(poolOf(c, { kind: "skill", skill, trait }));

export function Sheet() {
  const { state, library } = useStore();
  const c = useCharacter();
  const readonly = state.mode === "readonly";
  return (
    <div className="grid">
      {readonly && (
        <div className="readonly-head">
          <p className="hint" style={{ margin: 0 }}>
            Fiche en consultation : lecture seule. Le lanceur reste utilisable mais ne dépense rien.
          </p>
          <button type="button" className="btn" onClick={() => void library.makeEditableCopy()}>Rendre modifiable</button>
        </div>
      )}
      {!readonly && <VocabularyBanner />}
      {!readonly && <NewDay />}
      <Block id="rings" title={<>Anneaux &amp; Traits</>} label="Anneaux & Traits"><Rings /></Block>
      <Block id="identity" title={<>Identité &amp; réputation</>} label="Identité & réputation"><Identity /></Block>
      <div className="grid cols-2">
        <Block id="skills" title="Compétences"><Skills /></Block>
        <div className="grid">
          <Block id="weapons" title="Armes"><Weapons /></Block>
          <Block id="armor" title="Armure"><Armor /></Block>
          <Block id="techniques" title="Techniques d'école"><Techniques /></Block>
          {(isShugenja(c) || state.ui.editing.has("magic")) && (
            <Block id="magic" title={<>Rouleaux &amp; invocations</>} label="Rouleaux & invocations"><Spells /></Block>
          )}
          <Block id="modifiers" title="Bonus de jet"><Modifiers /></Block>
        </div>
      </div>
      <Block id="notes" title="Avantages, désavantages, notes">
        <div className="grid cols-2">
          <LongText field="advantages" label="Avantages" />
          <LongText field="disadvantages" label="Désavantages" />
        </div>
        <div style={{ marginTop: 14 }}><LongText field="notes" label="Notes de campagne" /></div>
      </Block>
      <FileActions />
    </div>
  );
}

/**
 * Bloc de la fiche avec son bouton « Edit » (« Terminer » pendant l'édition), annexe E.9 S2.
 * Plusieurs blocs peuvent être ouverts ensemble ; aucun bouton en consultation.
 */
function Block({ id, title, label, children }: { id: BlockId; title: ReactNode; label?: string; children: ReactNode }) {
  const { state, dispatch } = useStore();
  const edit = state.ui.editing.has(id);
  const name = label ?? (typeof title === "string" ? title : id);
  return (
    <section className={`panel${edit ? " editing" : ""}`} aria-label={name} data-testid={`block-${id}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {state.mode === "edit" && (
          <button
            type="button" className={`btn sm${edit ? " gold" : ""}`} aria-pressed={edit}
            aria-label={`${edit ? "Terminer" : "Edit"} : ${name}`}
            onClick={() => dispatch({ type: "toggleBlockEdit", block: id })}
          >{edit ? "Terminer" : "Edit"}</button>
        )}
      </div>
      {children}
    </section>
  );
}

function Rings() {
  const { c, edit, set } = useSheet("rings");
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
  const { c, edit, set } = useSheet("identity");
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
        <Field label="École (nom affiché)">{text(["school"], c.school, { maxLength: 120 })}</Field>
        <Field label="Techniques d'école">
          <select className="in" value={c.schoolId ?? ""} onChange={(e) => chooseSchool(set, e.target.value)}>
            <option value="">— Aucune (techniques libres)</option>
            {schoolsByClan().map((g) => (
              <optgroup key={g.clan} label={g.clan}>
                {g.schools.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        {spellcastingOf(c)?.affinity === "choice" && (
          <Field label="Affinité (shugenja)">
            <select className="in" value={c.affinity ?? ""} onChange={(e) => set(["affinity"], e.target.value || undefined)}>
              <option value="">— à choisir</option>
              {SPELL_RINGS.map((r) => <option key={r} value={r}>{ELEMENT_LABELS[r]}</option>)}
            </select>
          </Field>
        )}
        <Field label="Rang d'école">
          <OptionalNumber
            min={1} value={c.schoolRank ?? undefined} placeholder={`= Insight (${c.insightRank})`} aria-label="Rang d'école"
            onChange={(n) => set(["schoolRank"], n ?? null)}
          />
        </Field>
        <Field label="Rang (Insight)">{num(["insightRank"], c.insightRank, 1, 10)}</Field>
        <Field label="Honneur">{num(["honor"], c.honor, 0, 10, 0.1)}</Field>
        <Field label="Gloire">{num(["glory"], c.glory, 0, 10, 0.1)}</Field>
        <Field label="Statut">{num(["status"], c.status, 0, 10, 0.1)}</Field>
        <Field label="XP total">{num(["xp", "total"], c.xp.total, 0)}</Field>
        <Field label="XP dépensée">{num(["xp", "spent"], c.xp.spent, 0)}</Field>
        <div style={{ gridColumn: "1/-1" }}><DeleteCharacter /></div>
      </div>
    );
  }
  const init = poolOf(c, { kind: "initiative" });
  return (
    <div className="kv">
      <div><span className="label">Honneur</span><b>{decimal(c.honor)}</b></div>
      <div><span className="label">Gloire</span><b>{decimal(c.glory)}</b></div>
      <div><span className="label">Statut</span><b>{decimal(c.status)}</b></div>
      <div><span className="label">XP libre</span><b>{c.xp.total - c.xp.spent}</b></div>
      <div><span className="label">Initiative</span><b data-testid="sheet-initiative">{poolLabel(init)}</b></div>
    </div>
  );
}

/**
 * Choix des techniques d'école : remplit aussi « École (nom affiché) » avec le nom du catalogue, modifiable ensuite ;
 * « — Aucune » garde le nom saisi (annexe E.19 S9).
 */
function chooseSchool(set: Setter, id: string) {
  set(["schoolId"], id);
  const school = findSchool(id);
  if (school) set(["school"], school.name);
}

/** Bloc « Armure » (annexe E.18) : ND détaillé en posture Attaque, Réduction, règle spéciale ; liste du livre en édition. */
function Armor() {
  const { c, edit } = useSheet("armor");
  if (edit) {
    return (
      <div className="armform">
        <ArmorFields />
        <p className="hint" style={{ gridColumn: "1/-1", margin: 0 }}>
          Choisir une armure du livre remplit nom, bonus et Réduction. Modifier ensuite le bonus ou la Réduction en fait une armure personnalisée.
        </p>
      </div>
    );
  }
  const a = armorSheet(c);
  const plus = (parts: ArmorPart[]) => parts.map((p) => ` + ${p.value} ${p.source}`).join("");
  const rule = a.catalog?.summary;
  return (
    <div className="armblock" data-testid="armor-block">
      <div className="armname">
        <b>{c.armor.name || "Sans armure"}</b>{" "}
        <span className="tag">{a.catalog ? "armure du livre" : "armure personnalisée"}</span>
      </div>
      <div className="armstats">
        <div>
          <span className="label">ND d'armure</span>
          <b data-testid="armor-block-tn">{a.tn.total}</b>
          <span className="muted">
            5 × Réflexes {a.tn.reflexes} + 5 + armure {a.tn.armor}{plus(a.tn.auto)} = {a.tn.total}
            {a.tn.mounted !== undefined && <> ; à cheval {a.tn.mounted}</>}
          </span>
        </div>
        <div>
          <span className="label">Réduction</span>
          <b data-testid="armor-block-reduction">{a.reduction.total}</b>
          <span className="muted">
            armure {a.reduction.armor}{plus(a.reduction.parts)}{a.reduction.parts.length ? ` = ${a.reduction.total}` : ""}
          </span>
        </div>
      </div>
      {rule && (
        <p className="armrule" data-testid="armor-rule">
          <b>Règle spéciale :</b> {rule}
          {a.waiver && <> {a.waiver.source} : ignorée{a.waiver.except.length ? ` sauf ${a.waiver.except.join(", ")}` : ""}.</>}
        </p>
      )}
      {a.optional.length > 0 && <p className="hint">À cocher en combat (panneau Posture) : {a.optional.join(" ; ")}.</p>}
      <p className="hint" style={{ margin: 0 }}>Posture de référence : Attaque.</p>
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
  const { c, edit, set } = useSheet("skills");
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
            <tr><td colSpan={4} className="muted">Aucune compétence. « Edit » pour en ajouter.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Arme saisie différente du livre (VD, mots-clés) : mise à jour proposée, jamais faite d'office (annexe E.2 C8). */
function CatalogGap({ index }: { index: number }) {
  const { c, set } = useSheet();
  const w = c.weapons[index];
  const gap = w && catalogGap(w);
  if (!w || !gap) return null;
  const [own, book] = [parseDR(w.dr), parseDR(gap.dr)];
  const sameKeywords = [...(w.keywords ?? [])].sort().join() === [...gap.keywords].sort().join();
  const parts = [
    own.rolled !== book.rolled || own.kept !== book.kept ? gap.dr : "",
    sameKeywords ? "" : gap.keywords.map((k) => WEAPON_KEYWORD_LABELS[k]).join(", "),
  ].filter(Boolean);
  return (
    <div className="suggest" role="group" aria-label={`Écart avec le livre : ${w.name}`}>
      <span>Le livre indique {parts.join(" · ")} : mettre à jour ?</span>
      <button
        type="button" className="btn sm"
        onClick={() => set(["weapons", index], { ...w, dr: gap.dr, keywords: gap.keywords })}
      >Mettre à jour</button>
    </div>
  );
}

function Weapons() {
  const { c, edit, set } = useSheet("weapons");
  const { state } = useStore();
  if (edit) {
    return (
      <>
        <div className="tbl">
          <table>
            <thead><tr><th>Arme</th><th>Compétence</th><th>VD</th><th>Force arc</th><th>Mots-clés</th><th /></tr></thead>
            <tbody>
              {c.weapons.map((w, i) => (
                <tr key={i}>
                  <td><input className="in" type="text" aria-label="Nom de l'arme" value={w.name} maxLength={80} onChange={(e) => set(["weapons", i, "name"], e.target.value)} /></td>
                  <td><input className="in" type="text" aria-label={`Compétence de ${w.name}`} value={w.skill} maxLength={80} onChange={(e) => set(["weapons", i, "skill"], e.target.value)} /></td>
                  <td style={{ width: 80 }}><input className="in" type="text" aria-label={`VD de ${w.name}`} placeholder="3g2" value={w.dr} onChange={(e) => set(["weapons", i, "dr"], e.target.value)} /></td>
                  <td style={{ width: 70 }}>
                    <OptionalNumber value={w.bowStrength} aria-label={`Force de l'arc ${w.name}`} onChange={(n) => set(["weapons", i, "bowStrength"], n)} />
                  </td>
                  <td style={{ minWidth: 140 }}>
                    <TextListField
                      aria-label={`Mots-clés de ${w.name}`} value={w.keywords ?? []} parse={parseWeaponKeywords}
                      placeholder={catalogWeapon(w.name)?.keywords.join(", ") ?? "samourai, lourde…"}
                      onChange={(v) => set(["weapons", i, "keywords"], v)}
                    />
                  </td>
                  <td><RemoveButton list="weapons" index={i} name={w.name} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddButton list="weapons" label="+ Arme" item={() => ({ name: "", skill: "Kenjutsu", dr: "3g2", keywords: [] })} />
      </>
    );
  }
  return (
    <div className="tbl">
      <table>
        <thead><tr><th>Arme</th><th>Attaque</th><th>Dégâts</th></tr></thead>
        <tbody>
          {c.weapons.length ? c.weapons.map((w, i) => {
            const atk = poolOf(c, { kind: "skill", skill: w.skill, trait: attackTrait(w), attack: true, weapon: w });
            const keywords = [...weaponKeywords(c, w)];
            const dmg = poolOf(c, { kind: "damage", weapon: w });
            return (
              <tr key={i}>
                <td>
                  <b>{w.name}</b>
                  <div className="muted" style={{ fontSize: 12.5 }}>{w.skill} · VD {w.dr}{isRanged(w) ? ` · arc ${w.bowStrength ?? 0}` : ""}</div>
                  {keywords.length > 0 && <div>{keywords.map((k) => <span key={k} className="tag">{WEAPON_KEYWORD_LABELS[k]}</span>)}</div>}
                  {state.mode === "edit" && <CatalogGap index={i} />}
                </td>
                <td className="pool" data-testid={`attack-pool-${w.name}`}>{poolLabel(atk)}</td>
                <td className="pool" data-testid={`damage-pool-${w.name}`}>{poolLabel(dmg)}</td>
              </tr>
            );
          }) : <tr><td colSpan={3} className="muted">Aucune arme.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/** Nombre facultatif : vide = absent. */
function OptionalNumber({ value, onChange, min = 0, placeholder = "—", ...rest }: {
  value: number | undefined; onChange: (n: number | undefined) => void; "aria-label": string; min?: number; placeholder?: string;
}) {
  return (
    <input
      {...rest} className="in" type="number" min={min} max={10} placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (e.target.value === "") onChange(undefined);
        else if (Number.isInteger(n) && n >= min && n <= 10) onChange(n);
      }}
    />
  );
}

function Techniques() {
  const { c, edit, set } = useSheet("techniques");
  const school = <SchoolTechniques />;
  const others = schoolOf(c) && (c.techniques.length > 0 || edit)
    ? <div className="label" style={{ marginTop: 12 }}>Autres techniques, kata, sorts</div>
    : null;
  if (edit) {
    return (
      <>
        {school}
        {others}
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
  return (
    <>
      {school}
      {others}
      {c.techniques.length
        ? c.techniques.map((t, i) => <div key={i} className="tech"><b>{t.name}</b><div className="prose muted">{t.text}</div></div>)
        : !schoolOf(c) && <p className="muted">Aucune technique notée.</p>}
    </>
  );
}

/** École du catalogue : les cinq rangs, résumés et badges ; rangs non atteints grisés (annexe C.5). */
function SchoolTechniques() {
  const { c, edit, set } = useSheet("techniques");
  const { state } = useStore();
  const school = schoolOf(c);
  const suggestion = state.mode === "edit" ? suggestSchool(c) : undefined;
  if (!school) {
    return (
      <>
        {suggestion && (
          <div className="suggest" role="group" aria-label="Suggestion d'école">
            <span>Associer à <b>{suggestion.name}</b> ?</span>
            <button type="button" className="btn sm" onClick={() => chooseSchool(set, suggestion.id)}>Associer</button>
          </div>
        )}
        {edit && <p className="hint" style={{ marginTop: 0 }}>Choisis une école dans « Techniques d'école » (bloc Identité, bouton « Edit ») pour ajouter ses techniques automatiquement.</p>}
      </>
    );
  }
  const rank = schoolRankOf(c);
  // Rappels chiffrés des rangs atteints (« +10 au ND de qui te ment »), annexe D.5.
  const valued = activeEffects(c).filter((e) => e.kind === "reminder" && e.value !== undefined);
  return (
    <div data-testid="school-techniques">
      <div className="schoolhead"><b>{school.name}</b> <span className="muted">· {school.clan} · Rang d'école {rank}</span></div>
      {school.spellcasting && <SpellAffinity page={school.spellcasting.page} />}
      {school.ranks.map((r) => {
        const on = r.rank <= rank;
        return (
          <div key={r.rank} className={`tech${on ? "" : " locked"}`} data-testid={`school-rank-${r.rank}`}>
            <div className="techtop">
              <b>R{r.rank} · {r.name}</b>
              <span>
                {on
                  ? techniqueCategories(r).map((cat) => <span key={cat} className={`badge b-${cat.replace(/\W/g, "")}`}>{cat}</span>)
                  : <span className="badge">rang {r.rank}</span>}
              </span>
            </div>
            <div className="muted">{r.summary}</div>
            {valued.filter((e) => e.rank === r.rank).map((e) => (
              <div key={e.key} className="hint" style={{ color: "var(--gold)" }}>→ {reminderText(e, c)}</div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

const isListedKeyword = (k: string) => (SPELL_KEYWORDS as readonly string[]).includes(k);

/** Section « Rouleaux & invocations » (annexe F.5) : sorts en champs libres, recopiés par le joueur. */
function Spells() {
  const { c, edit, set, dispatch } = useSheet("magic");
  const spells = c.spells ?? [];
  const starting = spellcastingOf(c)?.startingSpells;
  const head = starting && <p className="hint" style={{ marginTop: 0 }} data-testid="starting-spells">Sorts de départ de l'école : {starting}.</p>;
  if (edit) {
    const missing = UNIVERSAL_SPELLS.filter((n) => !spells.some((s) => s.name === n));
    return (
      <>
        {head}
        {spells.map((s, i) => {
          const label = s.name || "ce sort";
          return (
            <div key={s.id} className="spelledit" role="group" aria-label={`Sort : ${label}`}>
              <div className="form-grid">
                <Field label="Nom"><input className="in" type="text" value={s.name} maxLength={120} onChange={(e) => set(["spells", i, "name"], e.target.value)} /></Field>
                <Field label="Élément">
                  <select className="in" value={s.element} onChange={(e) => set(["spells", i, "element"], e.target.value)}>
                    {(["all", ...SPELL_ELEMENTS.filter((x) => x !== "all")] as const).map((x) => <option key={x} value={x}>{ELEMENT_LABELS[x]}</option>)}
                  </select>
                </Field>
                <Field label="Maîtrise"><NumberField min={1} max={6} value={s.mastery} onChange={(n) => set(["spells", i, "mastery"], n)} /></Field>
                <Field label="VD (dégâts)">
                  <input className="in mono" type="text" placeholder="—" value={s.damage ?? ""} maxLength={10} onChange={(e) => set(["spells", i, "damage"], e.target.value || undefined)} />
                </Field>
                <Field label="Portée"><input className="in" type="text" placeholder="Personnel, contact, 30 pieds…" value={s.range} maxLength={80} onChange={(e) => set(["spells", i, "range"], e.target.value)} /></Field>
                <Field label="Zone d'effet"><input className="in" type="text" placeholder="Une cible, rayon de 10 pieds…" value={s.area} maxLength={120} onChange={(e) => set(["spells", i, "area"], e.target.value)} /></Field>
                <Field label="Durée"><input className="in" type="text" placeholder="Instantanée, 5 rounds…" value={s.duration} maxLength={80} onChange={(e) => set(["spells", i, "duration"], e.target.value)} /></Field>
              </div>
              <div className="kwpick" role="group" aria-label={`Mots-clés de ${label}`}>
                <span className="label">Mots-clés</span>
                {SPELL_KEYWORDS.map((k) => {
                  const on = s.keywords.includes(k);
                  return (
                    <button
                      key={k} type="button" aria-pressed={on}
                      onClick={() => set(["spells", i, "keywords"], on ? s.keywords.filter((x) => x !== k) : [...s.keywords, k])}
                    >{k}</button>
                  );
                })}
                <ListField
                  aria-label={`Autres mots-clés de ${label}`} placeholder="autres, séparés par des virgules" style={{ maxWidth: 220 }}
                  value={s.keywords.filter((k) => !isListedKeyword(k))}
                  onChange={(v) => set(["spells", i, "keywords"], [...s.keywords.filter(isListedKeyword), ...v])}
                />
              </div>
              <div className="form-grid wide">
                <Field label="Augmentations (une par ligne)">
                  <textarea className="in" placeholder={"Portée (+10 pieds)\nDurée (+1 round)"} value={s.raises} onChange={(e) => set(["spells", i, "raises"], e.target.value)} />
                </Field>
                <Field label="Effet (résumé)"><textarea className="in" value={s.effect} onChange={(e) => set(["spells", i, "effect"], e.target.value)} /></Field>
              </div>
              <div className="spellfoot">
                <label className="chk">
                  <input type="checkbox" checked={s.memorized} onChange={(e) => set(["spells", i, "memorized"], e.target.checked)} />
                  {" "}Mémorisé <span className="muted">· {s.mastery} XP</span>
                </label>
                <RemoveButton list="spells" index={i} name={s.name} />
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <AddButton list="spells" label="+ Sort" item={() => createSpell()} />
          {missing.length > 0 && (
            <button
              type="button" className="btn sm"
              onClick={() => missing.forEach((n) => dispatch({ type: "add", list: "spells", item: createSpell(n, "all") }))}
            >Ajouter les sorts universels</button>
          )}
        </div>
      </>
    );
  }
  if (!spells.length) return <>{head}<p className="muted">Aucun sort noté. Appuie sur « Edit » pour noter tes rouleaux et invocations.</p></>;
  return (
    <>
      {head}
      <div className="spells">
        {sortSpells(spells).map((s) => {
          const raises = spellRaises(s);
          const line = [s.range && `Portée ${s.range}`, s.area && `Zone ${s.area}`, s.duration && `Durée ${s.duration}`].filter(Boolean).join(" · ");
          return (
            <div key={s.id} className={`spell el-${s.element}`} data-testid={`spell-${s.id}`}>
              <div className="sp1">
                <b>{s.name}</b>
                <span className="tag el">{ELEMENT_LABELS[s.element]}</span>
                <span className="mono muted">Maîtrise {s.mastery} · ND {spellTn(s.mastery)}</span>
                <span className={`tag${s.memorized ? " memo" : ""}`}>{s.memorized ? "mémorisé" : "parchemin"}</span>
              </div>
              {line && <div className="sp2 muted">{line}</div>}
              {(s.keywords.length > 0 || s.damage) && (
                <div className="sp3">
                  {s.keywords.map((k) => <span key={k} className="tag">{k}</span>)}
                  {s.damage && <span className="tag">VD {s.damage}</span>}
                </div>
              )}
              {raises.length > 0 && <div className="sp4"><span className="label">Augm.</span> {raises.join(" · ")}</div>}
              {s.effect && <div className="prose sp5">{s.effect}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/** « Affinité Terre · Déficience Air » sous l'école de shugenja (annexe F.5), à la couleur de l'Anneau. */
function SpellAffinity({ page }: { page: number }) {
  const c = useCharacter();
  const [affinity, deficiency] = [affinityOf(c), deficiencyOf(c)];
  const ring = (r: string | undefined) => (r ? { ["--rc" as string]: `var(--${r})` } : undefined);
  return (
    <div className="affin" data-testid="affinity">
      <span className="tag el" style={ring(affinity)}>Affinité {affinity ? ELEMENT_LABELS[affinity] : "à choisir (bloc Identité)"}</span>
      <span className="tag el" style={ring(deficiency)}>{deficiency ? `Déficience ${ELEMENT_LABELS[deficiency]}` : "Sans déficience"}</span>
      <span className="muted"> · p. {page}</span>
    </div>
  );
}

function LongText({ field, label }: { field: "advantages" | "disadvantages" | "notes"; label: string }) {
  const { c, edit, set } = useSheet("notes");
  return edit ? (
    <label className="field"><span className="label">{label}</span><textarea className="in" value={c[field]} onChange={(e) => set([field], e.target.value)} /></label>
  ) : (
    <div><div className="label">{label}</div><div className="prose">{c[field] || "—"}</div></div>
  );
}

/** « Nouvelle journée » (annexe E.6), avec confirmation intégrée : Vide plein, blessures soignées, initiative à zéro. */
function NewDay() {
  const { c, dispatch } = useSheet();
  const [confirm, setConfirm] = useState(false);
  const healed = Math.min(c.wounds, dailyHealing(c));
  return (
    <div className="day-head" role="group" aria-label="Nouvelle journée">
      {confirm ? (
        <>
          <p className="hint" style={{ margin: 0 }} data-testid="new-day-preview">
            Vide {c.voidPoints} → {c.voidRing} ; blessures {c.wounds} → {c.wounds - healed} (−{healed} : 2 × Constitution {c.traits.stamina} + Rang {c.insightRank}) ;
            {" "}initiative et compteurs d'escarmouche remis à zéro{isShugenja(c) ? " ; emplacements de sorts rechargés" : ""}.
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setConfirm(false)}>Annuler</button>
            <button type="button" className="btn gold" onClick={() => { dispatch({ type: "newDay" }); setConfirm(false); }}>Confirmer la nouvelle journée</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>Après une nuit de repos : Vide plein, blessures soignées.</p>
          <button type="button" className="btn" onClick={() => setConfirm(true)}>Nouvelle journée…</button>
        </>
      )}
    </div>
  );
}

const VOCABULARY_KIND_LABELS: Record<VocabularyChange["kind"], (c: Character, path: string) => string> = {
  skill: () => "Compétence",
  emphasis: (c, path) => `Spécialisation (${c.skills[Number(/\d+/.exec(path)?.[0])]?.name ?? "?"})`,
  modifier: (c, path) => `Bonus « ${c.modifiers?.[Number(/\d+/.exec(path)?.[0])]?.name ?? "?"} »`,
};

/**
 * Bandeau « Mettre à jour le vocabulaire » (annexe E.7) : aperçu des renommages comme l'import, puis
 * Renommer ou Annuler ; le renommage appliqué reste annulable tant que la fiche est ouverte.
 */
function VocabularyBanner() {
  const { state } = useStore();
  const { c, dispatch } = useSheet();
  const [preview, setPreview] = useState(false);
  const { hidden, undo } = state.ui.vocabulary;
  const changes = vocabularyChanges(c);

  if (undo?.after === c) {
    return (
      <div className="vocab-head" role="group" aria-label="Vocabulaire">
        <p className="hint" style={{ margin: 0 }}>Vocabulaire mis à jour.</p>
        <span style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "undo" })}>Annuler le renommage</button>
          <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>OK</button>
        </span>
      </div>
    );
  }
  if (!changes.length || hidden) return null;

  const examples = [...new Map(changes.map((x) => [`${x.before}→${x.after}`, x])).values()];
  return (
    <div className="vocab-head" role="group" aria-label="Vocabulaire">
      {preview ? (
        <>
          <div className="import-preview" data-testid="vocabulary-preview">
            <h3>Renommages ({changes.length})</h3>
            <ul>{changes.map((x) => <li key={x.path}>{VOCABULARY_KIND_LABELS[x.kind](c, x.path)} : «&nbsp;{x.before}&nbsp;» →&nbsp;<b>«&nbsp;{x.after}&nbsp;»</b></li>)}</ul>
            <p className="hint">Libellés de l'édition française. Rangs, spécialisations et bonus ne changent pas.</p>
          </div>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setPreview(false)}>Annuler</button>
            <button type="button" className="btn gold" onClick={() => { setPreview(false); dispatch({ type: "vocabulary", op: "update" }); }}>Renommer</button>
          </span>
        </>
      ) : (
        <>
          <p className="hint" style={{ margin: 0 }}>
            Mettre à jour le vocabulaire ({examples.slice(0, 2).map((x) => `${x.before} → ${x.after}`).join(", ")}{examples.length > 2 ? ", …" : ""})
          </p>
          <span style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn" onClick={() => dispatch({ type: "vocabulary", op: "hide" })}>Plus tard</button>
            <button type="button" className="btn" onClick={() => setPreview(true)}>Mettre à jour…</button>
          </span>
        </>
      )}
    </div>
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
