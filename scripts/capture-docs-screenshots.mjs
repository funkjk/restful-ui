import { chromium } from '@playwright/test';

const base = 'http://localhost:4210';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Load sample OAS with x-restfului-link
  await page.goto(base);
  await page.getByLabel('Open API URL').fill(`${base}/oas/restful-api-sample-config.yaml`);
  await page.getByRole('button', { name: 'set', exact: true }).click();
  await page.waitForTimeout(2000);

  // GET /custom/configs/
  await page.goto(`${base}/#?*page=operation&path=/custom/configs/&method=get`);
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Execute' }).click();
  await page.waitForTimeout(3000);

  // Open PathLink dialog on id column (material icon "list")
  const listBtn = page.locator('button .material-icons').filter({ hasText: 'list' }).first();
  if (await listBtn.count()) {
    await listBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'docs/assets/ja-03-path-link-dialog.png' });
  } else {
    // fallback: screenshot execute result
    await page.screenshot({ path: 'docs/assets/ja-03-path-link-dialog.png', fullPage: true });
  }

  await browser.close();
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
