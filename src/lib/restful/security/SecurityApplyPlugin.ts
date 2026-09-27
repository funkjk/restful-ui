import type { RestApiResponse } from "../apiFetch";
import type { InputRestParameters, RestfulOperation } from "../RestfulOperation";
import { EmptyRestfulPlugin, type ExecutePluginChain } from "../RestfulPlugin";
import type { OAuth2PkceSettings, RequestSettings } from "$lib/types/request-config";
import {
  buildAuthorizationUrl,
  createCodeChallenge,
  createCodeVerifier,
  createRandomString,
  decodeAuthorizationState,
  encodeAuthorizationState,
  exchangeAuthorizationCode,
  refreshAccessToken,
  type OAuth2Token,
} from "./oauth2Pkce";

export type OAuth2Status = "empty" | "connected" | "expired";

interface TokenEndpoint {
  tokenUrl: string;
  clientId: string;
}

interface PendingAuthorization extends TokenEndpoint {
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
}

type StoredToken = OAuth2Token & Partial<TokenEndpoint>;

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface SecurityApplyPluginOptions {
  storageKey: string;
  getSettings: () => RequestSettings;
  updateSettings?: (updater: (settings: RequestSettings) => RequestSettings) => void;
  fetchFunction?: typeof fetch;
}

const EXPIRY_MARGIN_MS = 30_000;
const completions = new Map<string, Promise<void>>();
const memoryValues = new Map<string, string>();
const memoryStorage: KeyValueStorage = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => {
    memoryValues.set(key, value);
  },
  removeItem: (key) => {
    memoryValues.delete(key);
  },
};

/**
 * Applies an OAuth2 (Authorization Code + PKCE) access token as a Bearer header.
 * Tokens live in sessionStorage in the browser and in memory on the server.
 * An Authorization header set manually (Request / Variables tabs) always wins.
 */
export class SecurityApplyPlugin extends EmptyRestfulPlugin {
  private readonly _options: SecurityApplyPluginOptions;
  private _refreshing: Promise<string | undefined> | undefined;

  constructor(options: SecurityApplyPluginOptions) {
    super();
    this._options = options;
  }

  async doExecute(
    restfulOperation: RestfulOperation,
    chain: ExecutePluginChain,
    inputParameters: InputRestParameters,
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<RestApiResponse> {
    const headers = this._toHeaderRecord(init?.headers);
    const hasAuthorization = Object.keys(headers).some(
      (name) => name.toLowerCase() === "authorization",
    );
    if (hasAuthorization) {
      return chain.next(inputParameters, input, init);
    }
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return chain.next(inputParameters, input, init);
    }
    headers.Authorization = `Bearer ${accessToken}`;
    return chain.next(inputParameters, input, { ...init, headers });
  }

  getToken(): StoredToken | undefined {
    return this._readJson<StoredToken>(this._tokenKey());
  }

  getStatus(): OAuth2Status {
    const token = this.getToken();
    if (token && !this._isExpired(token)) {
      return "connected";
    }
    if (this._resolveRefreshToken(token)) {
      return "connected";
    }
    return token ? "expired" : "empty";
  }

  /** Prepare PKCE values and return the authorization URL to navigate to. */
  async beginAuthorization(params: { redirectUri: string; returnUrl: string }): Promise<string> {
    const settings = this._pkceSettings();
    const clientId = settings.clientId?.value?.trim();
    const authorizationUrl = settings.authorizationUrl?.value?.trim();
    const tokenUrl = settings.tokenUrl?.value?.trim();
    if (!clientId || !authorizationUrl || !tokenUrl) {
      throw new Error("Client ID, Authorization URL and Token URL are required");
    }
    const codeVerifier = createCodeVerifier();
    const nonce = createRandomString(16);
    this._writeJson<PendingAuthorization>(this._pendingKey(), {
      codeVerifier,
      nonce,
      redirectUri: params.redirectUri,
      tokenUrl,
      clientId,
    });
    return buildAuthorizationUrl({
      authorizationUrl,
      clientId,
      redirectUri: params.redirectUri,
      scopes: settings.scopes?.value ?? [],
      codeChallenge: await createCodeChallenge(codeVerifier),
      state: encodeAuthorizationState({ nonce, returnUrl: params.returnUrl }),
      offlineAccess: settings.offlineAccess?.value ?? false,
    });
  }

  /** Exchange the authorization code returned via the callback route (idempotent per state). */
  completeAuthorization(params: { code: string; state: string }): Promise<void> {
    const key = `${this._options.storageKey}:${params.state}`;
    let completion = completions.get(key);
    if (!completion) {
      completion = this._completeAuthorization(params);
      completions.set(key, completion);
    }
    return completion;
  }

