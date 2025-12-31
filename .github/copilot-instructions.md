# Copilot Instructions (Repository-wide)

## Command & Tooling Rules

- When suggesting Node package manager commands, **use `npm.cmd` instead of `npm`** for installs, script runs, and package management on Windows.
- When suggesting command sequences that operate in a specific folder, **insert `cd <relative-or-absolute-path>` first** to set the working directory, then show the next command on a new line
- Do **not** generate `.sh` or `.ps1` files; provide single-line commands or documented steps only.
- Prefer Windows-friendly command examples; if a Unix-only command is typical, include a Windows equivalent.

## Backend (contoso-api) Rules

- Prisma commands should be documented with SQLite context (no feature changes): `prisma migrate dev`, `prisma generate`; keep the existing schema and behavior intact.
- JWT usage must **preserve current claims/roles and token lifetimes**; do not alter auth flows—document parity only.

## Frontend (React + TS) Rules

- UI guidance must use **Bootstrap** components and classes.
- State management must use **Redux Toolkit** (slices/selectors/actions) and mirror existing view-models.
- Testing examples use **Jest** (frontend) and **Mocha + Chai** (backend) with the **same assertions** and **coverage intent** as the current tests.

## Documentation Rules

- When producing migration or planning docs, write to `Docs/planning/` only.
- Link related files with **relative paths**; include **Mermaid** diagrams where helpful.
  ``
