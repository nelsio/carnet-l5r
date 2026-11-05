import { useEffect, useRef, useState } from "react";
import {
  affinityOf, createSpell, deficiencyOf, fillFromGrimoire, formatDR, grimoireConflicts, normalize, sortSpells, spellcastingOf, spellRaises, spellTn, toCarnetSpell, SPELL_ELEMENTS,
  type GrimoireDiff, type GrimoireSpell, type Spell, type SpellElement,
} from "@carnet/core";
import { ELEMENT_LABELS, SPELL_KEYWORDS, UNIVERSAL_SPELLS } from "../../../rules/l5r4e";
import { useT } from "../../../i18n";
import { PORTAL, spellUrl } from "../../../rules/portal";
import { useCharacter, useStore } from "../../store";
import { ExternalLink } from "../ExternalLink";
import { GrimoireConfirm, GrimoireNameHint, GrimoirePanel, GrimoireStatus, ScrollIcon, SpellNameField } from "../Grimoire";
import { RichSelect, RingOption } from "../RichSelect";
import { ListField, NumberField } from "../fields";
import { MOBILE_QUERY } from "./constants";
import { useSheet } from "./hooks";
import { AddButton, Field, RemoveButton } from "./shared";

const isListedKeyword = (k: string) => (SPELL_KEYWORDS as readonly string[]).includes(k);

