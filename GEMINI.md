<!-- GSD:project-start source:PROJECT.md -->
## Project

**OpenNote Backend Architecture Iteration (v2)**

**Core Value:** A robust, purely local-first data retrieval and event-driven persistence layer that avoids constant disk I/O, communicates clearly with the frontend via IPC events, and prevents race conditions through dedicated layered responsibilities.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Frontend Core
- **Framework**: React 19 (`react`, `react-dom`)
- **Language**: TypeScript (`~5.9.3`)
- **Build Tool**: Vite (`vite`) with `@vitejs/plugin-react`
- **Routing**: React Router (`react-router-dom`)
- **State Management**: Zustand (`zustand`)
- **Internationalization**: i18next (`i18next`, `react-i18next`)
## Frontend UI & Styling
- **CSS Framework**: Tailwind CSS 4 (`@tailwindcss/vite`, `tailwindcss`)
- **Component Primitives**: `@base-ui/react`, `@radix-ui/react-accordion`, `@radix-ui/react-scroll-area`
- **Icons**: Lucide React (`lucide-react`)
- **Utility Libraries**: `clsx`, `tailwind-merge`, `class-variance-authority` (for component variants)
## Backend (Tauri)
- **Core Framework**: Tauri 2 (`tauri`, `tauri-build`, `tauri-cli`)
- **Language**: Rust (`edition 2021`)
- **Database**: SQLite via `rusqlite`
- **Plugins**:
## Utility (Rust)
- **Serialization**: `serde`, `serde_json`
- **Utilities**: `uuid` (v4), `chrono`, `base64`, `mime_guess`, `zip`, `pathdiff`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Formatting & Linting
- **Prettier/ESLint**: Uses `eslint.config.js` for Javascript/TypeScript rules (ESLint 9).
- **TypeScript**: Strict validation enabled (`"strict": true`). Configured using `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json`.
## Code Styles
### React
- Pure functional components with hooks.
- **Imports**: Aliases `@/` via Vite and TS paths pointing to `/src`.
- **States**: Shared/global states defined in the `stores` folder, wrapping contexts utilizing `zustand`. Local states using `useState`.
### Styling (CSS)
- Mixed usage of Tailwind CSS 4 (`@tailwindcss/vite`) and Vanilla CSS (`index.css`). Use Tailwind for layout wrappers, but default to basic CSS classes if users mandate flexibilities.
### Rust Backend
- Function definitions must use `snake_case` (e.g. `read_file_by_path`).
- Types, Structs, Enums should use `PascalCase`.
- Uses `anyhow::Result` implicitly mapped through a custom `crate::error::Result<T>` resolving generic issues to front-end serializable string errors natively.
## Project Metadata
- Dependencies are pinned loosely but consistently, updated effectively using React 19 methodologies standard to modern Vite plugins.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Overview
### Rust Backend
### React Frontend
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
