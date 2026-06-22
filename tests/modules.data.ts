/**
 * Registry of every navigable module in the app, derived from the live sidebar.
 * The system-check spec is data-driven from this list so adding/altering a
 * module is a one-line change here.
 *
 * NOTE: this file intentionally has no `.spec`/`.test` suffix so Playwright does
 * not collect it as a test file — it is imported by the specs.
 */

export type ModuleKind = 'table' | 'grid' | 'overview'

export interface ModuleDef {
  /** Stable key / screenshot prefix. */
  key: string
  /** Human label (matches the sidebar entry). */
  name: string
  /** Sidebar group it lives under (for reporting). */
  group: 'Root' | 'Organic Traffic' | 'PPC' | 'Streamers'
  /** Navigation path (the sidebar href / goto target). */
  route: string
  /** Stable substring the URL should contain after navigation. */
  urlContains: string
  /** Primary content shape. */
  kind: ModuleKind
  /** Whether the page is expected to render data (rows/cards) on first load. */
  expectData: boolean
  /** Number of in-page tabs to exercise (0 = none). */
  tabs: number
  /** Whether a server-paginated list is present (enables the pagination check). */
  pager: boolean
  /**
   * Interactive page that renders no data/table until the user selects filters
   * (e.g. Keyword Bidding). Such modules only verify load + controls, not data.
   */
  interactive?: boolean
  /** Expected table column headers (subset-asserted) — table modules only. */
  columns?: string[]
  /** Module has a location filter (Global / country select). */
  hasLocationFilter?: boolean
  /** Module has a Brands filter select. */
  hasBrandFilter?: boolean
  /** Set false for pages whose columns aren't click-to-sort (e.g. search results). */
  sortable?: boolean
}

