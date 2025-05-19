import { test, expect } from '@playwright/test';
import cssescape from 'css.escape'

test('test github direct', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SET' }).click();
  await page.getByRole('button', { name: 'SETTING' }).click();
  await page.getByPlaceholder('https://www.example.com/api').fill('https://api.github.com');
  await page.getByRole('button', { name: 'SAVE' }).click();
  const sel = cssescape('*page=operation&path=/emojis&method=get');
  await page.locator(`a[href$="${sel}"]`).click();
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();

});
