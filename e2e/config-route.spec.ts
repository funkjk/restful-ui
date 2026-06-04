import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });


test('test config routing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SET' }).click();
  await page.getByRole('button', { name: 'SETTING' }).click();
  await page.getByText('Persist').click();
  await page.getByRole('textbox').first().fill("my-server");
  await page.getByRole('button', { name: 'SAVE' }).click();
  await expect(page).toHaveURL(/\/cid\/[\w-]+\//);

  await page.getByText('Persist').click();
  const configurationId = await page.locator(".configuration-id").textContent();
  await page.getByRole('textbox').first().fill("my-server-upd");
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'UPDATE' }).click();
  // Wait for update notification to appear
  await page.waitForTimeout(1000);
  // Reload page to get updated config
  await page.reload();
  await page.getByText('Persist').click();
  await expect(page.getByRole('textbox', { name: 'value' }).first()).toHaveValue("my-server-upd");

  await page.getByRole('button', { name: 'COPY' }).click();
  await page.waitForTimeout(1000);
  await page.getByText('additional Query Parameters').isVisible()
  await page.getByText('Persist').click();
  const configurationIdCopy = await page.locator(".configuration-id").textContent();
  expect(configurationIdCopy).not.toBe(configurationId);
  
  // Navigate back to original config to download it
  await page.goto(`/cid/${configurationId}/#?*page=setting`);
  await page.getByText('Persist').click();
  // Verify updated serverName
  await expect(page.getByRole('textbox', { name: 'value' }).first()).toHaveValue("my-server-upd");
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'download' }).click();
  const download = await downloadPromise;
  const readable = await download.createReadStream();
  const text = await readableToString(readable);
  const json = JSON.parse(text);
  expect(json.serverName).toBe("my-server-upd");


  // Delete the copied config first
  // Delete the copied config
  await page.getByRole('button', { name: 'DELETE' }).first().click();
  await expect(page).toHaveURL(/\/#\?\*page=top/);



});



async function readableToString(readableStream) {
  let data = '';
  for await (const chunk of readableStream) {
    data += chunk.toString(); // Convert Buffer chunks to string
  }
  return data;
}
