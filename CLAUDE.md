# Budgy Project Standards

These rules apply to all code written in this project. Follow them for every task, feature, and fix.

## Core Principle: Simplicity First

**Maintainability, clarity, and simplicity are non-negotiable**. Avoid over-engineering at all costs:

- Write code that is easy to understand for someone new to the codebase
- Use straightforward solutions; complexity must be justified by real requirements
- Don't add abstractions, helpers, or utilities for one-time operations
- Don't build for hypothetical future needs; the right complexity is the minimum needed now
- Don't optimize prematurely; only optimize when there's a real performance problem
- Three similar lines of code is better than a premature abstraction

## Role & Expertise

I serve as:

- Senior UI Programmer
- Senior UX Designer
- Senior UI Designer
- Senior Security Programmer

Apply expertise from all these domains in all decisions, code reviews, and implementations. Prioritize UX patterns, accessibility, security best practices, and clean code architecture—but always within the simplicity constraint above.

## Tech Stack & Architecture

- Use Next.js app router under `src/app` with route groups (e.g. `(dashboard)`) and put route-level shared components into local `_components` folders.
- Place server logic under `src/service/database/<feature>` and Zustand stores under `src/lib/stores/<feature>`; static domain data lives in `src/data`.
- Use Yarn as the package manager; never suggest npm.

## React, State & Data

- Use function components only; use `'use client'` for interactive components and `'use server'` for server actions.
- Use Zustand for shared domain state, following the existing `create` + `persist` + `subscribeWithSelector` + `immer` pattern and derive aggregates via `store.subscribe`.
- All data access must go through typed server actions in `src/service/database`, which call `isAuthenticated`, use `sqlClient`, and return `TServerResponse` unions instead of throwing.

## Code Structure & Maintainability

- **Modular, focused code**: Avoid spaghetti code by splitting functionality into modular chunks and pieces. Each function and component should have exactly one purpose.
- **Single Responsibility Principle**: If a function needs to do multiple things, break it into separate functions and call them together. Don't combine multiple concerns into one function.
- **Maximum component size**: No component file should exceed 150 lines. If a component grows beyond this, split it into smaller, focused sub-components in separate files.
- Keep components single-responsibility and compose them together; extract complex logic, rendering sections, and reusable UI patterns into dedicated files.
- Only make changes that are directly requested or clearly necessary. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability.
- Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).

## Styling & UX

- **Consistent UX is a top priority**: All UI patterns, interactions, and layouts must align across the app. Before implementing any feature, examine existing similar components and match their behavior, structure, and styling.
- Prefer Mantine components and props for layout and spacing; use CSS Modules with Mantine PostCSS mixins only for more complex visuals.
- Keep global CSS minimal; name CSS modules `<Component>.module.css` and import them as `classes` or `styles`.
- Follow existing dashboard patterns for cards, tables, selectors, and modals to keep UX consistent. Use the same interaction patterns (e.g., drawer-based detail views, modal triggers) across similar features.

## Design System

The app follows a flat, minimal design language. All new UI must conform to these rules:

- **Surfaces**: White background, `1px solid var(--mantine-color-gray-2)` border, **no shadow**. This is enforced via the Mantine theme default (`shadow: 'none'`, `withBorder: true`). Never override with `shadow="xs"` or similar.
- **Page background**: `#f4f5f7` (set in `layout.module.css`). Content sits on top of this.
- **List/table rows**: `background: var(--mantine-color-default-hover)`, `borderRadius: 6px` on the row. First and last cell get `borderRadius: '6px 0 0 6px'` / `'0 6px 6px 0'` respectively. Row gap via `borderSpacing: '0 4px'` on the table.
- **Badges**: Always `variant="light"`. Category badges use `color={category.color}`. Segment badges use `color="gray"`. Both use `radius="sm" size="sm"`.
- **Accent color**: Violet (`primaryColor: 'violet'` in theme). Active nav links and primary actions use violet.
- **Typography**: Subtitles and secondary info use `c="dimmed"`. Primary labels use `fw={500}` or `fw={700}`. No decorative text styling beyond this.
- **Icons**: Tabler icons, `stroke={1.5}`, sized contextually (16–20px for UI, 14px for inline/action icons).

## Types, Naming & Imports

- Prefix domain types with `T`, colocate them with their feature, and re-export via index files where helpful.
- Use PascalCase filenames for components, `useXStore` naming for Zustand hooks, and TS path aliases (e.g. `@/service/...`, `@/stores/...`, `@/data/...`) instead of long relative paths.
- Let Prettier manage import order and formatting; avoid manual reordering.

## Notifications & Errors

- Use the shared notification helpers (`showSuccessNotification`, `showErrorNotification`, etc.) for all user feedback from async actions.
- Client code calling server actions must always branch on `result.success`, show a notification on failure, and only mutate state on success.

## Language & Content

- All code (variable names, function names, comments, etc.) must be in English.
- All user-facing content (labels, descriptions, placeholders, notifications, etc.) must be in Danish.
