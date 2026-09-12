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
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

No trailing slash. Everything else is derived from it in `src/api/endpoints.ts`.

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

- **No user-list endpoint.** `UserRepository` has `findUsers`/`countUsers`, but
  no controller or route exposes them, so there is no user directory. *Add user*
  creates accounts and echoes back what it created.
- **No delete-user endpoint**, so accounts created here cannot be removed from
  the panel.
- **Login history is self-scoped.** `LoginHistoryService` reads `req.user.id`,
  so an admin sees only their own events, never other users'.
- **`ipAddress` / `userAgent` are never stored for email logins.** The service
  spreads `req.body`, and the login Joi schema does not accept those fields, so
  those columns stay null and the table shows `—`. (The social-login schema does
  accept them.)
- **The profile routes are not mounted under `/admin`.** `user.routes.ts` is
  only mounted in the `web` and `app` groups, hence the `/web/user/...` path —
  and the doubled segment (`/profile/profile`) is how the route tree nests.
- **Role names are restricted to the API's enum** (`admin`, `user`,
  `external_user`, `guest`), so the name field is a select. The seeded data also
  contains `superadmin`, which is outside that enum: the edit form shows it but
  renaming it would be rejected, so only its description can be changed.

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
## Brand assets

`brand/pilatix-wordmark.png` is the source artwork. Everything the layout needs
is derived from it:

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
the sidebar header is transparent — so that one file sits on a dark navy
background in the default theme and on white under the light menu style. A flat
mark cannot read on both, so the collapsed mark uses the app-icon treatment (the
"P" on its own cream/yellow tile), which carries its own background.

To rebrand, replace `brand/pilatix-wordmark.png` and re-run the script; adjust
the colour constants at the top of it if the palette changes.
- Theme, switcher, dark mode and the layout options are the template's own and
  are untouched; chart colours are read from the theme's CSS variables via
  `src/hooks/use-theme-colors.ts` so they follow the switcher.
