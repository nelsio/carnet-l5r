## Annexe A — Format du prototype (v0) → v1
| v0 | v1 |
|---|---|
| `insight` | `insightRank` |
| `honor`, `glory`, `status` (texte) | nombres (`parseFloat`, 0 si vide) |
| `xpTotal`, `xpSpent` | `xp.total`, `xp.spent` |
| `void` | `voidRing` |
| `skills[].emph` (texte séparé par virgules) | `skills[].emphases[]` |
| `weapons[].dr` en `g` | accepté tel quel |
| `weapons[].bow` | `weapons[].bowStrength` |
| `maneuvers[]{k,n,cost,eff,rep}` | `maneuvers[]{id,name,cost,effect,stackable}` |
| `armor.reduction` absent | `armor.reduction: 0` |
| pas de `schemaVersion` | v0 |

---

