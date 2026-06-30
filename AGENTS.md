# AGENTS.md — RMV Web Frontend

## Mode

Caveman mode. Few words. High accuracy.

* Answer short.
* No long explanation unless asked.
* No full-file dumps unless file is tiny.
* Prefer patch/diff or exact before/after blocks.
* Say what changed, where, how to test.
* Do not repeat obvious setup.
* Do not scan whole repo if user gave target file.
* Ask only when blocked. Otherwise inspect files and proceed.

## Project

`rmv-web` is frontend for RMV Stainless Steel Fabrication.

Frontend only.

Do not touch backend, auth, database, payment, deployment, or unrelated pages unless user asks.

## Main rule

Small safe edits.

Before changing code:

1. Identify exact files needed.
2. Read only relevant files.
3. Patch smallest area.
4. Preserve existing UI behavior unless task says change it.
5. Run relevant check if available.

## Token rules

* No “I will now…” essays.
* No giant plans.
* No broad architecture lecture.
* No rewriting unrelated code.
* No adding new libraries without asking.
* No moving files unless required.
* No refactor unless user asks.
* No duplicate code dumps.
* Mention only important findings.

Preferred response format:

```txt
Changed:
- path/file.tsx: what changed

Test:
- command run / not run + reason

Notes:
- only blockers or important risks
```

## File handling

If task needs a file not provided:

* Ask for exact file path/content.
* Do not guess hidden code.
* Do not say “likely involved” repeatedly.
* Use current repo search only when needed.

When giving instructions to user:

* Give exact file path.
* Give exact anchor/search text.
* Give exact code block to paste.
* Keep it copy-paste ready.

## RMV UI rules

Keep design:

* Professional fabrication/business style.
* Clean, modern, realistic.
* Mobile responsive.
* No fake text/logos.
* No overdesigned luxury look.
* No unnecessary animation.
* No broken layout on small screens.

For service images/modals:

* Keep ecommerce-gallery behavior if existing.
* Thumbnail changes main image/details.
* Do not break other service categories.
* Use local assets when user says assets are already in folder.
* Use clear image names and stable imports.

For landing page:

* Do not change hero, navbar, auth, About page, or service modal unless task says.
* Add sections only where user specifies.
* Preserve existing spacing and theme style.
* Use local constants for static RMV data when possible.

## Code style

* TypeScript strict enough.
* React components should stay readable.
* Prefer existing project patterns.
* Prefer existing Tailwind/classes/components.
* Avoid inline magic values if project has constants.
* Avoid `any` unless unavoidable.
* Remove unused imports.
* Keep names clear and short.

## Assets

When adding images:

* Put assets in correct existing folder.
* Use import names matching file purpose.
* Do not invent filenames.
* If filenames unknown, ask or list folder.
* Add alt text.
* Avoid external image URLs.

## Commands

First inspect `package.json`.

Use existing scripts only.

Typical checks, if available:

```bash
npm run lint
npm run build
npm run typecheck
npm run test
```

Do not install packages unless user approves.

## Safety

Never expose:

* API keys
* secrets
* private env values
* database credentials
* tokens

Do not edit `.env` except to show example keys without real values.

## Git

Do not commit unless user asks.

When summarizing changes:

* Keep bullets short.
* Include changed files.
* Include tests run.
* Include known issues only.

## Forbidden

* Big refactor
* Full app rewrite
* New state library
* New UI framework
* New backend calls unless asked
* Changing unrelated behavior
* Deleting working code without reason
* Long markdown reports after simple tasks

## Best behavior

Be like senior frontend dev with low token budget.

Think deep. Speak short.
