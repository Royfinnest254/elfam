# Elfam: Mixed Agribusiness Farm Management System

Elfam is a premium, high-performance Mixed Agribusiness Farm Management System. It transitioned from a cattle-specific logger to a generalized multi-species agricultural platform supporting livestock (cattle, goats, sheep, pigs, poultry, bees) and crop operations with integrated soil health logging.

Designed with a premium **Highland Green & Cream** visual theme, Elfam enforces zero border-radius (`rounded-none`), flat card hairlines, and high-contrast typography (Fraunces Display for headings, Inter Tight for text, and JetBrains Mono for telemetry/data).

---

## Key Features

- **Multi-Species Support**: Registered individual livestock (cattle, goats, sheep, pigs) and group cohorts (poultry flocks, bee hives) are tracked under a unified directory schema.
- **Role-Based Workspaces**:
  - `Supervisor (Executive)`: Accesses gross agribusiness revenue, staff directories, active contracts, and print-ready reports.
  - `Manager (Operations)`: Registers animals, manages crop fields, logs soil test ledgers, issues requests, and schedules task assignments.
  - `Worker (Logistics)`: Simplified dashboard containing task lists, equipment status logs, and a custom touchscreen numpad layout for fast production yield entries.
- **Daily Production Logs**: Supports generalized collections for milk (litres), eggs (units count), wool (kg), honey (kg), and animal weight (kg) with session filtering.
- **Medication Withholding Safeguards**: Logs veterinary treatments and auto-flags contaminated production yields as withheld in real-time if a withdrawal window is active.
- **Soil Quality Ledger**: Crop fields feature an operational quality ledger tracking pH, Nitrogen, Phosphorus, and Potassium levels over time.
- **Agribusiness Onboarding Wizard**: A 3-step setup flow with a custom agribusiness avatar picker (Tractor, Cow, Goat, Poultry, Grain, Nerve Centre).
- **Danger Zone Database Wipes**: Manager-level capability to clear the database and instantly seed 30 days of generalized multi-species datasets and mock active contracts.

---

## System Architecture

For a comprehensive guide detailing entity-relationship diagrams (ERD), database schemas, component data flows, and role routing layouts, refer to the architecture file:
- **[System Architecture Guide](file:///c:/Users/roych/Downloads/Elfam/docs/architecture.md)**

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Convex (Real-time document storage)
- **Styling**: Tailwind CSS (Strict custom brand tokens)
- **Type Safety**: TypeScript

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Configure your local environment variables in `.env.local` using `.env.example` as a reference.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build Production Bundle
```bash
npm run build
```
