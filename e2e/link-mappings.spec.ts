import { test, expect } from "@playwright/test";

test("user link mapping from findByStatus to pet by id", async ({ page }) => {
	await page.route("**/pet/findByStatus**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify([
				{
					id: 123,
					name: "doggie",
					photoUrls: ["https://example.com/photo.jpg"],
					status: "available",
				},
			]),
		});
	});

	await page.goto("/");
	await page
		.getByRole("textbox")
		.fill("https://petstore.swagger.io/v2/swagger.json");
	await page.getByRole("button", { name: "SET" }).click();
	await page.getByRole("button", { name: "SETTING" }).click();
	await page.getByRole("radio", { name: "Links" }).check();
	await page.getByLabel("Source path").fill("/pet/findByStatus");
	await page.getByLabel("Column").fill("id");
	await page.getByLabel("Target path prefix").fill("/pet/{petId}");
	await page.getByRole("button", { name: "Add to list" }).click();
	await page.getByRole("button", { name: "Save" }).click();

	await page.goto(
		"/#?*page=operation&path=/pet/findByStatus&method=get&status=available",
	);
	await expect(
		page.getByRole("heading", { name: "get /pet/findByStatus" }),
	).toBeVisible({ timeout: 30000 });
	await page.getByRole("button", { name: "EXECUTE" }).click();
	await expect(page.getByRole("button", { name: "response" })).toBeVisible({
		timeout: 30000,
	});

	await page
		.getByRole("row", { name: /123/ })
		.getByRole("button")
		.first()
		.click();
	await expect(page.getByText("User Links:")).toBeVisible();
	await expect(page.getByText("/pet/{petId}").first()).toBeVisible();
	const userLink = page.getByRole("link", { name: "/pet/{petId}", exact: true });
	await expect(userLink).toBeVisible();
	await userLink.click();

	await expect(page).toHaveURL(
		/path=\/pet\/(\{petId\}|%7BpetId%7D)&method=get&petId=123/,
	);
});