export const MODULES: ModuleDef[] = [
  // ---- Root ----------------------------------------------------------------
  { key: 'dashboard', name: 'Dashboard', group: 'Root', route: '/dashboard', urlContains: '/dashboard', kind: 'overview', expectData: true, tabs: 0, pager: false },
  { key: 'keyword-search', name: 'Keyword Search', group: 'Root', route: '/keyword-search', urlContains: '/keyword-search', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Keyword', 'Volume'], hasLocationFilter: true, sortable: false },
  { key: 'app-store-search', name: 'App Store Search', group: 'Root', route: '/app-store-search', urlContains: '/app-store-search', kind: 'grid', expectData: true, tabs: 0, pager: true, hasLocationFilter: true },
  { key: 'telegram-channels', name: 'Telegram Channels', group: 'Root', route: '/telegram/channels', urlContains: '/telegram/channels', kind: 'table', expectData: true, tabs: 2, pager: true, columns: ['Channel', 'Type', 'Country', 'Brands Found', 'Members', 'Language'], hasLocationFilter: true, hasBrandFilter: true },

  // ---- Organic Traffic -----------------------------------------------------
  { key: 'website-overview', name: 'Website Overview', group: 'Organic Traffic', route: '/organic-traffic/website-analysis/website-overview', urlContains: '/website-overview', kind: 'overview', expectData: true, tabs: 0, pager: false },
  { key: 'trending-websites', name: 'Trending Websites', group: 'Organic Traffic', route: '/organic-traffic/website-analysis/trending-websites', urlContains: '/trending-websites', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'Monthly Traffic', 'Your Brands Present'], hasLocationFilter: true, hasBrandFilter: true },
  { key: 'opportunities', name: 'Opportunities', group: 'Organic Traffic', route: '/organic-traffic/website-analysis/opportunities/page-gap', urlContains: '/opportunities/', kind: 'table', expectData: true, tabs: 3, pager: true, columns: ['Page', 'Location'], hasLocationFilter: true, hasBrandFilter: true },
  { key: 'your-websites', name: 'Your Websites', group: 'Organic Traffic', route: '/organic-traffic/affiliate-monitoring/your-websites', urlContains: '/your-websites', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'Your Brands', 'Visibility'], hasLocationFilter: true, hasBrandFilter: true },
  { key: 'position-changes', name: 'Position Changes', group: 'Organic Traffic', route: '/organic-traffic/affiliate-monitoring/position-changes/brand-demoted', urlContains: '/position-changes/', kind: 'table', expectData: true, tabs: 2, pager: true, columns: ['Website', 'Brand', 'Location', 'Traffic Impact'], hasLocationFilter: true, hasBrandFilter: true },
  { key: 'website-search', name: 'Website Search', group: 'Organic Traffic', route: '/organic-traffic/market-research/website-search', urlContains: '/website-search', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'Monthly Traffic'], hasLocationFilter: true },
  { key: 'market-position', name: 'Market Position', group: 'Organic Traffic', route: '/organic-traffic/market-research/market-position/brand-market-share', urlContains: '/market-position/', kind: 'table', expectData: true, tabs: 2, pager: true, columns: ['Brand', '% Market Share', 'Websites Found'], hasLocationFilter: true },

  // ---- PPC -----------------------------------------------------------------
  { key: 'website-top-list', name: 'Website Top List', group: 'PPC', route: '/ppc/weekly/website-top-list', urlContains: '/website-top-list', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'High Value KWs', 'Low Value KWs', 'Total KWs', 'Total Brands'], hasLocationFilter: true, hasBrandFilter: true },
  { key: 'brand-top-list', name: 'Brand Top List', group: 'PPC', route: '/ppc/weekly/brand-top-list', urlContains: '/brand-top-list', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'High Value KWs', 'Low Value KWs', 'Brand KWs', 'Total KWs'], hasLocationFilter: true },
  { key: 'keyword-list', name: 'Keyword List', group: 'PPC', route: '/ppc/weekly/keyword-list', urlContains: '/keyword-list', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Keyword', 'PPC Sites', 'Predicted Player Value', 'Location', 'Search Volume'], hasLocationFilter: true },
  { key: 'black-hat', name: 'Black Hat', group: 'PPC', route: '/ppc/weekly/black-hat', urlContains: '/black-hat', kind: 'grid', expectData: true, tabs: 0, pager: true, hasLocationFilter: true },
  // Keyword Bidding is interactive: it renders no table/data until filters are
  // chosen, so it only verifies load + controls (not content/data/pagination).
  { key: 'keyword-bidding', name: 'Keyword Bidding', group: 'PPC', route: '/ppc/weekly/keyword-bidding', urlContains: '/keyword-bidding', kind: 'table', expectData: false, tabs: 0, pager: false, interactive: true },
  { key: 'brand-bidding', name: 'Brand Bidding', group: 'PPC', route: '/ppc/brand-bidding', urlContains: '/brand-bidding', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Website', 'Location', 'Your Brands Bid', 'Keywords Bid'], hasLocationFilter: true, hasBrandFilter: true },

  // ---- Streamers -----------------------------------------------------------
  { key: 'kick-channels', name: 'Kick Channels', group: 'Streamers', route: '/streamers/kick/channels', urlContains: '/streamers/kick/channels', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Channel', 'Language', 'Tags', 'Brand Promoted', 'Followers'], hasBrandFilter: true },
  { key: 'youtube-channels', name: 'YouTube Channels', group: 'Streamers', route: '/streamers/tuber/channels', urlContains: '/streamers/tuber/channels', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Channel', 'Language', 'Tags', 'Brand Promoted', 'Subscribers'], hasBrandFilter: true },
  { key: 'twitch-channels', name: 'Twitch Channels', group: 'Streamers', route: '/streamers/twitch/channels', urlContains: '/streamers/twitch/channels', kind: 'table', expectData: true, tabs: 0, pager: true, columns: ['Channel', 'Language', 'Tags', 'Brand Promoted', 'Followers'], hasBrandFilter: true },
]
