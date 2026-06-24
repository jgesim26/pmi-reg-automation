# PMI Web App — Test Cases

Manual/automation test cases for every page covered by this Playwright suite, in
**Description / Steps / Expected Result** format. Each page lists **positive**
scenarios first, then **negative / edge** scenarios.

- **Base URL:** `https://stage.app.deepci.com`
- **Auth:** valid session (storage state) unless a case states "logged out".
- **Coverage map:** Authentication, Sidebar Navigation, and the modules registered
  in `tests/modules.data.ts` (Root, Organic Traffic, PPC, Streamers), plus the
  Website Search filter grid.
- **ID scheme:** `TC-<AREA>-<NN>` · **Type:** ✅ Positive · ⛔ Negative/Edge

---

## 1. Authentication — Login (`/`)

Automated by `tests/validation.spec.ts`, `tests/auth.setup.ts`.

| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-LOGIN-01 | ✅ | Submit enabled only when both fields are valid | 1. Open `/` logged out. 2. Observe submit button with empty form. 3. Enter a valid email and a password. | Submit is **disabled** while any field is empty; becomes **enabled** once both email and password are filled. |
| TC-LOGIN-02 | ✅ | Successful login with valid credentials | 1. Open `/`. 2. Enter valid `USER_EMAIL` / `USER_PASS`. 3. Click Login. | User is authenticated and redirected to the app (Dashboard); sidebar renders. |
| TC-LOGIN-03 | ✅ | Existing session is reused | 1. With a valid stored session, open any app route. | App loads directly without showing the login form. |
| TC-LOGIN-04 | ⛔ | Invalid email format rejected | 1. Open `/` logged out. 2. Enter `notanemail` in the email field. 3. Fill the password (blurs email). | Inline **"not a valid email"** validation error appears; submit stays disabled. |
| TC-LOGIN-05 | ⛔ | Wrong credentials show an error | 1. Open `/`. 2. Enter a syntactically valid email + an incorrect password. 3. Submit. | An authentication error is shown; the user remains on the login page (not redirected). |
| TC-LOGIN-06 | ⛔ | Empty submit blocked | 1. Open `/`. 2. Leave both fields blank. 3. Attempt to submit. | Submit cannot be triggered (button disabled); no navigation occurs. |

---

## 2. Sidebar Navigation

Automated by `tests/navigation.spec.ts`.

| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-NAV-01 | ✅ | All sidebar links present | 1. Log in. 2. Inspect the sidebar. | Every expected group/link (Root, Organic Traffic, PPC, Streamers) is rendered. |
| TC-NAV-02 | ✅ | Each menu item navigates to its route | 1. Click each sidebar entry in turn. | The app navigates to the matching route and the target page loads without a fatal error. |
| TC-NAV-03 | ✅ | Active state reflects current page | 1. Navigate to a module via the sidebar. | The corresponding sidebar item is marked active/highlighted. |
| TC-NAV-04 | ⛔ | Guarded/interactive route handled gracefully | 1. Click a guarded entry (e.g. Keyword Bidding). | The page either loads or redirects (e.g. to Website Overview) **without** an error overlay. |
| TC-NAV-05 | ⛔ | Direct deep-link to an unknown route | 1. Navigate to a non-existent path under the app. | A not-found / safe fallback is shown (no blank screen or unhandled crash). |

---

## 3. Root group

### 3.1 Dashboard (`/dashboard`) — overview
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-DASH-01 | ✅ | Dashboard loads with content cards | 1. Open `/dashboard`. | URL contains `/dashboard`; sidebar/app-shell visible; one or more content cards render. |
| TC-DASH-02 | ✅ | No fatal error on load | 1. Open `/dashboard`. | No "something went wrong / failed to load" overlay is visible. |
| TC-DASH-03 | ⛔ | Resilient under slow load | 1. Open `/dashboard` on a throttled connection. | Page shows loading state then content; does not render a permanent error. |

### 3.2 Keyword Search (`/keyword-search`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-KWS-01 | ✅ | Table renders with data | 1. Open `/keyword-search`. | Data table visible with rows; columns include **Keyword** and **Volume**. |
| TC-KWS-02 | ✅ | Location filter applies | 1. Change the Location filter. | Table reloads scoped to the selected location; rows remain valid. |
| TC-KWS-03 | ✅ | Pagination advances | 1. Click next page. | A different result set / page indicator is shown. |
| TC-KWS-04 | ⛔ | Search with no matches | 1. Search an unlikely keyword. | Grid shows an empty/`0 rows` state without an error. |
| TC-KWS-05 | ⛔ | Columns are not click-to-sort (by design) | 1. Click the Keyword/Volume headers. | No broken behavior; ordering is search-result driven (sorting not expected). |

