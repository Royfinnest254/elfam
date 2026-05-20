# Elfam — Project Brief

You are building a real, working farm management web application for
Elfam, a 1,600-acre mixed agribusiness in Uasin Gishu County, Kenya,
owned by Prof. Margaret Kamar and Maria Soti. The farm grows wheat,
barley (under contract to East African Breweries), and fodder maize,
and runs a Friesian dairy herd. The overall manager is David Ngetich.

This is a polished, deployable product. Not a sketch. Not a wireframe.
Every page in this brief must be implemented, must render real seeded
data, must look designed, and must work on a phone. There are no
placeholder links, no "coming soon" sections, no dead buttons.

Treat this brief as the source of truth. If your defaults conflict
with it, follow the brief.

---

## 1. The farm we are modeling

Verified from public reporting. Do not invent numbers beyond these.

- 1,600 acres along the Eldoret–Iten–Chepkanga Road, Uasin Gishu
- 450 acres of wheat (~5,400 90kg bags per season, ~Sh3,200/bag)
- 350 acres of barley under contract to EABL
- 150 acres of fodder maize and lucerne for silage
- Mature blue gum (eucalyptus) along the road frontage
- Dairy herd built from 20 in-calf Friesian heifers in 2013; the app
  ships seeded with 28 individual cows
- Central blue-roofed administrative building called the "nerve centre"
- Milk sold to Oldonyo Dairies in Eldoret
- Manager: David Ngetich

Use realistic Kenyan names for cows, workers, and fields. No
placeholders, no "Cow 1", no "Field A". The data must read like a
real farm's records on first glance.

---

## 2. Who uses it

Three roles, each with a distinct surface:

**Owner** (Prof. Margaret Kamar). Doesn't operate the farm day to
day. Opens the app to check that things are going well. Wants
summaries, trends, and anomalies — not data entry.

**Manager** (David Ngetich). Runs the farm. Lives in the operational
surface. Logs treatments, reviews milking, manages workers, tracks
contracts. Mobile and desktop both.

**Worker** (seed a few — Kibet, Chebet, Wanjiru). Logs milking
sessions, marks tasks done. Mobile only. Sees nothing administrative.

The app must feel different for each role. An owner who opens the
worker's screen would be confused; a worker who opened the owner's
dashboard would have no use for it.

---

## 3. Stack — non-negotiable

- **Next.js 14** App Router, TypeScript strict mode
- **Convex** for database, mutations, queries, realtime, auth
- **Convex Auth** with email + password
- **Tailwind CSS** with the design tokens in §6
- **shadcn/ui** primitives, restyled per §6 — do not ship defaults
- **Lucide React** icons, used sparingly, never decoratively
- **Recharts** for charts
- **date-fns** for dates
- **Zod** for mutation validation

PWA: include `manifest.json`, a service worker that caches the shell,
and an installable home-screen experience. Mobile-first, must work
at 380px viewport.

Deployment: Render. Include `render.yaml` at the repo root.

Do not add: Redux, Zustand, tRPC, Prisma, Drizzle, NextAuth, any ORM.

---

## 4. Logo and brand mark

The product is called **Elfam**. Wordmark only, no icon.

The wordmark is the word "Elfam" set in **Fraunces**, weight 500,
optical size 144, with a slight negative letter-spacing of -0.02em.
Lowercase. The "f" descender is the visual anchor — let it breathe.

Implement it as a React component `<Wordmark />` that takes an
optional `size` prop (default 24px) and a `tone` prop (`"ink"` or
`"cream"`). It renders as actual text, not an image, so it stays
crisp at every size.

In the top-left of the sidebar, the wordmark sits at 22px in cream
on the ink-green sidebar background.

**Favicon**: a 32x32 SVG and PNG showing only the lowercase letter
"e" in Fraunces, weight 500, in `--moss` on `--paper`, padded to a
4px inset from the canvas edge. Generate both `favicon.svg` and
`favicon.ico` (32x32). Wire them into the Next.js head.

---

## 5. The pages — build all of them

This is the complete page list. Every page must be implemented with
real seeded data and working interactions. No dead links anywhere.

### 5.1 Public

- `/` — Landing. A single-screen page introducing Elfam with the
  wordmark, one paragraph of context about the farm, and a "Sign in"
  button. Editorial layout, generous whitespace. No marketing speak.
  No "Empower your farm." Plain, grounded copy in the voice of
  someone who has actually been to Eldoret.
- `/signin` — Sign-in form. Email and password fields. No social
  auth. A small "Workers, sign in here" link that prefills with a
  seeded worker account for demo purposes.