/** Section « Rouleaux & invocations » (annexe F.5) : sorts en champs libres, recopiés par le joueur ou remplis depuis le grimoire (annexe N). */
export function Spells() {
  const { c, edit, set, dispatch } = useSheet("magic");
  const { grimoire } = useStore();
  const sp = useT().sheet.spells;
  const spells = c.spells ?? [];
  const starting = spellcastingOf(c)?.startingSpells;
  const [panel, setPanel] = useState(false);
  /** Sorts remplis depuis le grimoire pendant cette édition (non sauvegardé) ; le dernier porte le halo. */
  const [filled, setFilled] = useState<ReadonlySet<string>>(new Set());
  const [fresh, setFresh] = useState<string | null>(null);
  /** Suggestion du grimoire en attente de confirmation : elle remplacerait des valeurs saisies (annexe N.8). */
  const [confirm, setConfirm] = useState<{ id: string; g: GrimoireSpell; diffs: GrimoireDiff[] } | null>(null);
  /** Mobile : sort ajouté vers lequel défiler une fois rendu. */
  const scrollTo = useRef<string | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // En sortant du mode édition : panneau fermé, étiquettes « Rempli depuis le grimoire » retirées.
  const [wasEdit, setWasEdit] = useState(edit);
  if (wasEdit !== edit) {
    setWasEdit(edit);
    if (!edit) {
      setPanel(false);
      setFilled(new Set());
      setFresh(null);
      setConfirm(null);
    }
  }

  useEffect(() => {
    if (!scrollTo.current) return;
    document.querySelector(`[data-spell="${scrollTo.current}"]`)?.scrollIntoView?.({ block: "center" });
    scrollTo.current = null;
  });

  const head = starting && <p className="hint" style={{ marginTop: 0 }} data-testid="starting-spells">{sp.starting(starting)}</p>;
  if (edit) {
    const ready = grimoire.status === "ready" ? grimoire.cache : undefined;
    const missing = UNIVERSAL_SPELLS.filter((n) => !spells.some((s) => normalize(s.name).startsWith(normalize(n))));
    const markFilled = (ids: string[]) => {
      setFilled((prev) => new Set([...prev, ...ids]));
      setFresh(ids.at(-1) ?? null);
    };
    const addFromGrimoire = (g: GrimoireSpell) => {
      const spell = toCarnetSpell(g);
      dispatch({ type: "add", list: "spells", item: spell });
      markFilled([spell.id]);
      if (window.matchMedia?.(MOBILE_QUERY).matches) {
        setPanel(false);
        scrollTo.current = spell.id;
      }
    };
    const addUniversals = () => {
      const ids: string[] = [];
      for (const n of missing) {
        const g = ready?.spells.find((x) => x.element === "all" && normalize(x.name).startsWith(normalize(n)));
        const spell = g ? toCarnetSpell(g) : createSpell(n, "all");
        dispatch({ type: "add", list: "spells", item: spell });
        if (g) ids.push(spell.id);
      }
      if (ids.length) markFilled(ids);
    };
    /** Remplit le sort depuis le grimoire (annexe N.8) ; l'étiquette et le halo suivent. */
    const fill = (s: Spell, g: GrimoireSpell, mode: "all" | "empty") => {
      const i = spells.findIndex((x) => x.id === s.id);
      if (i < 0) return;
      set(["spells", i], fillFromGrimoire(s, g, mode));
      markFilled([s.id]);
    };
    const pickFromGrimoire = (s: Spell, g: GrimoireSpell) => {
      const diffs = grimoireConflicts(s, g);
      if (diffs.length) setConfirm({ id: s.id, g, diffs });
      else fill(s, g, "all");
    };
    const chooseFill = (s: Spell, choice: "all" | "empty" | "cancel") => {
      if (confirm && choice !== "cancel") fill(s, confirm.g, choice);
      setConfirm(null);
      document.getElementById(`spell-name-${s.id}`)?.focus();
    };
    const closePanel = (restoreFocus: boolean) => {
      setPanel(false);
      if (restoreFocus) toggle.current?.focus();
    };
    return (
      <>
        {head}
        {spells.map((s, i) => {
          const label = s.name || sp.thisSpell;
          return (
            <div key={s.id} className={`spelledit${fresh === s.id ? " fresh" : ""}`} role="group" aria-label={sp.spellLabel(label)} data-spell={s.id}>
              {confirm?.id === s.id && <GrimoireConfirm g={confirm.g} diffs={confirm.diffs} onChoose={(choice) => chooseFill(s, choice)} />}
              {filled.has(s.id) && (
                <div className="sp-top">
                  <span className="from">{sp.filled}</span>
                  {!s.damage && <span className="muted">{sp.filledHint}</span>}
                </div>
              )}
              <div className="form-grid spellhead">
                <SpellNameField
                  spellId={s.id} value={s.name} onPick={(g) => pickFromGrimoire(s, g)}
                  onChange={(name) => {
                    set(["spells", i, "name"], name);
                    if (filled.has(s.id)) setFilled((prev) => new Set([...prev].filter((id) => id !== s.id)));
                  }}
                />
                <Field label={sp.element}>
                  <RichSelect variant="anneau" value={s.element} onChange={(v) => set(["spells", i, "element"], v)}>
                    <RingOption value="all" label={ELEMENT_LABELS.all} />
                    {SPELL_ELEMENTS.filter((x) => x !== "all").map((x) => <RingOption key={x} ring={x} />)}
                  </RichSelect>
                </Field>
                <Field label={sp.mastery}><NumberField min={1} max={6} value={s.mastery} onChange={(n) => set(["spells", i, "mastery"], n)} /></Field>
              </div>
              <GrimoireNameHint />
              <div className="form-grid">
                <Field label={sp.damage}>
                  <input className="in mono" type="text" placeholder="—" value={s.damage ?? ""} maxLength={10} onChange={(e) => set(["spells", i, "damage"], e.target.value || undefined)} />
                </Field>
                <Field label={sp.range}><input className="in" type="text" placeholder={sp.rangePlaceholder} value={s.range} maxLength={80} onChange={(e) => set(["spells", i, "range"], e.target.value)} /></Field>
                <Field label={sp.area}><input className="in" type="text" placeholder={sp.areaPlaceholder} value={s.area} maxLength={120} onChange={(e) => set(["spells", i, "area"], e.target.value)} /></Field>
                <Field label={sp.duration}><input className="in" type="text" placeholder={sp.durationPlaceholder} value={s.duration} maxLength={80} onChange={(e) => set(["spells", i, "duration"], e.target.value)} /></Field>
              </div>
              <div className="kwpick" role="group" aria-label={sp.keywordsOf(label)}>
                <span className="label">{sp.keywords}</span>
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
                  aria-label={sp.otherKeywordsOf(label)} placeholder={sp.otherKeywordsPlaceholder} style={{ maxWidth: 220 }}
                  value={s.keywords.filter((k) => !isListedKeyword(k))}
                  onChange={(v) => set(["spells", i, "keywords"], [...s.keywords.filter(isListedKeyword), ...v])}
                />
              </div>
              <div className="form-grid wide">
                <Field label={sp.raises}>
                  <textarea className="in" placeholder={sp.raisesPlaceholder} value={s.raises} onChange={(e) => set(["spells", i, "raises"], e.target.value)} />
                </Field>
                <Field label={sp.effect}><textarea className="in" value={s.effect} onChange={(e) => set(["spells", i, "effect"], e.target.value)} /></Field>
              </div>
              <div className="spellfoot">
                <label className="chk">
                  <input type="checkbox" checked={s.memorized} onChange={(e) => set(["spells", i, "memorized"], e.target.checked)} />
                  {" "}{sp.memorized} <span className="muted">{sp.memorizeCost(s.mastery)}</span>
                </label>
                <SpellLink name={s.name} element={s.element} />
                <RemoveButton list="spells" index={i} name={s.name} />
              </div>
            </div>
          );
        })}
        <div className="spell-tools">
          <AddButton list="spells" label={sp.add} item={() => createSpell()} />
          <button
            ref={toggle} type="button" className={`btn sm ${panel ? "on" : "accent"}`}
            aria-expanded={panel} aria-controls={panel ? "grimoire-panel" : undefined} onClick={() => setPanel(!panel)}
          ><ScrollIcon />{sp.addFromGrimoire}</button>
          {missing.length > 0 && <button type="button" className="btn sm" onClick={addUniversals}>{sp.addUniversals}</button>}
          <GrimoireStatus />
        </div>
        {panel && <GrimoirePanel spells={spells} onAdd={addFromGrimoire} onClose={closePanel} />}
        {spells.length > 0 && <GrimoireNote />}
      </>
    );
  }
  if (!spells.length) return <>{head}<p className="muted">{sp.empty}</p></>;
  return (
    <>
      {head}
      <div className="spells">
        {sortSpells(spells).map((s) => {
          const raises = spellRaises(s);
          const line = [s.range && sp.rangeLine(s.range), s.area && sp.areaLine(s.area), s.duration && sp.durationLine(s.duration)].filter(Boolean).join(" · ");
          return (
            <div key={s.id} className={`spell el-${s.element}`} data-testid={`spell-${s.id}`}>
              <div className="spell-body">
              <div className="sp1">
                <b>{s.name}</b>
                <span className="tag el">{ELEMENT_LABELS[s.element]}</span>
                <span className="mono muted">{sp.masteryLine(s.mastery, spellTn(s.mastery))}</span>
                <span className={`tag${s.memorized ? " memo" : ""}`}>{s.memorized ? sp.memorizedTag : sp.scrollTag}</span>
              </div>
              {line && <div className="sp2 muted">{line}</div>}
              {(s.keywords.length > 0 || s.damage) && (
                <div className="sp3">
                  {s.keywords.map((k) => <span key={k} className="tag">{k}</span>)}
                  {s.damage && <span className="tag">{sp.drTag(formatDR(s.damage))}</span>}
                </div>
              )}
              {raises.length > 0 && <div className="sp4"><span className="label">{sp.raisesShort}</span> {raises.join(" · ")}</div>}
              {s.effect && <div className="prose sp5">{s.effect}</div>}
              </div>
              <SpellLink name={s.name} element={s.element} />
            </div>
          );
        })}
      </div>
      <GrimoireNote />
    </>
  );
}