### 3.3 App Store Search (`/app-store-search`) — grid
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-APP-01 | ✅ | Grid renders app cards | 1. Open `/app-store-search`. | ≥3 result cards render. |
| TC-APP-02 | ✅ | Location filter applies | 1. Change Location. | Cards reload for the selected location. |
| TC-APP-03 | ⛔ | Empty/odd query handled | 1. Search a nonsense term. | Empty state shown, no crash. |

### 3.4 Telegram Channels (`/telegram/channels`) — table, 2 tabs
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-TG-01 | ✅ | Table renders with expected columns | 1. Open `/telegram/channels`. | Columns include Channel, Type, Country, Brands Found, Members, Language; rows present. |
| TC-TG-02 | ✅ | Both tabs switch content | 1. Click each of the 2 tabs. | Active tab changes and content updates per tab. |
| TC-TG-03 | ✅ | Location and Brand filters apply | 1. Change Location, then Brand. | Table reloads for each filter selection. |
| TC-TG-04 | ✅ | Pagination advances | 1. Click next page. | Result set/page indicator changes. |
| TC-TG-05 | ⛔ | Location with no data | 1. Select a location with no channels. | "0 rows / no data for this location" empty state, no error overlay. |

---

## 4. Organic Traffic group

### 4.1 Website Overview (`/organic-traffic/website-analysis/website-overview`) — overview
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-WO-01 | ✅ | Overview cards render | 1. Open the route. | URL contains `/website-overview`; content cards/metrics render; no fatal error. |
| TC-WO-02 | ✅ | Metrics populate for the selected website | 1. Ensure a website context is set. | Overview sections display data values (not blank placeholders). |
| TC-WO-03 | ⛔ | Missing/invalid website context | 1. Open overview without a valid website. | Page shows an empty/prompt state, not a crash. |

### 4.2 Trending Websites (`/organic-traffic/website-analysis/trending-websites`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-TW-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Website, Location, Monthly Traffic, Your Brands Present; rows present. |
| TC-TW-02 | ✅ | Location filter applies | 1. Change Location (Global/USA/Mexico). | Table reloads scoped to that location. |
| TC-TW-03 | ✅ | Brand filter applies | 1. Open Brands select, choose a concrete brand. | Table reloads reflecting the chosen brand. |
| TC-TW-04 | ✅ | Sorting reorders rows | 1. Click a sortable column header. | Rows reorder (or refetch via order param). |
| TC-TW-05 | ✅ | Pagination advances | 1. Click next. | Different rows / page indicator. |
| TC-TW-06 | ⛔ | Location with no data | 1. Select a location with no rows. | Empty state, no error. |

### 4.3 Opportunities (`/organic-traffic/website-analysis/opportunities/page-gap`) — table, 3 tabs
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-OPP-01 | ✅ | Default (Page Gap) tab renders | 1. Open the route. | URL contains `/opportunities/`; table with Page, Location columns renders. |
| TC-OPP-02 | ✅ | All 3 tabs switch content | 1. Click each tab (e.g. Page Gap / Location Gap / Related Websites). | Active tab changes; content updates per tab. |
| TC-OPP-03 | ✅ | Location + Brand filters apply | 1. Change Location and Brand. | Table reloads accordingly. |
| TC-OPP-04 | ✅ | Pagination advances | 1. Click next. | Result set changes. |
| TC-OPP-05 | ⛔ | Tab with no opportunities | 1. Open a tab/filter combination with no data. | Empty state shown, no error. |

### 4.4 Your Websites (`/organic-traffic/affiliate-monitoring/your-websites`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-YW-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Website, Location, Your Brands, Visibility; rows present. |
| TC-YW-02 | ✅ | Location + Brand filters apply | 1. Change each filter. | Table reloads accordingly. |
| TC-YW-03 | ✅ | Sorting + pagination work | 1. Sort a column; 2. Page next. | Rows reorder; page advances. |
| TC-YW-04 | ⛔ | No owned websites for filter | 1. Apply a filter yielding none. | Empty state, no error. |

### 4.5 Position Changes (`/organic-traffic/affiliate-monitoring/position-changes/brand-demoted`) — table, 2 tabs
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-PC-01 | ✅ | Default (Brand Demoted) tab renders | 1. Open the route. | URL contains `/position-changes/`; columns Website, Brand, Location, Traffic Impact; rows present. |
| TC-PC-02 | ✅ | Both tabs switch content | 1. Click each tab (e.g. Demoted / Promoted). | Active tab changes; content updates. |
| TC-PC-03 | ✅ | Location + Brand filters apply | 1. Change filters. | Table reloads. |
| TC-PC-04 | ⛔ | No position changes for period/filter | 1. Apply a filter with no changes. | Empty state, no error. |

