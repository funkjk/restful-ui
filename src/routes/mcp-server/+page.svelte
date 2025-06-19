<script lang="ts">
  import Card, { Content, Actions } from "@smui/card";
  import Button, { Label } from "@smui/button";
  import Textfield from "@smui/textfield";
  import FormField from "@smui/form-field";
  import Checkbox from "@smui/checkbox";
  import Select, { Option } from "@smui/select";
  import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
  import IconButton from "@smui/icon-button";
  import CircularProgress from "@smui/circular-progress";
  import Snackbar from "@smui/snackbar";
  import { mcpServerState, mcpSettings, mcpActions, type ToolInfo } from "$lib/stores/mcp";
  import { createProxyUrl } from "$lib/utils/proxy";
  import { loading } from "$lib/stores/ui";
  
  let editingUrl = "";
  let showAdvancedSettings = false;
  let snackbar: Snackbar;
  let snackbarMessage = "";
  
  // 設定の初期化
  mcpSettings.subscribe(settings => {
    if (!editingUrl && settings.openApiUrl) {
      editingUrl = settings.openApiUrl;
    }
  });
  
  // OpenAPI仕様書を読み込む
  async function loadOpenApiSpec() {
    if (!editingUrl) {
      snackbarMessage = "OpenAPI URLを入力してください";
      snackbar?.open();
      return;
    }
    
    loading.set(true);
    try {
      const finalUrl = $mcpSettings.useProxy ? createProxyUrl(editingUrl) : editingUrl;
      await mcpActions.loadOpenApiSpec(finalUrl);
      
      // 設定を保存
      mcpSettings.update(settings => ({
        ...settings,
        openApiUrl: editingUrl
      }));
      
      snackbarMessage = "OpenAPI仕様書を正常に読み込みました";
      snackbar?.open();
    } catch (error) {
      snackbarMessage = `読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
      snackbar?.open();
    } finally {
      loading.set(false);
    }
  }
  
  // MCPサーバを起動
  async function startMcpServer() {
    if (!$mcpServerState.openApiDoc) {
      snackbarMessage = "先にOpenAPI仕様書を読み込んでください";
      snackbar?.open();
      return;
    }
    
    loading.set(true);
    try {
      await mcpActions.startServer({
        openApiUrl: $mcpServerState.openApiUrl!,
        serverName: $mcpSettings.serverName,
        serverVersion: $mcpSettings.serverVersion,
        timeout: $mcpSettings.timeout,
        maxRetries: $mcpSettings.maxRetries,
      });
      snackbarMessage = "MCPサーバを起動しました";
      snackbar?.open();
    } catch (error) {
      snackbarMessage = `起動エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
      snackbar?.open();
    } finally {
      loading.set(false);
    }
  }
  
  // MCPサーバを停止
  async function stopMcpServer() {
    loading.set(true);
    try {
      await mcpActions.stopServer();
      snackbarMessage = "MCPサーバを停止しました";
      snackbar?.open();
    } catch (error) {
      snackbarMessage = `停止エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
      snackbar?.open();
    } finally {
      loading.set(false);
    }
  }
  
  // ツール情報をコピー
  function copyToolInfo(tool: ToolInfo) {
    const toolInfo = {
      name: tool.name,
      method: tool.method,
      path: tool.path,
      description: tool.description,
    };
    
    navigator.clipboard.writeText(JSON.stringify(toolInfo, null, 2));
    snackbarMessage = `ツール「${tool.name}」の情報をコピーしました`;
    snackbar?.open();
  }
  
  // サンプルURLを設定
  function setSampleUrl() {
    editingUrl = "https://petstore.swagger.io/v2/swagger.json";
  }
</script>

<svelte:head>
  <title>MCP Server Manager</title>
</svelte:head>

<div class="mcp-server-page">
  <h1>MCP Server Manager</h1>
  <p>OpenAPI仕様書からMCPサーバを作成し、API呼び出し機能を提供します。</p>
  
  <!-- OpenAPI URL入力セクション -->
  <Card>
    <Content>
      <h2>OpenAPI仕様書の設定</h2>
      
      <div class="url-input-section">
        <Textfield
          bind:value={editingUrl}
          label="OpenAPI仕様書のURL"
          style="width: 100%; margin-bottom: 16px;"
          disabled={$mcpServerState.isRunning}
        />
        
        <FormField>
          <Checkbox 
            bind:checked={$mcpSettings.useProxy} 
            disabled={$mcpServerState.isRunning}
          />
          <span slot="label">Restful-UI Proxyを使用してOASファイルを取得</span>
        </FormField>
        
        <div class="sample-button">
          <Button 
            on:click={setSampleUrl} 
            variant="outlined" 
            disabled={$mcpServerState.isRunning}
          >
            <Label>サンプル (PetStore API) を使用</Label>
          </Button>
        </div>
      </div>
      
      <!-- 詳細設定 -->
      <div class="advanced-settings">
        <Button 
          on:click={() => showAdvancedSettings = !showAdvancedSettings}
          variant="outlined"
        >
          <Label>{showAdvancedSettings ? '詳細設定を隠す' : '詳細設定を表示'}</Label>
        </Button>
        
        {#if showAdvancedSettings}
          <div class="settings-grid">
            <Textfield
              bind:value={$mcpSettings.serverName}
              label="サーバ名"
              disabled={$mcpServerState.isRunning}
            />
            
            <Textfield
              bind:value={$mcpSettings.serverVersion}
              label="バージョン"
              disabled={$mcpServerState.isRunning}
            />
            
            <Textfield
              bind:value={$mcpSettings.timeout}
              label="タイムアウト (ms)"
              type="number"
              disabled={$mcpServerState.isRunning}
            />
            
            <Textfield
              bind:value={$mcpSettings.maxRetries}
              label="最大再試行回数"
              type="number"
              disabled={$mcpServerState.isRunning}
            />
          </div>
        {/if}
      </div>
    </Content>
    
    <Actions>
      <Button 
        on:click={loadOpenApiSpec} 
        variant="raised"
        disabled={$mcpServerState.isRunning || !editingUrl}
      >
        <Label>OpenAPI仕様書を読み込み</Label>
      </Button>
    </Actions>
  </Card>
  
  <!-- サーバ状態セクション -->
  <Card>
    <Content>
      <h2>MCPサーバの状態</h2>
      
      <div class="status-section">
        <div class="status-info">
          <div class="status-item">
            <strong>状態:</strong> 
            <span class="status {$mcpServerState.isRunning ? 'running' : 'stopped'}">
              {$mcpServerState.isRunning ? '実行中' : '停止中'}
            </span>
          </div>
          
          {#if $mcpServerState.openApiUrl}
            <div class="status-item">
              <strong>OpenAPI URL:</strong> 
              <a href={$mcpServerState.openApiUrl} target="_blank">
                {$mcpServerState.openApiUrl}
              </a>
            </div>
          {/if}
          
          {#if $mcpServerState.lastStarted}
            <div class="status-item">
              <strong>開始時刻:</strong> 
              {$mcpServerState.lastStarted.toLocaleString()}
            </div>
          {/if}
          
          <div class="status-item">
            <strong>利用可能ツール数:</strong> {$mcpServerState.availableTools.length}
          </div>
        </div>
        
        {#if $mcpServerState.error}
          <div class="error-message">
            <strong>エラー:</strong> {$mcpServerState.error}
            <Button on:click={mcpActions.clearError} variant="outlined">
              <Label>エラーをクリア</Label>
            </Button>
          </div>
        {/if}
      </div>
    </Content>
    
    <Actions>
      {#if $mcpServerState.isRunning}
        <Button on:click={stopMcpServer} variant="outlined">
          <Label>MCPサーバを停止</Label>
        </Button>
      {:else}
        <Button 
          on:click={startMcpServer} 
          variant="raised"
          disabled={!$mcpServerState.openApiDoc}
        >
          <Label>MCPサーバを起動</Label>
        </Button>
      {/if}
    </Actions>
  </Card>
  
  <!-- 利用可能ツール一覧 -->
  {#if $mcpServerState.availableTools.length > 0}
    <Card>
      <Content>
        <h2>利用可能なMCPツール ({$mcpServerState.availableTools.length}件)</h2>
        
        <DataTable style="width: 100%;">
          <Head>
            <Row>
              <Cell>ツール名</Cell>
              <Cell>メソッド</Cell>
              <Cell>パス</Cell>
              <Cell>説明</Cell>
              <Cell>アクション</Cell>
            </Row>
          </Head>
          <Body>
            {#each $mcpServerState.availableTools as tool}
              <Row>
                <Cell><code>{tool.name}</code></Cell>
                <Cell>
                  <span class="method-badge {tool.method.toLowerCase()}">
                    {tool.method}
                  </span>
                </Cell>
                <Cell><code>{tool.path}</code></Cell>
                <Cell>{tool.description}</Cell>
                <Cell>
                  <IconButton 
                    class="material-icons"
                    on:click={() => copyToolInfo(tool)}
                    title="ツール情報をコピー"
                  >
                    content_copy
                  </IconButton>
                </Cell>
              </Row>
            {/each}
          </Body>
        </DataTable>
      </Content>
    </Card>
  {/if}
  
  <!-- 使用方法セクション -->
  <Card>
    <Content>
      <h2>使用方法</h2>
      <div class="usage-info">
        <ol>
          <li>OpenAPI仕様書のURLを入力してください</li>
          <li>「OpenAPI仕様書を読み込み」ボタンをクリック</li>
          <li>利用可能なツール一覧を確認</li>
          <li>「MCPサーバを起動」ボタンでサーバを開始</li>
          <li>MCPクライアントから接続して各ツールを使用</li>
        </ol>
        
        <h3>コマンドラインでの起動方法</h3>
        {#if $mcpServerState.openApiUrl}
          <pre><code>pnpm run mcp:start -- --url "{$mcpServerState.openApiUrl}"</code></pre>
        {:else}
          <pre><code>pnpm run mcp:start -- --url "https://your-api.com/openapi.json"</code></pre>
        {/if}
      </div>
    </Content>
  </Card>
</div>

<Snackbar bind:this={snackbar}>
  <div>{snackbarMessage}</div>
</Snackbar>

<style>
  .mcp-server-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .url-input-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .sample-button {
    align-self: flex-start;
  }
  
  .advanced-settings {
    margin-top: 16px;
  }
  
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }
  
  .status-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .status-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .status.running {
    color: green;
    font-weight: bold;
  }
  
  .status.stopped {
    color: orange;
    font-weight: bold;
  }
  
  .error-message {
    padding: 16px;
    background-color: #ffebee;
    border-radius: 4px;
    color: #c62828;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .method-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .method-badge.get {
    background-color: #4caf50;
    color: white;
  }
  
  .method-badge.post {
    background-color: #2196f3;
    color: white;
  }
  
  .method-badge.put {
    background-color: #ff9800;
    color: white;
  }
  
  .method-badge.patch {
    background-color: #9c27b0;
    color: white;
  }
  
  .method-badge.delete {
    background-color: #f44336;
    color: white;
  }
  
  .usage-info ol {
    margin: 16px 0;
    padding-left: 20px;
  }
  
  .usage-info li {
    margin: 8px 0;
  }
  
  .usage-info pre {
    background-color: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  .usage-info code {
    font-family: 'Monaco', 'Courier New', monospace;
  }
  
  @media (max-width: 768px) {
    .settings-grid {
      grid-template-columns: 1fr;
    }
    
    .status-item {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .error-message {
      flex-direction: column;
      gap: 8px;
    }
  }
</style> 