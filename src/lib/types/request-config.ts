import type { ResourceInfo, ToolInfo } from "$lib/stores/mcp";

export interface RequestHeader {
  name: string;
  value: string;
}

export interface RequestSettings {
  headers: RequestHeader[];
  additionalQueryParameter?: string;
  basePath?: string;
  useProxy: boolean;
}

export interface RequestConfigProps {
  settings: RequestSettings;
  title?: string;
  showBasePath?: boolean;
  showProxy?: boolean;
  showHeaders?: boolean;
  showQueryParams?: boolean;
  basePathLabel?: string;
  basePathPlaceholder?: string;
  proxyLabel?: string;
  onSave?: (settings: RequestSettings) => void;
  onClear?: () => void;
}

export const defaultRequestSettings: RequestSettings = {
  headers: [],
  additionalQueryParameter: "",
  basePath: "",
  useProxy: false,
}; 

export interface McpServerConfig {
  isInitialized: boolean,
  config: McpServerConfig,
  tools: ToolInfo[],
  resources: ResourceInfo[]
}