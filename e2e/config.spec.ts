import { test, expect } from '@playwright/test';
import cssescape from 'css.escape'
import { config } from 'process';

test('test config api', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'SET' }).click();
  await page.getByRole('button', { name: 'SETTING' }).click();
  await page.getByText('▶ mcp/').click();
  const selConfigPost = cssescape('*page=operation&path=/mcp/configs&method=post');
  await page.locator(`a[href$="${selConfigPost}"]`).click();
  const configData = {
    "openApiUrl": "http://localhost:4210/oas/restful-api-sample_mcp-config.yaml",
    "serverName": "openapi-mcp-config",
    "serverVersion": "1.0.0",
    "timeout": 10000,
    "maxRetries": 3,
    "requestSettings": {
      "headers": [],
      "additionalQueryParameter": ""
    }
  }
  await page.getByRole('textbox').fill(JSON.stringify(configData));
  await page.getByText("parameters").first().click(); // focus out
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).not.toBeVisible();
  const responseJson = await page.locator("pre").innerText();
  const response = JSON.parse(responseJson);
  const configId = response.configurationId;
  expect(configId).toBeDefined();

  const selConfigGetAll = cssescape('*page=operation&path=/mcp/configs&method=get');
  await page.locator(`a[href$="${selConfigGetAll}"]`).click();
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await page.locator(".filter-textfield>input").fill(configId);
  await page.getByText("list").click();
  await page.getByText("get /mcp/configs/{configurationId}").click();
  await expect(page).toHaveURL(`#?*page=operation&path=/mcp/configs/{configurationId}&method=get&configurationId=${configId}&`);
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).not.toBeVisible();


  await page.getByText('▶ configs/').click();
  const selConfigPut = cssescape(`*page=operation&path=/mcp/configs/{configurationId}&method=put&configurationId=${configId}`);
  await page.locator(`a[href$="${selConfigPut}"]`).click();
  await page.locator(".call-get-button").click();
  await expect(page.getByRole('textbox').last()).toHaveText(/{"config.*/);
  configData.serverVersion = "1.0.1";
  await page.getByRole('textbox').last().fill(JSON.stringify(configData));
  await page.getByText("parameters").first().click(); // focus out
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).not.toBeVisible();

  const selConfigDel = cssescape(`*page=operation&path=/mcp/configs/{configurationId}&method=delete&configurationId=${configId}`);
  await page.locator(`a[href$="${selConfigDel}"]`).click();
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).not.toBeVisible();

  const selConfigGet = cssescape(`*page=operation&path=/mcp/configs/{configurationId}&method=delete&configurationId=${configId}`);
  await page.locator(`a[href$="${selConfigGet}"]`).click();
  await page.getByRole('button', { name: 'EXECUTE' }).click();
  await expect(page.getByRole('button', { name: 'response' })).toBeVisible();
  await expect(page.locator(".error-title")).toBeVisible();



});
