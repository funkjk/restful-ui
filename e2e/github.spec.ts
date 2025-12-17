import { test, expect } from '@playwright/test';
import cssescape from 'css.escape'

test('github api', async ({ page }) => {
  await page.goto('/');
  await page.getByRole("textbox").fill("https://raw.githubusercontent.com/github/rest-api-description/refs/heads/main/descriptions/ghes-3.9/ghes-3.9.2022-11-28.json");
  await page.getByRole('button', { name: 'SET' }).click();
  await page.getByRole('button', { name: 'SETTING' }).click();
  await page.waitForTimeout(1000)
  await page.locator(".base-path input").fill("https://api.github.com");
  await page.getByRole('button', { name: 'SAVE' }).click();


  const selEmojiGet = cssescape(`*page=operation&path=/emojis&method=get`);
  await page.locator(`a[href$="${selEmojiGet}"]`).click();
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).not.toBeVisible();

});