### 4.6 Website Search (`/organic-traffic/market-research/website-search`) — filter grid
Automated by `tests/website-search-filters.spec.ts`. Filter state is reflected in the URL query string.

| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-WS-01 | ✅ | Loads with default filter state | 1. Open the route. | URL carries `location_id=` and `level=website`; result grid renders rows. |
| TC-WS-02 | ✅ | Verticals multi-select filters | 1. Open Verticals. 2. Pick `Casino`. | URL gains `verticals=[...]`; grid still shows rows. |
| TC-WS-03 | ✅ | Location (URL param) reloads grid | 1. Change `location_id` via the location control/URL. | URL reflects the new id; grid reloads with rows. |
| TC-WS-04 | ✅ | Regulation filter applies | 1. Open Regulation. 2. Pick `Regulated`. | URL gains `spectrum=licensed`; rows present. |
| TC-WS-05 | ✅ | Media Websites filter applies | 1. Open Media Websites. 2. Pick `Media Websites`. | URL gains `media_sites=only`; rows present. |
| TC-WS-06 | ✅ | Crypto Friendly filter applies | 1. Open Crypto Friendly. 2. Pick `Crypto-friendly Website`. | URL gains `crypto_friendly=only`; rows present. |
| TC-WS-07 | ✅ | Brand presence toggle | 1. Open Brand. 2. Switch to `Doesn't have`. | `first_brand_found_option` flips `1` → `0`; rows present. |
| TC-WS-08 | ✅ | Pagination loads a new set | 1. Set page input to 2. | The leading row differs from page 1; 10 rows shown. |
| TC-WS-09 | ✅ | Search box keeps grid functional | 1. Type a query + Enter in "Search website". | Grid stays functional; table still renders rows. |
| TC-WS-10 | ⛔ | Filter combination with no results | 1. Stack filters to an empty set. | Empty/`0 rows` state, no error overlay. |
| TC-WS-11 | ⛔ | Page number beyond max (250) | 1. Enter a page above the max. | Input is clamped to the max; no crash. |
| TC-WS-12 | ⛔ | "Doesn't have" with no brand name | 1. Toggle Doesn't have without entering a brand. | Filter still applies (`=0`); grid renders without error. |

### 4.7 Market Position (`/organic-traffic/market-research/market-position/brand-market-share`) — table, 2 tabs
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-MP-01 | ✅ | Default (Brand Market Share) renders | 1. Open the route. | URL contains `/market-position/`; columns Brand, % Market Share, Websites Found; rows present. |
| TC-MP-02 | ✅ | Both tabs switch content | 1. Click each tab. | Active tab changes; content updates. |
| TC-MP-03 | ✅ | Location filter applies | 1. Change Location. | Table reloads. |
| TC-MP-04 | ⛔ | No share data for selection | 1. Apply a filter with no data. | Empty state, no error. |

---

## 5. PPC group

### 5.1 Website Top List (`/ppc/weekly/website-top-list`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-WTL-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Website, Location, High Value KWs, Low Value KWs, Total KWs, Total Brands; rows present. |
| TC-WTL-02 | ✅ | Location + Brand filters apply | 1. Change each filter. | Table reloads. |
| TC-WTL-03 | ✅ | Sorting + pagination work | 1. Sort a numeric column; 2. Page next. | Rows reorder; page advances. |
| TC-WTL-04 | ⛔ | Location with no data | 1. Select an empty location. | Empty state, no error. |

### 5.2 Brand Top List (`/ppc/weekly/brand-top-list`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-BTL-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Website, Location, High Value KWs, Low Value KWs, Brand KWs, Total KWs; rows present. |
| TC-BTL-02 | ✅ | Location filter applies | 1. Change Location. | Table reloads. |
| TC-BTL-03 | ✅ | Sorting + pagination work | 1. Sort a column; 2. Page next. | Rows reorder; page advances. |
| TC-BTL-04 | ⛔ | Search data-load resilience | 1. Type a term in "Search website" + Enter. 2. If "Something went wrong loading the data. Please try again." appears, use the retry. | After (auto-)retry the grid recovers and shows results/empty state. *(Known transient staging data flake — see investigation notes.)* |
| TC-BTL-05 | ⛔ | Location with no data | 1. Select an empty location. | Empty state, no error. |

