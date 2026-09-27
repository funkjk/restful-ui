import { test, expect, type Route } from "@playwright/test";
import { readFileSync } from "node:fs";

const SPEC_URL = "https://spec.oauth-mock.test/oauth2-mini.json";
const AUTHORIZE_URL = "https://auth.oauth-mock.test/oauth2/authorize";
const TOKEN_URL = "https://auth.oauth-mock.test/oauth2/token";
const API_URL = "https://api.oauth-mock.test/v1/me";
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, content-type, accept",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const spec = readFileSync(
	new URL("./fixtures/oauth2-mini.json", import.meta.url),
	"utf8",
);

function fulfillPreflight(route: Route): Promise<void> | undefined {
	if (route.request().method() === "OPTIONS") {
		return route.fulfill({ status: 204, headers: CORS_HEADERS });
	}
	return undefined;
}

test("OAuth2 PKCE connect attaches Bearer token to API calls", async ({ page }) => {
	let authorizeRequest: URL | undefined;
	let tokenRequestBody: URLSearchParams | undefined;
	let apiAuthorization: string | undefined;

	await page.route(SPEC_URL, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			headers: CORS_HEADERS,
			body: spec,
		}),
	);
	await page.route(`${AUTHORIZE_URL}**`, (route) => {
		authorizeRequest = new URL(route.request().url());
		const redirectUri = authorizeRequest.searchParams.get("redirect_uri")!;
		const state = authorizeRequest.searchParams.get("state")!;
		const target = new URL(redirectUri);
		target.searchParams.set("code", "mock-code");
		target.searchParams.set("state", state);
		return route.fulfill({
			status: 200,
			contentType: "text/html",
			body: `<script>location.replace(${JSON.stringify(target.toString())})</script>`,
		});
	});
	await page.route(TOKEN_URL, (route) => {
		const preflight = fulfillPreflight(route);
		if (preflight) {
			return preflight;
		}
		tokenRequestBody = new URLSearchParams(route.request().postData() ?? "");
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			headers: CORS_HEADERS,
			body: JSON.stringify({
				access_token: "mock-access-token",
				token_type: "bearer",
				expires_in: 3600,
			}),
		});
	});
	await page.route(API_URL, (route) => {
		const preflight = fulfillPreflight(route);
		if (preflight) {
			return preflight;
		}
		apiAuthorization = route.request().headers()["authorization"];
		return route.fulfill({
			status: 200,
			contentType: "application/json",
			headers: CORS_HEADERS,
			body: JSON.stringify({ name: "mock user" }),
		});
	});

	await page.goto("/");
	await page.getByRole("textbox").fill(SPEC_URL);
	await page.getByRole("button", { name: "SET" }).click();
	await page.getByRole("button", { name: "SETTING" }).click();

	const securityRadio = page.getByRole("radio", { name: "Security" });
	const requestRadio = page.getByRole("radio", { name: "Request" });
	const variablesRadio = page.getByRole("radio", { name: "Variables" });
	await expect(securityRadio).toBeVisible();
	const radioX = async (locator: typeof securityRadio) =>
		(await locator.boundingBox())?.x ?? 0;
	expect(await radioX(securityRadio)).toBeGreaterThan(await radioX(variablesRadio));
	expect(await radioX(variablesRadio)).toBeGreaterThan(await radioX(requestRadio));

	await securityRadio.check();
	await expect(page.getByText("OAuth 2.0 Authorization Code + PKCE")).toBeVisible();
	await expect(page.getByTestId("oauth-status")).toContainText("Empty");
	await expect(page.getByLabel("Authorization URL")).toHaveValue(AUTHORIZE_URL);
	await expect(page.getByLabel("Token URL")).toHaveValue(TOKEN_URL);
	await expect(page.getByTestId("oauth-redirect-uri")).toHaveText(
		/\/api\/security\/callback$/,
	);

	await page.getByLabel("Client ID").fill("mock-client");
	await page.getByRole("checkbox", { name: "account.read" }).check();
	await page.getByRole("button", { name: "Connect" }).click();
	await expect(page.getByTestId("oauth-status")).toContainText("Connected", {
		timeout: 30000,
	});
	await expect(page).not.toHaveURL(/oauth_code=/);
	await expect(page).toHaveURL(/page=setting/);

	expect(authorizeRequest?.searchParams.get("response_type")).toBe("code");
	expect(authorizeRequest?.searchParams.get("client_id")).toBe("mock-client");
	expect(authorizeRequest?.searchParams.get("code_challenge_method")).toBe("S256");
	expect(authorizeRequest?.searchParams.get("code_challenge")).toBeTruthy();
	expect(authorizeRequest?.searchParams.get("scope")).toBe("account.read");

	expect(tokenRequestBody?.get("grant_type")).toBe("authorization_code");
	expect(tokenRequestBody?.get("code")).toBe("mock-code");
	expect(tokenRequestBody?.get("client_id")).toBe("mock-client");
	expect(tokenRequestBody?.get("code_verifier")).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
	expect(tokenRequestBody?.get("redirect_uri")).toBe(
		authorizeRequest?.searchParams.get("redirect_uri"),
	);

	await page.goto("/#?*page=operation&path=/me&method=get");
	await expect(page.getByRole("heading", { name: "get /me" })).toBeVisible({
		timeout: 30000,
	});
	await page.getByRole("button", { name: "EXECUTE" }).click();
	await expect(page.getByRole("button", { name: "response" })).toBeVisible({
		timeout: 30000,
	});
	expect(apiAuthorization).toBe("Bearer mock-access-token");

	await page.goto("/#?*page=setting");
	await page.getByRole("radio", { name: "Request" }).check();
	await page.getByRole("textbox", { name: "name" }).first().fill("Authorization");
	await page.getByRole("textbox", { name: "value" }).first().fill("Bearer manual-token");
	await page.getByRole("button", { name: "Save" }).click();

	apiAuthorization = undefined;
	await page.goto("/#?*page=operation&path=/me&method=get");
	await expect(page.getByRole("heading", { name: "get /me" })).toBeVisible({
		timeout: 30000,
	});
	await page.getByRole("button", { name: "EXECUTE" }).click();
	await expect.poll(() => apiAuthorization).toBe("Bearer manual-token");
});

test("OAuth2 callback rejects cross-origin return URLs", async ({ request, baseURL }) => {
	const state = Buffer.from(
		JSON.stringify({ nonce: "n", returnUrl: "https://evil.example.test/" }),
	).toString("base64url");
	const response = await request.get(
		`/api/security/callback?code=abc&state=${state}`,
		{ maxRedirects: 0 },
	);
	expect(response.status()).toBe(302);
	const location = new URL(response.headers()["location"], baseURL);
	expect(location.origin).toBe(new URL(baseURL!).origin);
	expect(location.searchParams.get("oauth_code")).toBe("abc");
});