  private async _completeAuthorization(params: { code: string; state: string }): Promise<void> {
    const pending = this._readJson<PendingAuthorization>(this._pendingKey());
    const state = decodeAuthorizationState(params.state);
    if (!pending || !state || state.nonce !== pending.nonce) {
      throw new Error("OAuth state mismatch; please connect again");
    }
    this._storage().removeItem(this._pendingKey());
    const token = await exchangeAuthorizationCode(
      {
        tokenUrl: pending.tokenUrl,
        clientId: pending.clientId,
        code: params.code,
        codeVerifier: pending.codeVerifier,
        redirectUri: pending.redirectUri,
      },
      this._options.fetchFunction,
    );
    this._saveToken({ ...token, tokenUrl: pending.tokenUrl, clientId: pending.clientId });
  }

  disconnect(): void {
    this._storage().removeItem(this._tokenKey());
    this._storage().removeItem(this._pendingKey());
    this._options.updateSettings?.((current) => {
      const oauth2Pkce = current.security?.oauth2Pkce;
      if (!oauth2Pkce?.refreshToken) {
        return current;
      }
      return {
        ...current,
        security: {
          ...current.security,
          oauth2Pkce: {
            ...oauth2Pkce,
            refreshToken: { value: "", persist: oauth2Pkce.refreshToken.persist },
          },
        },
      };
    });
  }

  /** Return a valid access token, refreshing it when expired and a refresh token exists. */
  async getAccessToken(): Promise<string | undefined> {
    const token = this.getToken();
    if (token && !this._isExpired(token)) {
      return token.accessToken;
    }
    const refreshToken = this._resolveRefreshToken(token);
    if (!refreshToken) {
      return undefined;
    }
    this._refreshing ??= this._refresh(refreshToken, token).finally(() => {
      this._refreshing = undefined;
    });
    return this._refreshing;
  }

  private async _refresh(
    refreshToken: string,
    previous: StoredToken | undefined,
  ): Promise<string | undefined> {
    const settings = this._pkceSettings();
    const tokenUrl = settings.tokenUrl?.value?.trim() || previous?.tokenUrl;
    const clientId = settings.clientId?.value?.trim() || previous?.clientId;
    if (!tokenUrl || !clientId) {
      return undefined;
    }
    try {
      const token = await refreshAccessToken(
        { tokenUrl, clientId, refreshToken },
        this._options.fetchFunction,
      );
      this._saveToken({
        ...token,
        refreshToken: token.refreshToken ?? refreshToken,
        tokenUrl,
        clientId,
      });
      return token.accessToken;
    } catch (error) {
      console.warn("OAuth2 token refresh failed", error);
      return undefined;
    }
  }

  private _saveToken(token: StoredToken): void {
    this._writeJson(this._tokenKey(), token);
    if (!token.refreshToken || !this._options.updateSettings) {
      return;
    }
    const refreshToken = token.refreshToken;
    this._options.updateSettings((current) => {
      const oauth2Pkce = current.security?.oauth2Pkce ?? {};
      if (oauth2Pkce.refreshToken?.value === refreshToken) {
        return current;
      }
      return {
        ...current,
        security: {
          ...current.security,
          oauth2Pkce: {
            ...oauth2Pkce,
            refreshToken: {
              value: refreshToken,
              persist: oauth2Pkce.refreshToken?.persist ?? false,
            },
          },
        },
      };
    });
  }

  private _resolveRefreshToken(token: OAuth2Token | undefined): string | undefined {
    return token?.refreshToken || this._pkceSettings().refreshToken?.value || undefined;
  }

  private _isExpired(token: OAuth2Token): boolean {
    return token.expiresAt !== undefined && token.expiresAt - EXPIRY_MARGIN_MS <= Date.now();
  }

  private _pkceSettings(): OAuth2PkceSettings {
    return this._options.getSettings().security?.oauth2Pkce ?? {};
  }

  private _toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) {
      return {};
    }
    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }
    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }
    return { ...headers };
  }

  private _tokenKey(): string {
    return `${this._options.storageKey}-oauth2-token`;
  }

  private _pendingKey(): string {
    return `${this._options.storageKey}-oauth2-pending`;
  }

  private _storage(): KeyValueStorage {
    return typeof sessionStorage !== "undefined" ? sessionStorage : memoryStorage;
  }

  private _readJson<T>(key: string): T | undefined {
    const raw = this._storage().getItem(key);
    if (!raw) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  private _writeJson<T>(key: string, value: T): void {
    this._storage().setItem(key, JSON.stringify(value));
  }
}
