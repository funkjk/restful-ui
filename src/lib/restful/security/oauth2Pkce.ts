import type { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";

export const OAUTH2_CALLBACK_PATH = "/api/security/callback";
export const OAUTH2_CODE_PARAM = "oauth_code";
export const OAUTH2_STATE_PARAM = "oauth_state";
export const OAUTH2_ERROR_PARAM = "oauth_error";

export interface AuthorizationCodeFlow {
  schemeName: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: Record<string, string>;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthorizationState {
  nonce: string;
  returnUrl: string;
}

type FetchFunction = typeof fetch;

/** Collect authorization code flows from an already parsed OAS3 or Swagger2 document. */
export function findAuthorizationCodeFlows(
  document: OpenAPI.Document | undefined,
): AuthorizationCodeFlow[] {
  if (!document) {
    return [];
  }
  if ("openapi" in document) {
    const schemes = (document as OpenAPIV3.Document).components?.securitySchemes ?? {};
    return Object.entries(schemes).flatMap(([schemeName, scheme]) => {
      if ("$ref" in scheme || scheme.type !== "oauth2") {
        return [];
      }
      const flow = scheme.flows.authorizationCode;
      if (!flow) {
        return [];
      }
      return [
        {
          schemeName,
          authorizationUrl: flow.authorizationUrl,
          tokenUrl: flow.tokenUrl,
          scopes: flow.scopes ?? {},
        },
      ];
    });
  }
  const definitions = (document as OpenAPIV2.Document).securityDefinitions ?? {};
  return Object.entries(definitions).flatMap(([schemeName, scheme]) => {
    if (scheme.type !== "oauth2" || scheme.flow !== "accessCode") {
      return [];
    }
    return [
      {
        schemeName,
        authorizationUrl: scheme.authorizationUrl,
        tokenUrl: scheme.tokenUrl,
        scopes: scheme.scopes ?? {},
      },
    ];
  });
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function createRandomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function createCodeVerifier(): string {
  return createRandomString(32);
}

export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return bytesToBase64Url(new Uint8Array(digest));
}

export function encodeAuthorizationState(state: AuthorizationState): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(state)));
}

export function decodeAuthorizationState(value: string | null | undefined): AuthorizationState | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
    if (typeof parsed?.nonce === "string" && typeof parsed?.returnUrl === "string") {
      return { nonce: parsed.nonce, returnUrl: parsed.returnUrl };
    }
  } catch {
    // fall through
  }
  return null;
}

export function buildAuthorizationUrl(params: {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  state: string;
  offlineAccess: boolean;
}): string {
  const url = new URL(params.authorizationUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", params.state);
  if (params.scopes.length > 0) {
    url.searchParams.set("scope", params.scopes.join(" "));
  }
  if (params.offlineAccess) {
    url.searchParams.set("token_access_type", "offline");
  }
  return url.toString();
}

async function _requestToken(
  tokenUrl: string,
  body: Record<string, string>,
  fetchFunction: FetchFunction,
): Promise<OAuth2Token> {
  const response = await fetchFunction(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body).toString(),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }
  const json = JSON.parse(text);
  if (typeof json.access_token !== "string") {
    throw new Error("Token response does not contain access_token");
  }
  return {
    accessToken: json.access_token,
    refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : undefined,
    expiresAt:
      typeof json.expires_in === "number"
        ? Date.now() + json.expires_in * 1000
        : undefined,
  };
}

export function exchangeAuthorizationCode(
  params: {
    tokenUrl: string;
    clientId: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  },
  fetchFunction: FetchFunction = fetch,
): Promise<OAuth2Token> {
  return _requestToken(
    params.tokenUrl,
    {
      grant_type: "authorization_code",
      code: params.code,
      code_verifier: params.codeVerifier,
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
    },
    fetchFunction,
  );
}

export function refreshAccessToken(
  params: { tokenUrl: string; clientId: string; refreshToken: string },
  fetchFunction: FetchFunction = fetch,
): Promise<OAuth2Token> {
  return _requestToken(
    params.tokenUrl,
    {
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
      client_id: params.clientId,
    },
    fetchFunction,
  );
}

/** Resolve the state's return URL, falling back when it is not same-origin. */
export function resolveSafeReturnUrl(
  returnUrl: string | undefined,
  origin: string,
  fallbackPath: string,
): URL {
  if (returnUrl) {
    try {
      const url = new URL(returnUrl, origin);
      if (url.origin === origin) {
        return url;
      }
    } catch {
      // fall through
    }
  }
  return new URL(fallbackPath, origin);
}
