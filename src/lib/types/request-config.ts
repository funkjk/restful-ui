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