### 5.2 Owner surface (Prof. Kamar)

Routed under `/owner`. Sidebar reflects this role.

- `/owner` — Overview. The single screen Margaret opens on Sunday
  evening. Yesterday's herd yield with week-over-week delta. Active
  contract progress (EABL barley). Number of cows currently under
  treatment. Number of fields in active production. A "What changed
  this week" section listing meaningful events: calvings, new
  treatments, deliveries, anomalies.
- `/owner/herd` — Herd at a glance. Total cows by status (milking,
  dry, treatment, calf). Top 5 and bottom 5 producers this week.
  Average daily yield trend over 60 days.
- `/owner/operations` — Operations summary. Wheat ledger summary,
  barley contract status, fodder production. Each section links to
  the manager's detailed view for that area.
- `/owner/finances` — A simple financial overview. Estimated revenue
  from milk this month (litres × Sh34). Bags delivered against EABL
  contract × Sh3,100. Wheat harvest valuation. Costs are out of scope
  for this build, so frame this as "Gross revenue tracking."
- `/owner/people` — A simple list of farm staff with role, contact
  number, and date joined. Read-only for the owner.
- `/owner/reports` — Downloadable monthly summary as a printable
  page. No PDF generation — just a print-friendly route.

### 5.3 Manager surface (David Ngetich)

Routed under `/manager`. The dense, operational surface.

- `/manager` — Today's view. AM milking status (logged / not logged).
  PM milking status. Cows under withholding right now with countdown.
  Today's tasks. Anomalies — any cow whose yield dropped >25% vs
  her 7-day average.
- `/manager/herd` — Full herd table. Tag, name, breed, status,
  lactation #, days in milk, last calving, last service, yesterday's
  yield. Filterable, searchable. Click a row → cow profile.
- `/manager/herd/[tagNumber]` — Individual cow profile. Header with
  tag, name, breed, age, lactation, status. 30-day yield chart
  (AM/PM stacked). Treatment history with withholding countdowns.
  Breeding history (services, pregnancy diagnoses, calvings). Calf
  list. Action buttons: log milk, log treatment, log service, log
  calving, edit profile.
