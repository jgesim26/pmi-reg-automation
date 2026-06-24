import { test } from '@playwright/test'

/**
 * Register an afterEach that records the route each test ended on as a `url`
 * annotation, so the custom HTML report's "Route" column is populated with the
 * actual page exercised. Call once at the top of a spec file:
 *
 *   import { recordRoute } from './url-annotation'
 *   recordRoute()
 *
 * Not a `.spec`/`.test` file, so Playwright does not collect it as tests.
 */
export function recordRoute() {
  test.afterEach(async ({ page }, testInfo) => {
    try {
      const { pathname } = new URL(page.url())
      testInfo.annotations.push({ type: 'url', description: pathname })
    } catch {
      // page may be closed / about:blank — leave the route blank.
    }
  })
}
