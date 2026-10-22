# Contributing to E-CHAKRA

[Home](README.md) · [Setup](docs/setup.md) · [Requirements](docs/requirements.md) · [Security](SECURITY.md)

1. Start from the current main branch and create a focused branch.
2. Link the change to a requirement or a documented limitation. Explain the collector/recycler behaviour it changes.
3. Use only synthetic fixtures in public code, tests and issues. Keep credentials and real participant records out of Git.
4. Update implementation status and relevant diagrams/docs when behaviour changes. Keep planned integrations visibly separate.
5. From `prototype/`, run `pnpm run verify`. For browser changes, also record the relevant manual device checks; an unrun check stays pending.
6. Open a pull request with the problem, change, test evidence and limitations. Credit reused code/assets and disclose substantial tool-assisted work appropriately.

## Review focus

Preserve owner scope, stable draft IDs, version checks and separate handover/payment confirmations. Never replace missing field evidence with estimated results, turn a demo label into a partner-verification claim, or add a production authentication bypass to make a demo easier.

Keep the dependency lockfile. Do not commit `node_modules`, build output, local database state or personal survey responses. New migrations must be generated/reviewed, not executed as runtime table-creation code.
