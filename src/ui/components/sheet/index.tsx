import type { ReactNode } from "react";
import { isShugenja } from "@carnet/core";
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
            <Block id="magic" title={<>Rouleaux &amp; invocations</>} label="Rouleaux & invocations" extra={<GrimoireLink />}><Spells /></Block>
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
/** `extra` : à droite du titre, avant le bouton Edit (lien « Grimoire » du bloc Sorts, annexe L.7). */
function Block({ id, title, label, extra, children }: { id: BlockId; title: ReactNode; label?: string; extra?: ReactNode; children: ReactNode }) {
  const { state, dispatch } = useStore();
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
            aria-label={`${edit ? "Terminer" : "Edit"} : ${name}`}
            onClick={() => dispatch({ type: "toggleBlockEdit", block: id })}
          >{edit ? "Terminer" : "Edit"}</button>
        )}
      </div>
      {children}
    </section>
  );
}
