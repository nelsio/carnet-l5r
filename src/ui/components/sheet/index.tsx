import type { ReactNode } from "react";
import { isShugenja } from "@carnet/core";
import { useT } from "../../../i18n";
import { useCharacter, useStore, type BlockId } from "../../store";
import { FileActions } from "../FileActions";
import { Modifiers } from "../Modifiers";
import { Armor } from "./Armor";
import { Identity } from "./Identity";
import { NewDay } from "./NewDay";
import { LongText } from "./Notes";
import { Rings } from "./Rings";
import { Skills } from "./Skills";
import { GrimoireLink, Spells } from "./Spells";
import { Techniques } from "./Techniques";
import { VocabularyBanner } from "./Vocabulary";
import { Weapons } from "./Weapons";

export function Sheet() {
  const { state, library } = useStore();
  const t = useT();
  const s = t.sheet;
  const c = useCharacter();
  const readonly = state.mode === "readonly";
  return (
    <div className="grid">
      {readonly && (
        <div className="readonly-head">
          <p className="hint" style={{ margin: 0 }}>
            {s.readonlyHint}
          </p>
          <button type="button" className="btn" onClick={() => void library.makeEditableCopy()}>{s.makeEditable}</button>
        </div>
      )}
      {!readonly && <VocabularyBanner />}
      {!readonly && <NewDay />}
      <Block id="rings" title={s.blocks.rings}><Rings /></Block>
      <Block id="identity" title={s.blocks.identity}><Identity /></Block>
      <div className="grid cols-2">
        <Block id="skills" title={s.blocks.skills}><Skills /></Block>
        <div className="grid">
          <Block id="weapons" title={s.blocks.weapons}><Weapons /></Block>
          <Block id="armor" title={s.blocks.armor}><Armor /></Block>
          <Block id="techniques" title={s.blocks.techniques}><Techniques /></Block>
          {(isShugenja(c) || state.ui.editing.has("magic")) && (
            <Block id="magic" title={s.blocks.magic} extra={<GrimoireLink />}><Spells /></Block>
          )}
          <Block id="modifiers" title={s.blocks.modifiers}><Modifiers /></Block>
        </div>
      </div>
      <Block id="notes" title={s.blocks.notes}>
        <div className="grid cols-2">
          <LongText field="advantages" label={s.advantages} />
          <LongText field="disadvantages" label={s.disadvantages} />
        </div>
        <div style={{ marginTop: 14 }}><LongText field="notes" label={s.notes} /></div>
      </Block>
      <FileActions />
    </div>
  );
}

/**
 * Bloc de la fiche avec son bouton « Edit » (« Terminer » pendant l'édition), annexe E.9 S2.
 * Plusieurs blocs peuvent être ouverts ensemble ; aucun bouton en consultation.
 */
/** `extra` : à droite du titre, avant le bouton Edit (lien « Grimoire » du bloc Sorts, annexe L.7). */
function Block({ id, title, label, extra, children }: { id: BlockId; title: ReactNode; label?: string; extra?: ReactNode; children: ReactNode }) {
  const { state, dispatch } = useStore();
  const s = useT().sheet;
  const edit = state.ui.editing.has(id);
  const name = label ?? (typeof title === "string" ? title : id);
  return (
    <section className={`panel${edit ? " editing" : ""}`} aria-label={name} data-testid={`block-${id}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {extra}
        {state.mode === "edit" && (
          <button
            type="button" className={`btn sm${edit ? " accent" : ""}`} aria-pressed={edit}
            aria-label={s.blockToggle(edit, name)}
            onClick={() => dispatch({ type: "toggleBlockEdit", block: id })}
          >{edit ? s.done : s.edit}</button>
        )}
      </div>
      {children}
    </section>
  );
}