- `/manager/milking` — The milk logging surface. Pick AM or PM and
  date. List of active cows. Tap a cow → numeric pad → enter litres
  → next cow. Running total at top. Save session at bottom. The
  withholding lock fires here: if a cow has an unexpired
  `withholdingUntil`, the entry is refused with a clear red banner
  ("EL-014 Wairimu — milk withheld until 18 May. Do not add to
  bulk tank.") and the attempt is recorded with `flagged: true` for
  audit.
- `/manager/milking/history` — A table of recent milking sessions
  with totals, who logged, and any flagged entries.
- `/manager/treatments` — List of all treatments past and present.
  Click → treatment detail. "New treatment" action.
- `/manager/treatments/new` — Form: cow, condition, drug, dosage,
  withholding days. Common drugs prefilled with their standard
  withholding periods: Terramycin LA (4 days), Pen-Strep (5 days),
  Oxytetracycline (7 days), Norodine (3 days), Hitet (10 days).
  Override allowed. Confirmation screen shows the exact return date.
- `/manager/withholding` — The board. Every cow currently locked
  out, sorted by days remaining. The morning check-in screen.
- `/manager/breeding` — Breeding management. Cows in heat,
  scheduled AI services, pending pregnancy diagnoses, expected
  calvings in the next 60 days. "Log service" and "Log pregnancy
  diagnosis" actions.
- `/manager/calvings` — Calving log. Recent calvings, expected
  calvings, action to log a new calving.
- `/manager/calves` — Calf register. All calves with date of birth,
  dam, sire (if AI), sex, weight tracking, weaning status.
- `/manager/feed` — Feed and forage tracking. Current silage
  inventory (tonnes), current concentrate inventory (bags), daily
  consumption per category, projected days of cover.
- `/manager/fields` — Field register. Every field with name, crop,
  acres, planting date, expected harvest. 12 fields seeded across
  wheat, barley, maize, lucerne, fallow.
- `/manager/fields/[fieldId]` — Field detail. Planting record,
  input applications (fertilizer, herbicide, pesticide), yield
  history.
- `/manager/contracts` — Contract management. The EABL barley
  contract seeded with realistic data: 350 acres, 3,150 bags
  contracted, Sh3,100/bag, 2026 long rains season, 8 deliveries
  already logged. Progress bar, delivery history, "Log delivery"
  action.
- `/manager/contracts/[contractId]` — Contract detail with full
  delivery history and a chart of cumulative deliveries vs
  contracted volume.
- `/manager/harvest` — Wheat harvest ledger. 450 acres, seeded with
  realistic per-field yield records.
- `/manager/tasks` — Task board. Tasks David has assigned to
  workers. Pending, in progress, done. Filter by worker. "New task"
  action.
- `/manager/workers` — Worker management. List of farm staff, role,
  contact, last active. "Add worker" action.
- `/manager/inventory` — Veterinary supplies inventory. Drugs on
  hand, low stock alerts. Seeded with common items: Terramycin LA,
  Pen-Strep, dewormers, mineral licks, AI semen straws.

### 5.4 Worker surface (Kibet, Chebet, Wanjiru)

Routed under `/worker`. Mobile-only design. Big tap targets, minimal
UI chrome.

- `/worker` — Today's tasks. Big cards. Tap to mark done.
- `/worker/milk` — The same milking interface as `/manager/milking`,
  but the worker only sees the cows assigned to their shift.
- `/worker/help` className="quiet" — A quiet page with the manager's name and phone
  number, in case something goes wrong.

### 5.5 Shared

- `/settings` — Profile, password change, sign out.
- `/404` — Custom not-found page in the brand voice.

**No route returns 404 unintentionally. No button leads to a
non-existent page. Every "View all" link goes somewhere real.**

---

## 6. Design system

The single most important constraint: this must not look like
generated software. No purple-teal gradients. No glassmorphism. No
rounded-3xl on every element. No gradient text. No emoji as icons.
No "feature grid" sections. No hero with a centered headline and
two buttons.

### Visual references to internalize

Calm density of Linear's settings. Editorial typography of Stripe's
docs. Restraint of Are.na. Slight bookishness of a printed almanac.
Confident in whitespace.

### Palette

Deep highland green and cream, with ink for type and a small palette
of accents. No brown.

```css
--ink: #0f1411;          /* near-black, slightly cool, primary text */
--paper: #fafaf5;        /* warm white, primary background */
--paper-2: #f0efe6;      /* secondary surface, cards */
--rule: #d8d6c9;         /* hairlines, borders */
--moss: #1f3a2e;         /* deep highland green, primary brand */
--moss-2: #2d5440;       /* secondary moss, hover states */
--pasture: #6b8e5a;      /* lighter green, charts and accents */
--cream: #f5f2e3;        /* sidebar/section accent on dark */
--alert: #a8341f;        /* withholding red, used sparingly */
--muted: #6b7268;        /* secondary text */
```

Wire these into `globals.css` as CSS variables and into the Tailwind
config so `bg-paper`, `text-ink`, `bg-moss`, `text-cream` etc all
work. **Do not use Tailwind's default gray/slate/zinc/green palette.**

### Typography

Load via `next/font/google`:

- **Display / headings**: Fraunces, weight 400 and 500, opsz 144,
  slight soft slope. Page titles, hero numbers, the wordmark.
- **Body**: Inter Tight, weights 400 and 500. Everything else.
- **Mono**: JetBrains Mono, weight 400. Tag numbers, numerical
  data in tables, timestamps.

Type scale:

```
display: 48px / 1.05 / -0.02em — page titles
h1:      32px / 1.1  / -0.015em — section heads
h2:      22px / 1.25 / -0.01em — sub-sections
body:    15px / 1.5 — paragraphs
small:   13px / 1.4 — captions, labels
mono:    13px / 1.3 — data
label:   11px / 1.3 / 0.04em uppercase — table headers, badges
```

### Layout

- Max content width 1180px, generous gutters
- Sidebar navigation on desktop: 240px fixed left, content right
- Sidebar background: `--moss` deep green
- Sidebar text: `--cream`
- Sidebar active item: `--cream` background, `--moss` text
- Content background: `--paper`
- Mobile: sidebar collapses to a bottom tab bar with 4-5 primary
  destinations, plus a "more" sheet for the rest
- Rule lines between sections (1px `--rule`), never drop shadows
- Border radius: 4px on inputs, 6px on buttons, 0px on cards
  (cards separated by background tone + 1px rule, not by corners)

### Components

- **Buttons (primary)**: `--moss` background, `--cream` text, 6px
  radius. Hover: `--moss-2`. No gradients, no shadows.
- **Buttons (secondary)**: 1px `--rule` border, `--ink` text,
  transparent background. Hover: `--paper-2` background.
- **Buttons (destructive)**: `--alert` background, white text.
  Used only for genuinely destructive actions.
- **Inputs**: 1px `--rule` border, no shadow. Focus: 2px `--moss`
  border, no outline ring.
- **Cards**: `--paper-2` background, 1px `--rule` border, 24px
  padding, 0px radius.
- **Tables**: header row in mono `label` style, body rows separated
  by 1px `--rule`, hover row gets `--paper-2`.
- **Badges**: 11px uppercase, 6px horizontal padding, 4px vertical,
  2px radius. Withholding badge uses `--alert` on `--paper`.
- **Charts (recharts)**: single-color lines/bars in `--moss` or
  `--pasture`. No gradients, no shadows. Axes and gridlines in
  `--muted`. Background transparent. Tooltips in `--ink` with
  `--cream` text.
- **Empty states**: a one-line italic message in `--muted` and
  nothing else. No illustrations, no big icons.

### What "polished" looks like here

A page is finished when:
- The wordmark feels at home on it
- Numbers use mono, headings use Fraunces, labels use Inter Tight,
  and you can tell which is which at a glance
- The withholding red appears at most once per screen and means
  something
- The eye knows where to go without being directed
- Nothing decorative is on screen for its own sake

---

## 7. Convex data model

Define in `convex/schema.ts`. All timestamps are Convex numbers (ms).

```
users
  name, email, role ("owner" | "manager" | "worker"), phone, joinedAt

cows
  tagNumber (unique), name, breed, dateOfBirth, status
  ("milking" | "dry" | "treatment" | "calf" | "sold" | "deceased"),
  currentLactationNumber, lastCalvingDate, sireInfo, damTagNumber, notes

milkingSessions
  cowId, session ("AM" | "PM"), date (YYYY-MM-DD), litres,
  loggedBy, loggedAt, flagged

treatments
  cowId, date, condition, drugAdministered, dosage,
  withholdingDays, withholdingUntil, administeredBy, notes

services (breeding)
  cowId, date, type ("AI" | "natural"), bullOrSemenCode,
  performedBy, notes

pregnancyDiagnoses
  cowId, date, result ("pregnant" | "open" | "uncertain"),
  expectedCalvingDate, performedBy

calvings
  cowId, date, calfSex, calfTagNumber, sireInfo, complications, notes

calves
  tagNumber, name, dateOfBirth, sex, damTagNumber, sireInfo,
  weaningDate, currentWeight, status

fields
  name, crop ("wheat" | "barley" | "maize" | "lucerne" | "fallow"),
  acres, plantedDate, expectedHarvestDate, notes

fieldApplications
  fieldId, date, type ("fertilizer" | "herbicide" | "pesticide" | "seed"),
  product, rate, appliedBy

harvestRecords
  fieldId, date, crop, bags, bagWeightKg, notes

contracts
  buyer, crop, contractedBags, pricePerBag, season, status, signedDate

deliveries
  contractId, date, bags, vehicleRef, notes

feedInventory
  type ("silage" | "concentrate" | "minerals" | "hay"),
  product, quantity, unit ("tonnes" | "bags" | "kg"), updatedAt

vetInventory
  product, category ("antibiotic" | "vaccine" | "dewormer" | "minerals" | "semen"),
  quantity, unit, lowStockThreshold

tasks
  title, description, assignedTo, assignedBy, status
  ("pending" | "in_progress" | "done"),
  dueDate, completedAt
```

Indexes: `cows.by_status`, `cows.by_tag`, `milkingSessions.by_cow_and_date`,
`milkingSessions.by_date`, `treatments.by_cow`,
`treatments.by_withholding_until`, `deliveries.by_contract`,
`services.by_cow`, `tasks.by_assigned_to`.

---

## 8. Seed data

`convex/seed.ts` populates a working farm. Run it once after schema
deploy.

- 28 cows, tags EL-001 through EL-028, Kenyan names (Wambui, Akinyi,
  Chebet, Wairimu, Nasimiyu, Kanini, Atieno, Naliaka, Jeptoo, Cherop,
  Auma, Wanjiku, Kemunto, Nyambura, Sanaipei, Jelagat, Wanjiru,
  Chemtai, Adhiambo, Mwende, Soila, Cherono, Wangari, Kanana, Akoth,
  Cherotich, Mukami, Njeri), realistic ages and lactation numbers.
- 30 days of AM/PM milking history per active cow with believable
  variance (10–22 litres/session, lower in late lactation, zero for
  dry cows).
- 4 active treatments with unexpired withholding periods covering
  different drugs.
- 6 calvings in the last 90 days.
- 12 fields across the four crop types matching the 450/350/150
  acreage split.
- 1 EABL barley contract: 350 acres, 3,150 bags, Sh3,100/bag, 2026
  long rains, with 8 deliveries logged (~600 bags delivered so far).
- 4 wheat harvest records across recent seasons.
- 6 workers including Kibet, Chebet, and Wanjiru.
- 8 active tasks across the workers.
- Realistic vet inventory and feed inventory.

---

## 9. Build order

Execute in this order. Stop after each phase, verify visually and
typecheck, then continue.

1. Scaffold Next.js + TypeScript + Tailwind + Convex. Wire fonts.
   Define palette CSS variables. Render an empty page using
   `--paper` and `--ink`. Confirm the typography feels right before
   anything else.
2. Implement schema and seed script. Run seed. Verify in Convex
   dashboard.
3. Build the Wordmark component and favicon. Set Next.js head.
4. Build Convex Auth and role-based routing. Three seeded accounts
   (Margaret, David, Kibet).
5. Build the sidebar shell and the bottom tab bar. The shell must
   feel right with no content before you build any pages.
6. Build the public pages (landing, signin).
7. Build the owner surface end to end.
8. Build the manager surface — herd, cow profile, milking,
   withholding (this is the highest-stakes screen).
9. Build the rest of the manager surface — treatments, breeding,
   calvings, calves, feed, fields, contracts, harvest, tasks,
   workers, inventory.
10. Build the worker surface.
11. Verify every link in every sidebar and every page leads to a
    real, rendered route with real data. No exceptions.
12. Verify the 380px viewport on every page.
13. Write a brief README with a screenshot.
14. Configure `render.yaml` and `manifest.json` and the service
    worker. Deploy to Render.

After every phase: `tsc --noEmit` must pass with zero errors.

---

## 10. Code conventions

- Convex functions in `convex/`. Client components explicit with
  `"use client"`.
- One feature per folder under `app/`. Co-locate components only
  used by one route.
- Shared primitives in `components/ui/`. Domain components
  (CowCard, MilkEntryRow, WithholdingBadge) in `components/`.
- No `any`. No `@ts-ignore`. If a type is hard, ask in a comment.
- No console.log in committed code.
- Comments explain why, not what.

---

## 11. Voice and copy

Write every string in the UI in the voice of someone who has been
on a Kenyan dairy farm. Plain. Specific. Slightly understated.

Yes: "Wairimu — milk withheld until 18 May. Do not add to bulk tank."
No: "⚠️ Milk withholding active for this animal!"

Yes: "Six cows are due to calve in the next 60 days."
No: "Maximize your calving outcomes with real-time insights!"

Yes: "No tasks today."
No: "🎉 You're all caught up!"

No emojis. No exclamation marks unless something is genuinely urgent.
No "AI-powered" anywhere. No "seamless," "unlock," "empower,"
"leverage," "harness," "transform."

---

## 12. Things to actively avoid

- Decorative gradients
- Glassmorphism, backdrop-blur, frosted effects
- Stock icons as page decoration
- Three-column feature grids
- Hero sections with centered headline + two CTAs
- Toast notifications for routine success
- Modal dialogs where a page would do
- Brown anywhere in the palette
- Default Tailwind gray, slate, zinc, or green
- Lorem ipsum or placeholder strings
- The phrase "powered by AI"

---

## 13. Done means

A reviewer can:
1. Clone, `npm install && npx convex dev && npm run dev`
2. Sign in as David Ngetich on a phone-sized window
3. Log AM milk for all 28 cows in under three minutes
4. See a cow under withholding refuse the entry with a clear,
   specific banner
5. Open the EABL contract and see 8 real deliveries against 3,150
   contracted bags
6. Sign in as Margaret Kamar and see a weekly summary that lets her
   understand the farm without speaking to David
7. Navigate every link in every sidebar without hitting a 404,
   an empty page, or a dead button
8. Install the app to a phone home screen and open it from the icon
9. Feel that this was built by someone who actually understood the
   farm

Build it that way.
Two notes on using this:

Step-gate it. Open Claude Code in an empty directory. Tell it: "Read PROJECT_BRIEF.md. Execute phase 1 only. Stop and show me before continuing." Review what it built. Then phase 2. The temptation to let it run all 14 phases unattended is strong — resist it. You'll get a much better result by reviewing the visual system after phase 5 (the empty shell) than by trying to fix it after phase 14.

The withholding screen is the demo. When you get to phase 8, spend extra time. That screen is what Margaret will remember. Everything else can be competent; that one needs to feel right when she taps it on your phone.

Let me know once you start building and want a second pair of eyes.
