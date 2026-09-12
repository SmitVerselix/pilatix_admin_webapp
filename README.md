# Pilatix Admin

Admin panel for the Pilatix backend, built on the Ynex TypeScript + TailwindCSS
React template (Starterkit). Every screen talks to the real API in
`Desktop/pilatix_backend` — there is no mock data anywhere in the app.

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm run dev
```

The backend must be running (`npm run dev` in `pilatix_backend`, default port 8080).

| Script            | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Vite dev server on http://localhost:5173 |
| `npm run build`   | Typecheck + production build to `dist/`  |
| `npm run preview` | Serve the production build               |
| `npm run typecheck` | Types only, no emit                    |

### Environment

```
VITE_API_BASE_URL=http://localhost:8080
```

The **origin only** — scheme, host, port. No trailing slash, and deliberately
no `/api/v1`.

The version segment lives in `src/api/endpoints.ts`, alongside the paths:

```ts
const V1 = '/api/v1';
const ADMIN = `${V1}/admin`;
```

Keeping it there means a second version can run beside the first — declare
`const V2 = '/api/v2'` and repoint only the endpoints that actually moved.
Had the version stayed in the env var, the whole app would be pinned to one
version and a partial migration would be impossible.

A value that still ends in `/api/v<n>` is tolerated: the client strips it and
warns in dev, so a deployed env var left over from the old layout keeps working
instead of silently requesting `/api/v1/api/v1/...`.

## How the API layer is wired

```
src/api/
  endpoints.ts   every backend path in one place
  client.ts      axios instance, bearer-token interceptor, envelope unwrapping
  storage.ts     token / user / device-id persistence (+ passwordHash stripping)
  types.ts       types mirroring the backend models and Joi schemas
