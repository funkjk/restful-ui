import { chromium } from '@playwright/test';

const base = 'http://localhost:4210';
const oas = `${base}/oas/restful-api-sample-config.yaml`;
const assets = 'docs/assets';

async function loadSample(page) {
	await page.goto(base);
	await page.getByLabel('Open API URL').fill(oas);
	await page.getByRole('button', { name: 'set', exact: true }).click();
	await page.waitForTimeout(2500);
}

async function setLocalBasePath(page) {
	await page.goto(`${base}/#?*page=setting`);
	await page.waitForTimeout(1200);
	await page.getByLabel('basePath').fill(`${base}/api`);
	await page.getByRole('button', { name: 'Save' }).click();
	await page.waitForTimeout(800);
}

async function main() {
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

	await loadSample(page);

	// ja-01: API TOP after OAS load
	await page.goto(`${base}/#?*page=top`);
	await page.waitForTimeout(1500);
	await page.screenshot({ path: `${assets}/ja-01-openapi-top.png` });

	await setLocalBasePath(page);

	// ja-04: path tree (drawer + operation)
	await page.goto(`${base}/#?*page=operation&path=/configs&method=get`);
	await page.waitForTimeout(1500);
	await page.screenshot({ path: `${assets}/ja-04-path-tree.png` });

	// ja-05: Settings
	await page.goto(`${base}/#?*page=setting`);
	await page.waitForTimeout(1200);
	await page.screenshot({ path: `${assets}/ja-05-settings.png` });

	// ja-02: collection table (GET /configs)
	await page.goto(`${base}/#?*page=operation&path=/configs&method=get`);
	await page.waitForTimeout(1000);
	await page.getByRole('button', { name: 'Execute' }).click({ force: true });
	await page.waitForTimeout(3500);
	await page.screenshot({ path: `${assets}/ja-02-collection-table.png` });

	// ja-03: PathLink dialog (configurationId column)
	const listBtn = page
		.locator('table tbody tr')
		.first()
		.locator('button .material-icons')
		.filter({ hasText: 'list' });
	if (await listBtn.count()) {
		await listBtn.click();
		await page.waitForTimeout(1000);
		await page.locator('.mdc-dialog').screenshot({ path: `${assets}/ja-03-path-link-dialog.png` });
	} else {
		console.warn('No list button found; skipping ja-03 dialog screenshot');
	}

	await browser.close();
	console.log('Screenshots saved to docs/assets/');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
