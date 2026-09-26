export interface RequestHeader {
  name: string;
  value: string;
}

export interface VariableEntry {
  name: string;
  /** CEL expression evaluated at request time */
  expression: string;
  /**
   * When false, omitted from ConfigStore Persist / server save.
   * Still kept in session storage for local use. Default true.
   */
  persist?: boolean;
}

export interface RequestVariables {
  entries: VariableEntry[];
}

export interface RequestSettings {
  headers: RequestHeader[];
  additionalQueryParameter?: string;
  basePath?: string;
  useProxy: boolean;
  proxyBaseUrl?: string;
  variables?: RequestVariables;
}

/** Strip variable entries marked persist:false for server/ConfigStore payloads. */
export function toPersistedRequestSettings(
  settings: RequestSettings,
): RequestSettings {
  const entries = settings.variables?.entries;
  if (!entries?.length) {
    return settings;
  }
  const persistedEntries = entries.filter((e) => e.persist !== false);
  return {
    ...settings,
    variables:
      persistedEntries.length > 0 ? { entries: persistedEntries } : undefined,
  };
}