src/services/    one module per resource, the only place components call the API
src/auth/        AuthProvider + route guards
```

The backend wraps every response as `{ success, status, message, payload }`;
`request()` unwraps `payload`, and `requestWithMessage()` keeps `message` for
success toasts. Failures are normalised into `ApiError` carrying the backend's
own message, which is what the screens display.

### Endpoints used

| Screen          | Method & path                            |
| --------------- | ---------------------------------------- |
| Sign in         | `POST /admin/auth/login`                 |
| Log out         | `POST /admin/auth/logout`                |
| Add user        | `POST /admin/auth/register`              |
| Roles list      | `GET /admin/role`                        |
| Roles create    | `POST /admin/role`                       |
| Roles update    | `PUT /admin/role/:id`                    |
| Roles delete    | `DELETE /admin/role/:id`                 |
| Users list      | `POST /admin/dashboard/list-users`       |
| User detail     | `POST /admin/dashboard/get-user-by-id`   |
| User activity   | `POST /admin/dashboard/get-login-history-by-user-id` |
| Login history   | `GET /admin/login-history`               |
| File upload     | `POST /admin/upload/upload-single`       |
| Profile read    | `GET /web/user/profile/profile`          |
| Profile update  | `PUT /web/user/profile/profile`          |

### Session handling

`POST /admin/auth/login` requires `deviceType`, and `logout` only writes a
history row when the same `deviceId` comes back. A UUID is generated once per
browser and kept in `localStorage` (`pilatix.admin.deviceId`) so a login and its
matching logout share a device.

The login response has no `role` include, so `AuthProvider` follows a successful
login with a profile read to fill it in. It also strips `passwordHash`, which
the API currently returns on both login and profile reads, before anything is
persisted.

When the API answers with `Invalid token.` / `Token required.` /
`Account disabled.`, the interceptor clears the session and the route guard
drops the user back to sign-in.

## Backend gaps worth knowing

These are API limitations, not missing UI:

- **The user list lives under `dashboard`, and it is a POST.**
  `POST /admin/dashboard/list-users` — filters travel in the body, not the query
  string. Admin-only (the auth middleware also lets `superadmin` through).
- **No delete-user endpoint**, so accounts created here cannot be removed from
  the panel.
- **Login history is self-scoped.** `LoginHistoryService` reads `req.user.id`,
  so an admin sees only their own events, never other users'.
- **`ipAddress` / `userAgent`** used to be null for every email login — fixed in
  the backend, see *Login payload* below. Rows written before that fix still show
  `—`.
- **The profile routes are not mounted under `/admin`.** `user.routes.ts` is
  only mounted in the `web` and `app` groups, hence the `/web/user/...` path —
  and the doubled segment (`/profile/profile`) is how the route tree nests.
- **Role names are restricted to the API's enum** (`admin`, `user`,
  `external_user`, `guest`), so the name field is a select. The seeded data also
  contains `superadmin`, which is outside that enum: the edit form shows it but
  renaming it would be rejected, so only its description can be changed.

## User list

`POST /admin/dashboard/list-users` — note it is a **POST** and the filters go in
the **body**, which is easy to trip over:

| Field | Default | |
| --- | --- | --- |
| `page` | 1 | |
| `limit` | 10 | |
| `sortBy` | `createdAt` | `createdAt` \| `name` \| `email` |
| `sortOrder` | `DESC` | `ASC` \| `DESC` |
| `search` | — | case-insensitive across name, email **and** mobile |
| `roleId` | — | uuid; an unknown one is rejected with "Role not found.", not an empty list |
| `isActive` | — | omit for both active and disabled accounts |

Returns Sequelize's `{ count, rows }`. Rows exclude `passwordHash` and include
only `{ id, name }` from the joined role — hence the `UserListItem` type rather
than reusing `User`.

## User detail

`/users/:userId` combines the two per-user admin endpoints. Both are POSTs under
`dashboard` and both take the id in the body.

**`get-user-by-id`** — `{ userId }`. Returns a *narrower* column set than the
list endpoint (no `currentDeviceId`; `isActive` is the only Base field), but
adds three things the list does not have: `lastActiveAt`, the role's
`description`, and the full `devices` array. That is why it has its own
`UserDetail` type instead of reusing `UserListItem`. An unknown id comes back as
**400 "User not found."**, not a 404 — the page renders that message as an empty
state rather than a crash.

**`get-login-history-by-user-id`** — `{ userId, page, limit, sortBy: 'createdAt',
sortOrder, search }`. Returns `{ count, rows }`; `search` matches `deviceId`,
`ipAddress`, `type`, `status` or `reason`. Unlike `/admin/login-history`, which
`LoginHistoryService` scopes to `req.user.id`, this one reads any account's
activity — so it is the endpoint to use for looking at someone else.

Rows here carry no joined user (the self-scoped endpoint includes one), but the
shape is otherwise identical, so `LoginHistoryEntry` is reused.

## Login payload

`POST /admin/auth/login` accepts exactly these fields:

| Field | | |
| --- | --- | --- |
| `email` | required | |
| `password` | required | |
| `deviceType` | required | `ios` \| `android` \| `web` — anything else is rejected |
| `deviceId` | optional | a uuid is generated when omitted |
| `deviceName` | optional | free-text label, e.g. "Chrome on macOS" |
| `pushToken` | optional | |

The validator runs with `stripUnknown: true`, so **any other key is silently
dropped** — the request still returns 200 and the data is simply discarded.
That is what made this easy to get wrong: sending `ipAddress` in the body looks
like it worked.

**IP and user agent are recorded by the server, not sent by the client.** A
browser cannot know its own public address without calling a third-party lookup
(which leaks the user's IP to that service), and any value the client supplies
can be forged — worthless in what is a security audit log. The backend now reads
them from the request in `src/helpers/request.helper.ts` and records them on
login, logout, social login and guest login.

One deployment note: `req.ip` is only the true client address when Express knows
how many proxies sit in front of it. The backend reads a `TRUST_PROXY` env var —
leave it unset when directly exposed, set it to `1` behind a single load
balancer. Without it a proxied deployment logs the balancer's address for every
user (and rate-limits everyone as one client). Setting it too permissively lets
callers forge `X-Forwarded-For`, so it is deliberately opt-in.

## Theme

The default palette is derived from the logo. Colours live as Tailwind-style
`R G B` triples on `:root`, defined in **two** places that must stay in sync:
`src/assets/scss/_variables.scss` (the source) and `src/assets/css/style.css`
(the compiled sheet `index.scss` actually imports).

| Token | Value | Where it shows |
| --- | --- | --- |
| sidebar / dark menu | `#334e3f` | the logo's own green, used as a large surface |
| `--primary` | `#3f8d62` | buttons, links, active nav, charts |
| `--secondary` | `#8d7a35` | secondary actions and badges |

