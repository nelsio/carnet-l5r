/** Textes du moteur (codes, annexe 53.2) formatés comme à l'écran, en français par défaut. */
import type { CoreText } from "@carnet/core";
import { formatCore, type Locale } from "../../src/i18n";
import { en } from "../../src/i18n/en";
import { fr } from "../../src/i18n/fr";

export const say = (text: CoreText, locale: Locale = "fr"): string => formatCore(locale === "fr" ? fr : en, text);
