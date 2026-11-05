/** Rendu dans le fournisseur de langue (annexe 50.3) : `fr` par défaut, comme l'application. */
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider, type Locale } from "../../src/i18n";

export function renderApp(ui: ReactElement, { locale = "fr", ...options }: { locale?: Locale } & RenderOptions = {}) {
  return render(ui, { wrapper: ({ children }) => <I18nProvider locale={locale}>{children}</I18nProvider>, ...options });
}