`--primary` is **not** the raw logo green. The `.dark` theme does not redefine
it, so one value serves both themes, and `#334e3f` scores **1.87:1** against the
dark body — unreadable as link text. `#3f8d62` keeps the logo's hue (147°) but
is lifted until it clears 4:1 on white, on the dark body, and under white text.
`--secondary` is the logo's gold hue (47°) darkened the same way; the template's
old cyan managed only 2.34:1 on white, so white icons on it were failing.

Measured on the running app:

| | light | dark |
| --- | --- | --- |
| primary link on card | 4.04 | 3.71 – 4.23 |
| gold link on card | 4.23 | 3.55 – 4.04 |
| white on primary button | 4.04 | 4.04 |
| menu label on sidebar | 9.12 | 9.12 |

That clears WCAG AA for UI components and large text (3:1) everywhere, and sits
just under the 4.5:1 ideal for small body text in dark mode — a limitation
inherited from the template using a single `--primary` across both themes.
Giving `.dark` its own lighter primary would fix the links but push white-on-
button below 4.5, so it is a genuine trade-off rather than an oversight.

Semantic colours (success / danger / warning / info) are deliberately unchanged
— they carry meaning, not brand. Chart colours are read from these CSS variables
at runtime by `src/hooks/use-theme-colors.ts`, so they follow the theme and the
switcher automatically.

### Dropdowns

Every dropdown is `src/components/common/form/select.tsx`, not a native
`<select>`. A native select paints its own arrow and hands its option list to
the OS, so the list cannot follow the theme — in dark mode it opens as a white
OS menu. This is the ARIA combobox/listbox pattern, so the trigger *and* the
list are ours to style.

It keeps the behaviour a select is expected to have: type-ahead, Arrow/Home/End
navigation, Enter or Space to choose, Escape to dismiss, click-outside to close,
focus returned to the trigger, `aria-activedescendant` on the focused trigger,
and the panel flipping above the trigger when the viewport has no room below.

Scrolling deliberately does **not** close it — the panel is absolutely
positioned inside the trigger's wrapper, so it travels with the trigger, and
closing on wheel events fights anyone scrolling a long form.

```tsx
<Select
    ariaLabel="Filter by role"
    icon="ri-shield-user-line"     // optional leading icon
    size="sm"                       // "sm" for filters, "md" to match .form-control
    value={roleId}
    onChange={setRoleId}
    options={[{ value: '', label: 'All roles' }, ...]}   // `hint` renders muted, right-aligned
/>
```

For a labelled form field pass `id` plus `labelledBy` pointing at the
`<label>`'s id — the trigger is a button, so `htmlFor` alone does not name it.

### Careful with dynamic class names

Tailwind only emits utilities it can see as literal strings. Writing
``className={`bg-${color}`}`` compiles, renders, and silently produces a
transparent element — the class is purged. Accent colours are therefore mapped
to literal strings (see `ACCENTS` in `stat-card.tsx` and `ROLE_ACCENTS` in
`roles.tsx`). `bg-primary` happens to survive because it appears literally
elsewhere, which makes the bug especially easy to miss.

## Brand assets

`brand/` holds the source artwork — `pilatix-wordmark.png` (the wide lockup) and
`pilatix-icon.png` (the square app icon). Everything the layout needs is derived
from them:

