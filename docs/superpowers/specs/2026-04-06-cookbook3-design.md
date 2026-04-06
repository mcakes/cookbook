# Cookbook3 -- Personal Recipe App Design

## Overview

A personal digital cookbook app for storing, organising, and browsing recipes. Built as a React SPA with GitHub as the data store, deployed as a static site. Designed for a single editor (the owner) with read-only access for friends and family.

## Goals

- Store and organise 100-500 recipes as markdown files
- Edit recipes from the browser using a markdown editor with live preview
- Track metadata: ratings, cook log (dates + notes), tags, prep/cook time, servings
- Search by text, tags, and ingredients ("I have chicken and peppers -- what can I make?")
- Lightweight meal planning with auto-generated shopping lists
- Static hosting, no server, free tier

## Non-Goals

- Multi-user editing or user accounts
- Commercial features (payments, subscriptions, public recipe sharing)
- Import from external recipe sites (could be added later)
- Mobile-native app (responsive web is sufficient)

## Architecture

### Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React + TypeScript | Mature ecosystem, good markdown editor libraries |
| Build | Vite | Fast builds, static export, good DX |
| Styling | TailwindCSS | Rapid styling, responsive out of the box |
| Search | Fuse.js | Client-side fuzzy search, handles 500 recipes easily |
| Data store | GitHub repo (markdown files) | Free, version history via git, no server |
| Auth | GitHub Personal Access Token | Stored in localStorage, enables GitHub API writes |
| Hosting | GitHub Pages or Netlify | Free static hosting, auto-deploy on push |

### Data Flow

- **Read path:** At build time, a script generates a recipe index JSON file containing all frontmatter (title, tags, rating, ingredients, etc.) for every recipe. The SPA loads this index on startup for browsing, filtering, and search. When a user opens a specific recipe, the app fetches the full markdown file from the GitHub API on demand. This avoids fetching all files upfront while keeping browse/search instant.
- **Write path:** When the owner is authenticated (PAT in localStorage), edits are committed via the GitHub Contents API. This triggers a rebuild and redeploy of the static site.
- **Search:** All recipe frontmatter is loaded client-side. Fuse.js builds an index over titles, ingredients, and tags for instant fuzzy search.

### Repository Structure

```
cookbook3/
├── src/                    # React app source
│   ├── components/         # UI components
│   ├── pages/              # Route-level page components
│   ├── lib/                # Utilities (GitHub API, markdown parsing, search)
│   └── types/              # TypeScript types
├── recipes/                # Recipe markdown files
│   ├── chicken-tikka-masala.md
│   ├── sourdough-bread.md
│   └── ...
├── images/                 # Recipe images
│   ├── chicken-tikka-masala.jpg
│   └── ...
├── public/                 # Static assets
├── docs/                   # Documentation
└── package.json
```

## Data Model

Each recipe is a markdown file with YAML frontmatter:

