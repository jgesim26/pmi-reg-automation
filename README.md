## pmi-reg-automation
Ths is for PMI Website FE automation regressing testing

## Command to execute and run specific test file
## Command to open browser called to execute the test `--project=chromium --headed`


npx playwright test smoketest.spec.ts --project=chromium --headed


## Command to show full test execution report

npx playwright show-report




## Integrating Playwright TypeScript tests into a GitLab CI/CD pipeline is a common and effective way to automate your end-to-end testing. Here's a step-by-step guide to help you set it up:

Prerequisites:

Playwright Project: You should already have a Playwright project with TypeScript tests that run successfully locally using npx playwright test.
GitLab Repository: Your project code should be hosted on a GitLab repository.
Basic GitLab CI/CD Knowledge: Familiarity with .gitlab-ci.yml syntax and concepts like stages, jobs, and artifacts will be helpful.
Steps:

1. Prepare Your Playwright Tests
Ensure your Playwright configuration (playwright.config.ts) is set up for CI environments. Key considerations:

Reporters: Configure Playwright to generate reports that are useful for CI, especially the HTML reporter.

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // ... other configurations
  reporter: [
    ['list'], // Console output during execution
    ['html', { outputFolder: 'playwright-report', open: 'never' }], // HTML report
  ],
  // For parallel execution in CI:
  workers: process.env.CI ? 4 : undefined, // Adjust based on your CI runner's resources
  // Base URL for tests (can be overridden by environment variables in CI)
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    // ... other browser options
  },
  // ... more configurations
});


Environment Variables: If your tests rely on dynamic URLs, credentials, or other settings, use environment variables in your Playwright code (e.g., process.env.PLAYWRIGHT_BASE_URL). You'll set these in GitLab CI/CD.
2. Define the GitLab CI/CD Configuration (.gitlab-ci.yml)
Create a file named .gitlab-ci.yml at the root of your GitLab repository. This file defines your CI/CD pipeline.

Here's a common setup for Playwright with TypeScript:

# .gitlab-ci.yml

stages:
  - install_dependencies
  - test
  - merge_reports # Optional: if you're using sharding and want a single HTML report

variables:
  # Use an official Playwright Docker image to ensure all browsers and dependencies are present
  # Choose a version that matches your Playwright installation
  PLAYWRIGHT_IMAGE: mcr.microsoft.com/playwright:v1.49.0-noble # Or a newer stable version

cache:
  paths:
    - node_modules/ # Cache node_modules to speed up subsequent runs

install_dependencies_job:
  stage: install_dependencies
  image: node:20 # Use a Node.js image to install dependencies
  script:
    - npm ci # Use npm ci for clean installs in CI environments
  artifacts:
    paths:
      - node_modules/ # Cache node_modules to be used in subsequent stages
    expire_in: 1 day # Adjust as needed

playwright_tests:
  stage: test
  image: ${PLAYWRIGHT_IMAGE}
  needs:
    - install_dependencies_job # Ensure dependencies are installed first
  script:
    - npm install # Re-install from cache if available, or fetch if not
    - npx playwright install --with-deps # Install Playwright browsers and their system dependencies
    - npx playwright test --reporter=blob --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL # Run tests, sharding for parallelism
  parallel: 4 # Run tests across 4 parallel jobs (adjust based on your runner's capacity)
  artifacts:
    when: always # Always upload artifacts, even if tests fail
    paths:
      - test-results/ # Playwright test results (screenshots, traces, etc.)
      - playwright-report-blob/ # Intermediate blob reports for sharding (if used)
    expire_in: 1 week

merge_playwright_reports:
  stage: merge_reports
  image: ${PLAYWRIGHT_IMAGE}
  needs:
    - playwright_tests
  script:
    - npx playwright merge-reports --output playwright-report-merged/ playwright-report-blob/ # Merge blob reports
  artifacts:
    when: always
    paths:
      - playwright-report-merged/ # The final merged HTML report
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "push" # Only run this job on push events, or adjust as needed
      when: on_success
      allow_failure: true # Allow this job to fail without failing the pipeline if reports can't merge for some reason
      
      Explanation of the .gitlab-ci.yml file:

