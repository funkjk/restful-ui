export interface RequestHeader {
  name: string;
  value: string;
}

export interface VariableEntry {
  name: string;
  expression: string;
  persist?: boolean;
}

export interface RequestVariables {
  entries: VariableEntry[];
}

export interface PersistableValue<T> {
  value: T;
  persist?: boolean;
}

export interface OAuth2PkceSettings {
  clientId?: PersistableValue<string>;
  authorizationUrl?: PersistableValue<string>;
  tokenUrl?: PersistableValue<string>;
  scopes?: PersistableValue<string[]>;
  offlineAccess?: PersistableValue<boolean>;
  refreshToken?: PersistableValue<string>;
}

export interface SecuritySettings {
  oauth2Pkce?: OAuth2PkceSettings;
}

export interface RequestSettings {
  headers: RequestHeader[];
  additionalQueryParameter?: string;
  basePath?: string;
  useProxy: boolean;
  proxyBaseUrl?: string;
  variables?: RequestVariables;
  security?: SecuritySettings;
}

function isPersisted(entry: { persist?: boolean } | undefined): boolean {
  return entry !== undefined && entry.persist !== false;
}

function pickPersisted<T extends object>(record: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(record).filter(([, entry]) => isPersisted(entry)),
  ) as Partial<T>;
}

/** Strip entries marked persist:false for server/ConfigStore payloads. */
export function toPersistedRequestSettings(settings: RequestSettings): RequestSettings {
  const entries = settings.variables?.entries;
  const oauth2Pkce = settings.security?.oauth2Pkce;
  if (!entries?.length && !oauth2Pkce) {
    return settings;
  }
  const persistedEntries = entries?.filter(isPersisted) ?? [];
  const persistedOAuth2Pkce = oauth2Pkce ? pickPersisted(oauth2Pkce) : {};
  return {
    ...settings,
    variables: persistedEntries.length > 0 ? { entries: persistedEntries } : undefined,
    security:
      Object.keys(persistedOAuth2Pkce).length > 0
        ? { ...settings.security, oauth2Pkce: persistedOAuth2Pkce }
        : undefined,
  };
}