### 5.3 Keyword List (`/ppc/weekly/keyword-list`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-KL-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Keyword, PPC Sites, Predicted Player Value, Location, Search Volume; rows present. |
| TC-KL-02 | ✅ | Location filter + pagination | 1. Change Location; 2. Page next. | Table reloads; page advances. |
| TC-KL-03 | ⛔ | Empty location | 1. Select a location with no keywords. | Empty state, no error. |

### 5.4 Black Hat (`/ppc/weekly/black-hat`) — grid
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-BH-01 | ✅ | Grid renders cards | 1. Open the route. | ≥3 cards render; no fatal error. |
| TC-BH-02 | ✅ | Location filter + pagination | 1. Change Location; 2. Page next. | Cards reload; page advances. |
| TC-BH-03 | ⛔ | No findings for location | 1. Select an empty location. | Empty state, no error. |

### 5.5 Keyword Bidding (`/ppc/weekly/keyword-bidding`) — interactive
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-KB-01 | ✅ | Page loads with controls (no data yet) | 1. Open the route. | App shell + filter controls render; no table/data is required before input. |
| TC-KB-02 | ✅ | Results render after choosing filters | 1. Select required filters. 2. Apply. | A result table/data renders for the chosen criteria. |
| TC-KB-03 | ⛔ | Guarded redirect handled | 1. Open the route directly when guarded. | Loads or redirects (e.g. Website Overview) without an error overlay. |
| TC-KB-04 | ⛔ | Apply with no filters selected | 1. Trigger results without selecting filters. | Prompt/empty state shown, no crash. |

### 5.6 Brand Bidding (`/ppc/brand-bidding`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-BB-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Website, Location, Your Brands Bid, Keywords Bid; rows present. |
| TC-BB-02 | ✅ | Location + Brand filters apply | 1. Change each filter. | Table reloads. |
| TC-BB-03 | ✅ | Sorting + pagination work | 1. Sort a column; 2. Page next. | Rows reorder; page advances. |
| TC-BB-04 | ⛔ | Empty location/brand combo | 1. Apply a filter yielding none. | Empty state, no error. |

---

## 6. Streamers group

### 6.1 Kick Channels (`/streamers/kick/channels`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-KICK-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Channel, Language, Tags, Brand Promoted, Followers; rows present. |
| TC-KICK-02 | ✅ | Brand filter applies | 1. Change the Brand filter. | Table reloads for the chosen brand. |
| TC-KICK-03 | ✅ | Sorting + pagination work | 1. Sort; 2. Page next. | Rows reorder; page advances. |
| TC-KICK-04 | ⛔ | Brand with no promoting channels | 1. Pick a brand with no channels. | Empty state, no error. |

### 6.2 YouTube Channels (`/streamers/tuber/channels`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-YT-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Channel, Language, Tags, Brand Promoted, Subscribers; rows present. |
| TC-YT-02 | ✅ | Brand filter + pagination | 1. Change Brand; 2. Page next. | Table reloads; page advances. |
| TC-YT-03 | ⛔ | Brand with no channels | 1. Pick an empty brand. | Empty state, no error. |

### 6.3 Twitch Channels (`/streamers/twitch/channels`) — table
| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-TWITCH-01 | ✅ | Table renders with columns | 1. Open the route. | Columns include Channel, Language, Tags, Brand Promoted, Followers; rows present. |
| TC-TWITCH-02 | ✅ | Brand filter + pagination | 1. Change Brand; 2. Page next. | Table reloads; page advances. |
| TC-TWITCH-03 | ⛔ | Brand with no channels | 1. Pick an empty brand. | Empty state, no error. |

---

## 7. Cross-cutting (applies to all table/grid modules)

| ID | Type | Description | Steps | Expected Result |
|----|------|-------------|-------|-----------------|
| TC-X-01 | ✅ | App shell renders on every page | 1. Open any module. | Sidebar/layout is visible. |
| TC-X-02 | ✅ | No fatal error overlay | 1. Open any module. | No "something went wrong / internal server error / failed to load / access denied" text. |
| TC-X-03 | ✅ | Interactive controls present | 1. Open any module. | At least one filter select or search input is available. |
| TC-X-04 | ⛔ | Resilience under load | 1. Open a module on a throttled/slow network. | Loading state then content; the SPA does not stay blank/half-loaded. |
| TC-X-05 | ⛔ | Transient data-load error recovers | 1. Trigger a list refresh that returns "…loading the data. Please try again." | Using retry restores data; no permanent broken state. |
| TC-X-06 | ⛔ | Session expiry mid-use | 1. Let the session expire, then act on a page. | User is redirected to login (no silent failure). |
