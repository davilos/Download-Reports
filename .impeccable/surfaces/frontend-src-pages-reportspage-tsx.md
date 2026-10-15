---
version: 1
slug: "frontend-src-pages-reportspage-tsx"
primary_target: "frontend/src/pages/ReportsPage.tsx"
related_targets: ["frontend/src/components/reports/ReportsTable.tsx","frontend/src/components/reports/UploadButton.tsx"]
---

## Scope

`frontend/src/pages/ReportsPage.tsx` and everything it renders (Header, SearchFilterBar, ReportsTable, Pagination,
UploadButton dialog, EmptyState, TableSkeleton, StatusDot). Visitor mode: Operate.

## Audience and task

A reviewer judging a portfolio project; persona keeps fiscal documents. Upload and download carry equal weight.
Must not break on phones. States worth seeing: PENDING (listed, not downloadable), AVAILABLE, loading, empty,
error, upload progress, upload TTL expired. EXPIRED rows never reach the list (soft-deleted).

## Direction contract

THESIS: The reports list as a calm consumer app, where the only saturated colour on screen is something you can
press. Refuses the incumbent dark indigo admin table with glass, glow and gradient text.

OWN-WORLD: Warm ground #F6F1EA, white cards with 24px radius and a soft offset shadow, file-type tiles in #EFE7DC,
ink #2A2622 and #6B6158. One action orange #CC4520, used only on controls that act now (Enviar, Baixar, Selecionar,
Tentar novamente); a disabled action loses the colour entirely. Green/amber dots for state. Nunito Sans 400–800,
pill-shaped controls, tabular numerals.

STORY: The visitor sees at a glance which files are ready (orange Baixar) and which are not (neutral), sends a file
through a friendly dialog whose real progress fills a ring, finds it by name or type, and downloads it, on desktop
or phone.

FIRST VIEWPORT: Header row: brand tile, "Central de Relatórios" and subtitle on the left, orange pill "Enviar
Relatório" on the right; on phones that button moves to a fixed bottom bar within thumb reach. Below: search pill,
type chips and the result count. Then the report cards in a 3-column grid (2 on tablets, 1 on phones): type tile and
file name on top, sent date and size in the middle, status dot and the Baixar pill at the bottom. Pagination pills
under the grid.

FORM: Catalog world digital-design-canon-warm-consumer-app-surface, chosen by the user from the bolder re-roll
(round 2), fused with the product; seed key 29c1e242. Signature move: action-only orange, plus upload progress drawn
as a filling ring. Rows keep table semantics (explicit ARIA roles) while rendering as cards.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- formatFileSize prints a '.' decimal ("1.5 KB"), not pt-BR ','; existing tests assert it, so it is out of scope.
