# Memory

## Active Projects
- **Elfam Agrimetrics**: High-fidelity farm management application prototype for Elfam Limited, Uasin Gishu County, Kenya.

## Key Decisions
- **Database Schema & Seed**: Realigned data models with 20-table architecture including machinery, maintenance, rainfall logs, and transactions. Refactored seeds to use lightweight baselines, solving performance/slow loading times.
- **Theme & Style Realignment**: Standardized theme tokens. Systematically replaced all occurrences of legacy Swiss Side blue hex codes (#0052CC, #2684FF, #DEEBFF) with Tailwind theme tokens (primary, primary-subtle, primary-dark, primary-light) across all manager and worker routes to ensure visual compliance.
- **Security Hardening**: Removed dangerous database purge/reset operations from the UI in the settings page to enforce database integrity.

## Known Issues
- None.

## Lessons Learned
- Ensure seed operations perform bulk insertions instead of thousands of loops to optimize server startup and prevent connection timeouts.

## People and Network
- Prof. Margaret Kamar, Owner & Director.
- Maria Soti, Co-owner.
- David Ngetich, General Manager.
- Roy, Developer (Connex CEO / CHI ICT Officer).
