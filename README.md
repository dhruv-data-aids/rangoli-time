# Rangoli Time

A rangoli coloring and making game for a young child, built as an installable iPad web app (PWA). It also works on iPhone and in desktop browsers. Everything runs offline once installed. There is no account, no server and no tracking.

- **Color**: tap a region to fill it. 14 designs plus "New" for random surprise designs. Progress per design is remembered, and finishing a design triggers a celebration.
- **Make**: build a rangoli ring by ring (Center, Inner, Outer, Border) from 8 motifs each, or roll the dice for a random one. Tap a placed piece to recolor it.
- **Whole ring / One piece**: in both modes, either fill every matching piece on the same circle in one tap, or just the tapped piece.
- **Stickers**: diya, marigold, lotus, sparkle, leaf, bindu, optionally ×8 around the centre.
- **Undo**, **Clear** (undoable), sound on/off, **Save**.
- **Gallery**: kept on the device (IndexedDB), filter by All / Colored / Made, open large, *Keep working*, *Save as picture* (PNG via the iOS share sheet), two-tap *Delete*, plus *Export gallery* / *Import gallery*.

## Run it

Requires Node 22+.

```bash
npm install
npm run dev          # http://localhost:5173/rangoli-time/
npm test             # unit tests (Vitest)
npm run build        # type-check + production build into dist/
npm run preview      # serve the production build at http://localhost:4173/rangoli-time/
```

### End-to-end tests (Playwright)

```bash
npx playwright install chromium webkit
npm run e2e          # iPad landscape 1024×768 and portrait 768×1024, Chromium + WebKit
```

The e2e suite builds the app, serves it with `vite preview`, then: colors a region, toggles Whole ring / One piece, builds all four rings in Make mode, saves, reloads, and checks the gallery items survived. A second spec checks installability: manifest, icons, service worker control, offline reload, and no external requests.

Playwright's bundled browsers don't support older macOS releases. On such a Mac, run the tests against your installed Google Chrome instead (WebKit projects are skipped; CI runs them):

```bash
npm run e2e:local    # PW_CHANNEL=chrome playwright test
```

Note on Lighthouse: current Lighthouse versions no longer have a "PWA" category, so there is no installable score to pass. Installability is verified by `e2e/pwa.spec.ts` instead, and Chrome's DevTools → Application → Manifest panel shows the same checks.

## Deploy (GitHub Pages)

Pushing to `main` runs `.github/workflows/deploy.yml`: type-check, unit tests, Playwright, then build and publish to GitHub Pages. In the repository settings, **Pages → Source** must be set to **GitHub Actions** (one-time).

The site lives at `https://<user>.github.io/rangoli-time/`. The Vite `base` is `/rangoli-time/` (see `vite.config.ts`); set `VITE_BASE=/` to build for a root domain instead.

## Install on the iPad

1. Open the site's address in **Safari** on the iPad.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it from the Home Screen icon. It runs full screen and works with no internet.

Installing matters: Safari may clear storage for ordinary websites that haven't been visited in about a week, but apps added to the Home Screen are not subject to that. The app also asks the browser to keep its data (`navigator.storage.persist()`), though iOS may decline this request.

## Back up the gallery

**Exporting the gallery is the backup.** The saved pictures live only on this device. Deleting the app, clearing Safari website data, or replacing the iPad removes them.

In Gallery tap **Export gallery**. The iOS share sheet opens: choose *Save to Files* (iCloud Drive is best) or AirDrop it. To restore, tap **Import gallery** and pick the file. Importing merges: items already present are skipped, nothing is overwritten. Do this every so often, and before deleting the app.

Each saved item stores its id, date, mode (colored / made), the design name or ring recipe, the SVG markup, and the editable state needed to reopen it. The export is one JSON file of those items.

## How it is organised

```
src/geometry/primitives.ts   path generators (petal, leaf, tri, diamond, arch, dot, ring…), each tagged with type + ring
src/grouping.ts              groupId = shapeType@ringRadius, used by "Whole ring"
src/designs/                 14 coloring designs, Make-mode motifs, random designs
src/state/store.ts           app state, validation, undo, debounced autosave
src/storage/                 IndexedDB (idb-keyval): work-in-progress + gallery, export/import
src/ui/                      rendering, tap handling, gallery view
src/input.ts                 multi-touch/palm rejection, pinch and double-tap zoom blocking
tests/                       geometry, grouping, storage round-trip
e2e/                         Playwright smoke + PWA tests
```

### How "Whole ring" grouping works

Every piece carries a `groupId = shapeType + ringRadius`, for example `petal@18-88` or `dot@93`. Mirrored pieces on the same circle share a group. Where a design is not made of circles (the Kolam grid), each layer is declared an explicit set. A unit test checks that no group mixes shapes of different types or different circles. The audit of all 14 designs found and fixed, among others, the peacock feather's eye dots (five dots on three different circles, now three groups).

### Notes for development

- Everything from storage or from an imported file passes through validators (`sanitizeState`, `parseItem`): colors must be hex, stickers must be known, designs must exist. Saved pictures are shown through `<img>` so imported SVG can never run script.
- Playwright / Vite versions are recent; if `npm install` complains about peer dependencies on your machine, check `package.json`.

## Roadmap (not built yet)

- **Free-build mode**: an empty floor where she drags and drops motifs (petals, leaves, dots, diyas) anywhere, with optional snap-to-ring and symmetry helpers, plus rotate and resize.
- Optional native wrapper (Capacitor) for TestFlight / App Store.
- Kolam dot-grid line-drawing mode.