stages: Defines the sequential stages of your pipeline.
install_dependencies: Installs Node.js packages.
test: Runs your Playwright tests.
merge_reports: (Optional) Merges sharded reports into a single HTML report.
variables:
PLAYWRIGHT_IMAGE: Specifies the official Playwright Docker image. This image comes pre-installed with Node.js and all necessary browser dependencies (Chromium, Firefox, WebKit), making your CI setup much simpler and more consistent.
cache: Caches node_modules to speed up subsequent pipeline runs by avoiding repeated npm ci downloads.
install_dependencies_job:
image: node:20: Uses a standard Node.js image for installing initial dependencies.
script: - npm ci: Installs project dependencies. npm ci is preferred in CI for cleaner installs based on package-lock.json.
artifacts: Saves node_modules as an artifact, which is then used by the playwright_tests job.
playwright_tests:
stage: test: Belongs to the test stage.
image: ${PLAYWRIGHT_IMAGE}: Uses the Playwright Docker image.
needs: - install_dependencies_job: Ensures this job runs only after install_dependencies_job completes successfully and its artifacts (like node_modules) are available.
script:
npm install: This will utilize the cached node_modules from the install_dependencies_job if available.
npx playwright install --with-deps: Installs the Playwright browsers (Chromium, Firefox, WebKit) and their operating system dependencies within the CI runner's environment. This is crucial if you're not using the mcr.microsoft.com/playwright Docker image or if you need to ensure specific versions. However, if you're using the official Playwright Docker image, the browsers are already installed, so this command might be redundant but harmless.
npx playwright test --reporter=blob --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL: Executes your Playwright tests.
--reporter=blob: Generates intermediate "blob" reports for sharding.
--shard=$CI_NODE_INDEX/$CI_NODE_TOTAL: This is key for parallel execution. GitLab CI/CD automatically sets CI_NODE_INDEX and CI_NODE_TOTAL when parallel is defined for a job, allowing Playwright to distribute tests across parallel jobs.
parallel: 4: Tells GitLab to run 4 instances of this job in parallel, each processing a shard of your tests.
artifacts:
test-results/: Stores Playwright's default test output (screenshots, traces, videos, etc.).
playwright-report-blob/: Stores the intermediate blob reports from each shard.
merge_playwright_reports:
stage: merge_reports: Runs after all parallel test jobs are complete.
needs: - playwright_tests: Ensures this job only runs after all playwright_tests jobs have finished.
script: - npx playwright merge-reports --output playwright-report-merged/ playwright-report-blob/: This command takes all the individual blob reports generated by the parallel test jobs and merges them into a single comprehensive HTML report.
artifacts:
playwright-report-merged/: Uploads the final, merged HTML report to GitLab's Job Artifacts. You can then download and view this report.
3. Commit and Push to GitLab
Once you've created and configured your .gitlab-ci.yml file, commit it to your repository and push it to GitLab.

git add .gitlab-ci.yml
git commit -m "Add Playwright CI/CD pipeline"
git push origin main # Or your main branch name


4. Monitor Your Pipeline in GitLab
Go to your GitLab project, navigate to "CI/CD" > "Pipelines". You should see your pipeline running.

Job Details: Click on a running or completed job to see its logs. This is crucial for debugging any issues.
Artifacts: Once the merge_playwright_reports job (or playwright_tests if not sharding) completes, you'll find the Playwright HTML report under the "Job artifacts" section. You can download this .zip file and open the index.html file locally to view the detailed test results.
Important Considerations and Best Practices:
Environment Variables: For sensitive data (like API keys, user credentials for testing), use GitLab CI/CD variables (Settings > CI/CD > Variables). Do not hardcode them in your .gitlab-ci.yml or your tests.
Browser Installation (npx playwright install --with-deps): While the official Playwright Docker image includes browsers, if you're using a custom image or a generic Node.js image, npx playwright install --with-deps is essential to install the necessary browser binaries and their system dependencies.
Parallelism (parallel and --shard): Using parallel in .gitlab-ci.yml along with Playwright's --shard flag significantly speeds up test execution by distributing tests across multiple CI runners or jobs. Adjust the parallel value based on your GitLab runner's capacity.
Reporting: The HTML report is invaluable for debugging and sharing test results. Ensure it's correctly configured as an artifact.
Flaky Tests: Be prepared to deal with flaky tests in CI. Implement retries in your playwright.config.ts if needed (e.g., retries: process.env.CI ? 2 : 0).
Base URL: Use baseURL in playwright.config.ts and override it via an environment variable in your .gitlab-ci.yml (e.g., PLAYWRIGHT_BASE_URL: https://your-staging-env.com) to run tests against different environments.
npm ci vs. npm install: Use npm ci in CI environments for reliable, repeatable builds as it uses package-lock.json. npm install is generally for local development.
Runner Resources: Playwright tests can be resource-intensive. Ensure your GitLab CI runners have sufficient CPU, memory, and disk space to handle the browser instances.
Debugging in CI: If tests fail in CI but pass locally, consider using Playwright's trace viewer. You can upload the trace files as artifacts and view them locally with npx playwright show-trace <trace-file>.
By following these steps, you'll have a robust GitLab CI/CD pipeline for your Playwright TypeScript tests, ensuring your application's quality with every code change.