/** Lien « Grimoire » du titre du bloc Sorts (annexe L.7). */
export function GrimoireLink() {
  const sp = useT().sheet.spells;
  return <ExternalLink href={PORTAL.grimoire} className="head-link" label={sp.grimoireLink}>{sp.grimoire}</ExternalLink>;
}

/** Sort dans le grimoire du portail, recherche par nom filtrée par élément ; rien pour un sort sans nom (annexe L.7). */
function SpellLink({ name, element }: { name: string; element: SpellElement }) {
  const sp = useT().sheet.spells;
  if (!name.trim()) return null;
  return <ExternalLink href={spellUrl(name, element)} className="spell-link" label={sp.spellLink(name.trim())} />;
}

function GrimoireNote() {
  const sp = useT().sheet.spells;
  return <p className="hint grimoire-note">{sp.grimoireNote}</p>;
}

/** « Affinité Terre · Déficience Air » sous l'école de shugenja (annexe F.5), à la couleur de l'Anneau. */
export function SpellAffinity({ page }: { page: number }) {
  const c = useCharacter();
  const sp = useT().sheet.spells;
  const [affinity, deficiency] = [affinityOf(c), deficiencyOf(c)];
  const ring = (r: string | undefined) => (r ? { ["--rc" as string]: `var(--ring-${r})` } : undefined);
  return (
    <div className="affin" data-testid="affinity">
      <span className="tag el" style={ring(affinity)}>{sp.affinity(affinity ? ELEMENT_LABELS[affinity] : undefined)}</span>
      <span className="tag el" style={ring(deficiency)}>{sp.deficiency(deficiency ? ELEMENT_LABELS[deficiency] : undefined)}</span>
      <span className="muted"> {sp.page(page)}</span>
    </div>
  );
}