```markdown
---
title: "Chicken Tikka Masala"
slug: chicken-tikka-masala
tags: [indian, curry, chicken, weeknight]
rating: 4
servings: 4
prep_time: 20
cook_time: 35
image: chicken-tikka-masala.jpg
ingredients:
  - 500g chicken breast, cubed
  - 200ml yoghurt
  - 400g tinned tomatoes
  - 1 onion, diced
  - 3 cloves garlic, minced
  - 2 tsp garam masala
  - 1 tsp turmeric
  - 1 tsp cumin
cook_log:
  - date: 2026-03-15
    notes: "Used double cream instead of yoghurt, richer"
  - date: 2026-01-22
    notes: ""
created: 2026-01-10
updated: 2026-03-15
---

## Method

1. Marinate chicken in yoghurt and spices for at least 30 minutes...

## Notes

- Works well with lamb too
- Leftovers freeze perfectly
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | yes | Display name of the recipe |
| slug | string | yes | URL-safe identifier, matches filename |
| tags | string[] | no | Freeform tags for filtering (cuisine, protein, meal type) |
| rating | number (1-5) | no | Personal rating |
| servings | number | no | Base serving count for the recipe |
| prep_time | number | no | Prep time in minutes |
| cook_time | number | no | Cook time in minutes |
| image | string | no | Filename of the recipe image in images/ |
| ingredients | string[] | yes | List of ingredients with quantities |
| cook_log | array of {date, notes} | no | History of when the recipe was made |
| created | date | yes | Date the recipe was added |
| updated | date | yes | Date of last edit |

## Pages and Features

### Home / Browse

The landing page. Displays a grid of recipe cards showing the image (or placeholder), title, rating, and tags.

- **Filtering:** By tag, by rating (minimum), by ingredient
- **Sorting:** Recently cooked, rating (high to low), newest, alphabetical
- **Quick search:** A search bar at the top for instant filtering

### Search

Dedicated search page with two modes:

1. **Text search:** Fuzzy search across title, ingredients, tags, and notes. Powered by Fuse.js.
2. **Ingredient search:** Select or type ingredients you have on hand. The app shows recipes that match the most selected ingredients, ranked by match count. Partial matches are shown with a note of what's missing.

### Recipe View

The reading experience for a single recipe.

- Hero image (if present) with title overlay
- Metadata bar: rating (stars), servings, prep time, cook time
- Ingredients list with serving scaler (adjust servings, quantities update proportionally)
- Method steps rendered from markdown
- Cook log displayed as a timeline (dates with optional notes)
- Notes section
- Edit button visible only when authenticated

### Recipe Editor

Available only when authenticated (PAT present in localStorage).

- **Metadata form** at the top: title, tags (tag editor with autocomplete from existing tags), rating (star picker), servings, prep/cook time, image upload (drag and drop)
- **Ingredients editor:** Line-by-line ingredient entry
- **Markdown editor** for the body (method, notes, etc.) with live preview side-by-side
- **Cook log:** Add new entries via a date picker + notes field
- **Save:** Commits the markdown file to GitHub via the Contents API. New recipes create a new file; edits update the existing file.
- **Delete:** Removes the file from the repo (with confirmation)

### Meal Planner

A lightweight weekly planning view.

- 7-day grid (Mon-Sun)
- Click a day to assign recipes (search/browse to pick)
- Auto-generated shopping list: combines ingredients from all selected recipes, deduplicates where possible
- Shopping list has checkboxes for ticking off items
- **Storage:** Meal plans are stored in localStorage, not committed to git. They are ephemeral and personal.

## Authentication

No traditional auth system. The app uses a GitHub Personal Access Token (PAT) for the single-editor model:

1. The owner generates a PAT with `repo` scope from GitHub settings
2. In the app, a settings page (or modal) accepts the PAT
3. The PAT is stored in localStorage
4. When present, the app shows edit/new/delete UI and uses the token for GitHub API calls
5. Visitors without a PAT see a read-only experience -- no login prompt, no edit buttons
6. The login entry point is intentionally low-profile (e.g. a small icon in the footer)

### Security Considerations

- The PAT is stored in the browser only -- never committed to the repo or exposed in the built app
- The PAT should be scoped to the minimum necessary permissions (repo contents)
- The app should use fine-grained PATs (scoped to the single recipe repo) when available

## Error Handling

- **GitHub API rate limiting:** Show a clear message if the rate limit is hit. Authenticated requests get 5000/hour which is more than sufficient.
- **Save failures:** If a commit fails (e.g. conflict), show the error and let the user retry. The editor should not lose unsaved content.
- **Offline/network issues:** The app is read-heavy. Recipe data can be cached in localStorage or service worker for offline reading. Writes require connectivity.

## Testing Strategy

- **Unit tests:** Markdown parsing, frontmatter validation, ingredient quantity scaling, search indexing
- **Component tests:** Key UI components (recipe card, editor, search results)
- **Integration tests:** GitHub API interaction (mocked), full edit-save-render cycle
- **Manual testing:** Recipe creation, editing, and search with real data