```bash
python3 scripts/build-brand-logos.py
```

That writes the six logo files the Ynex layout swaps between, plus the favicon
and apple-touch icon. Which file renders depends on the menu style and whether
the sidebar is collapsed:

| File | Where it renders | Treatment |
| --- | --- | --- |
| `desktop-dark.png` | dark menu style (**the default**), auth page in dark mode | white wordmark |
| `desktop-logo.png` | light menu style, auth page in light mode | green wordmark |
| `desktop-white.png` | coloured / gradient menu styles | white wordmark |
| `toggle-*.png` | collapsed sidebar | "P" on a cream tile |

The collapsed sidebar renders `toggle-logo.png` under *every* menu style, and
the sidebar header is transparent — so that one file sits on the dark green
background in the default theme and on white under the light menu style. A flat
mark cannot read on both, so the collapsed mark keeps its own cream/yellow tile.

The figure is lifted off `pilatix-icon.png` rather than cropped from it: cropping
keeps the tile's top corners but leaves a flat cut along the bottom, so the
script selects the brand-green pixels, drops the "Pilatix" wordmark below them
(unreadable at 16–32px) and re-composites the figure onto a freshly drawn tile.
Artwork is scaled to fit its *longest* side — the figure's extended leg makes it
~1.5× wider than tall, and scaling by height alone pushed it into the tile edges.

If `brand/pilatix-icon.png` is ever missing, the script falls back to a "P" cut
from the wordmark and says so.

To rebrand, replace `brand/pilatix-wordmark.png` and re-run the script; adjust
the colour constants at the top of it if the palette changes.
- Theme, switcher, dark mode and the layout options are the template's own and
  are untouched; chart colours are read from the theme's CSS variables via
  `src/hooks/use-theme-colors.ts` so they follow the switcher.

## Assets

The Ynex template ships a large demo payload — icon sets as individual SVG/PNG
files alongside the webfonts that actually render them, an unimported
`@tabler/icons-react` build, ecommerce/NFT/crypto/avatar imagery, and a sample
video. None of it is referenced by this panel, so it has been removed
(~56 MB, 5,300 files). `src/` went from 74 MB to 18 MB and a clean production
build from ~2m to ~25s.

To check again after pulling in new template code:

```bash
python3 scripts/find-unused-assets.py            # report
python3 scripts/find-unused-assets.py --delete   # and remove
```

An asset counts as referenced when a **resolvable path** to it appears in a
.ts/.tsx import, a `url()` in any .css/.scss, or an href/src in index.html —
matching by basename would be useless here, since the template is full of files
called `1.png`.

What is deliberately kept:

- The six icon webfonts and the CSS that declares them (`ti-`, `bx-`, `ri-`,
  `fe-`, `la-` classes are used throughout the template's markup).
- `menu-bg-images/` — the switcher's background-menu styles are a live feature.
- A handful of `media/` images still referenced by rules in the compiled
  `style.css`. The rules themselves are dead (they style template pages that no
  longer exist), but pruning vendor CSS is a bigger change than the ~1 MB is
  worth.

Two pre-existing gaps in the vendor packages, neither caused by this cleanup:
`bootstrap-icons` shipped no webfont at all (its CSS import was removed, since
nothing used `bi-` classes), and line-awesome is missing `la-regular-400.eot`,
`la-regular-400.woff2`, `la-regular-400.svg` and `la-brands-400.svg` — the
remaining formats cover those faces.

## Template notes

- The Starterkit ships **empty font folders** for `tabler-icons` and
  `line-awesome` (and no compiled `line-awesome.css`). Both were filled in from
  the full `Ynex-TS-Tailwind` build; without them those icons render as tofu.
  If icons look wrong after a dependency change, clear `node_modules/.vite` —
  Vite caches the CSS URL rebasing.
- `.ti-btn.ti-btn-sm` is a fixed `1.75rem` **square** (icon-button size), not a
  compact text button. Text buttons use explicit padding instead.
