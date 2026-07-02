/**
 * Registry of "source lists" the detail-page crawler drills into. Each entry
 * points at a data table (a module in modules.data.ts) whose rows link to
 * deep-link DETAIL pages (e.g. /organic/website/{id}/.../keywords) that the
 * generic system-check never reaches. The crawler discovers the real entity
 * links from the source table at runtime, so we never hardcode website ids or
 * the {id}/{a}/{b}/{tab} URL shape — adding coverage is a one-line change here.
 *
 * NOTE: no `.spec`/`.test` suffix, so Playwright does not collect it as tests —
 * it is imported by detail-crawl.spec.ts.
 */

export interface DetailCrawlSource {
  /** Stable key / screenshot prefix. */
  key: string
  /** Human label (also the report "Page" value). */
  name: string
  /** Sidebar group it belongs to (for the report "Area" value). */
  group: 'Root' | 'Organic Traffic' | 'PPC' | 'Streamers'
  /** Source list route to discover entity detail links from. */
  sourceRoute: string
  /** Regex (as a string) the discovered detail-page hrefs must match. */
  detailHrefPattern: string
  /** Entity noun used in log/report detail (e.g. "Website"). */
  entity: string
  /** How many entities to drill into per run. */
  limit: number
}

/** How many entities to drill into per source (override with CRAWL_LIMIT=n). */
const LIMIT = Number(process.env.CRAWL_LIMIT) || 3

export const DETAIL_SOURCES: DetailCrawlSource[] = [
  // Websites drilled from Trending Websites → /organic/website/{id}/.../<tab>.
  // This is the path the reported keywords-tab bug lives on.
  {
    key: 'website-detail-trending',
    name: 'Website Detail Crawl',
    group: 'Organic Traffic',
    sourceRoute:
      '/organic-traffic/website-analysis/trending-websites?location_id=1&spectrum&search=&brand_id=my',
    detailHrefPattern: '/organic/website/',
    entity: 'Website',
    limit: LIMIT,
  },
  // Same detail pages, reached from Your Websites (affiliate monitoring) — a
  // different entity population, so it covers websites the trending list omits.
  {
    key: 'website-detail-yours',
    name: 'Your Website Detail Crawl',
    group: 'Organic Traffic',
    sourceRoute: '/organic-traffic/affiliate-monitoring/your-websites',
    detailHrefPattern: '/organic/website/',
    entity: 'Website',
    limit: LIMIT,
  },
]
