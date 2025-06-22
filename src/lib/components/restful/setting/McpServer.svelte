<script lang="ts">
    import Card, { Content, Actions } from "@smui/card";
    import Button, { Label } from "@smui/button";
    import Textfield from "@smui/textfield";
    import DataTable, { Head, Body, Row, Cell } from "@smui/data-table";
    import IconButton from "@smui/icon-button";
    import Snackbar from "@smui/snackbar";
    import Dialog, {
        Title,
        Content as DialogContent,
        Actions as DialogActions,
    } from "@smui/dialog";
    import {
        mcpServerState,
        mcpSettings,
        mcpActions,
        type ToolInfo,
        type ResourceInfo,
    } from "$lib/stores/mcp";
    import type { SavedMcpConfig } from "$lib/mcp/config";
    import { loading } from "$lib/stores/ui";
    import ExpansionCard from "$lib/components/common/ExpansionCard.svelte";
    import type { RestfulComponentConfig } from "$lib/restful/SvelteSupport";
    import { get } from "svelte/store";

    export let config: RestfulComponentConfig;
    export let title: string = "MCP Server";

    let showAdvancedSettings = false;
    let showConfigManagement = false;
    let snackbar: Snackbar;
    let snackbarMessage = "";

    // 設定保存用
    let saveConfigDialog = false;
    let configName = "";
    let configDescription = "";
    let editingConfigId: string | undefined = undefined;

    // 保存された設定一覧
    let savedConfigs: SavedMcpConfig[] = [];

    async function loadMcpServer() {
        const serverState = await mcpActions.loadServer();
        mcpServerState.update((state) => ({
            ...state,
            ...serverState,
        }));
        mcpSettings.set({
            serverName: serverState.serverName,
            serverVersion: serverState.serverVersion,
            timeout: 10000,
            maxRetries: 3,
            retryDelay: 1000,
        });
        return serverState;
    }
    loadMcpServer();

    // ページ読み込み時に保存された設定一覧を取得
    async function loadSavedConfigs() {
        try {
            savedConfigs = await mcpActions.listConfigs();
        } catch (error) {
            console.error("Failed to load saved configs:", error);
        }
    }

    // 初期化
    loadSavedConfigs();

    // MCPサーバを起動
    async function startMcpServer() {
        loading.set(true);
        try {
            await mcpActions.startServer({
                openApiUrl: config.documentUrl!,
                serverName: $mcpSettings.serverName,
                serverVersion: $mcpSettings.serverVersion,
                timeout: $mcpSettings.timeout,
                maxRetries: $mcpSettings.maxRetries,
                requestSetting: get(config.storage.requestSetting),
            });
            snackbarMessage = "MCPサーバを起動しました";
            snackbar?.open();
            await loadMcpServer();
        } catch (error) {
            snackbarMessage = `起動エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
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
            mcpServerState.set({
                isRunning: false,
                openApiUrl: "",
                serverName: "",
                serverVersion: "",
                openApiDoc: null,
                availableTools: [],
                availableResources: [],
                error: null,
                lastStarted: null,
            });
        } catch (error) {
            snackbarMessage = `停止エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
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

    // リソース情報をコピー
    function copyResourceInfo(resource: ResourceInfo) {
        const resourceInfo = {
            uri: resource.uri,
            name: resource.name,
            method: resource.method,
            path: resource.path,
            description: resource.description,
            mimeType: resource.mimeType,
        };

        navigator.clipboard.writeText(JSON.stringify(resourceInfo, null, 2));
        snackbarMessage = `リソース「${resource.name}」の情報をコピーしました`;
        snackbar?.open();
    }

    // 設定を保存
    async function saveConfig() {
        if (!configName.trim()) {
            snackbarMessage = "設定名を入力してください";
            snackbar?.open();
            return;
        }

        loading.set(true);
        try {
            const configId = await mcpActions.saveConfig(
                config.documentUrl!,
                get(config.storage.requestSetting),
                configName.trim(),
                configDescription.trim() || undefined,
                editingConfigId,
            );

            snackbarMessage = editingConfigId
                ? "設定を更新しました"
                : "設定を保存しました";
            snackbar?.open();

            // ダイアログを閉じてフォームをリセット
            saveConfigDialog = false;
            configName = "";
            configDescription = "";
            editingConfigId = undefined;

            // 設定一覧を再読み込み
            await loadSavedConfigs();
        } catch (error) {
            snackbarMessage = `設定保存エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
            snackbar?.open();
        } finally {
            loading.set(false);
        }
    }

    // 設定を読み込んで適用
    async function loadAndApplyConfig(configId: string) {
        loading.set(true);
        try {
            const savedConfig = await mcpActions.loadConfig(configId);
            mcpActions.applyConfig(savedConfig);

            snackbarMessage = `設定「${savedConfig.name}」を適用しました`;
            snackbar?.open();
        } catch (error) {
            snackbarMessage = `設定読み込みエラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
            snackbar?.open();
        } finally {
            loading.set(false);
        }
    }

    // 設定IDから直接MCPサーバを起動
    async function startServerFromConfig(configId: string, configName: string) {
        loading.set(true);
        try {
            await mcpActions.startServerFromConfig(configId);
            snackbarMessage = `設定「${configName}」からMCPサーバを起動しました`;
            snackbar?.open();
        } catch (error) {
            snackbarMessage = `起動エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
            snackbar?.open();
        } finally {
            loading.set(false);
        }
    }

    // 設定を削除
    async function deleteConfig(configId: string, configName: string) {
        if (!confirm(`設定「${configName}」を削除しますか？`)) {
            return;
        }

        loading.set(true);
        try {
            await mcpActions.deleteConfig(configId);
            snackbarMessage = `設定「${configName}」を削除しました`;
            snackbar?.open();

            // 設定一覧を再読み込み
            await loadSavedConfigs();
        } catch (error) {
            snackbarMessage = `削除エラー: ${error instanceof Error ? error.message : "不明なエラー"}`;
            snackbar?.open();
        } finally {
            loading.set(false);
        }
    }

    // 設定を編集
    function editConfig(config: SavedMcpConfig) {
        configName = config.name;
        configDescription = config.description || "";
        editingConfigId = config.id;
        saveConfigDialog = true;
    }

    // 保存ダイアログを開く
    function openSaveDialog() {
        configName = "";
        configDescription = "";
        editingConfigId = undefined;
        saveConfigDialog = true;
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

            <!-- 詳細設定 -->
            <div class="advanced-settings">
                <Button
                    on:click={() =>
                        (showAdvancedSettings = !showAdvancedSettings)}
                    variant="outlined"
                >
                    <Label
                        >{showAdvancedSettings
                            ? "詳細設定を隠す"
                            : "詳細設定を表示"}</Label
                    >
                </Button>

                {#if showAdvancedSettings}
                    showAdvancedSettings={showAdvancedSettings}
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
    </Card>

    <!-- サーバ状態セクション -->
    <Card>
        <Content>
            <h2>MCPサーバの状態</h2>

            <div class="status-section">
                <div class="status-info">
                    <div class="status-item">
                        <strong>状態:</strong>
                        <span
                            class="status {$mcpServerState.isRunning
                                ? 'running'
                                : 'stopped'}"
                        >
                            {$mcpServerState.isRunning ? "実行中" : "停止中"}
                        </span>
                    </div>

                    {#if $mcpServerState.lastStarted}
                        <div class="status-item">
                            <strong>開始時刻:</strong>
                            {$mcpServerState.lastStarted.toLocaleString()}
                        </div>
                    {/if}

                    <div class="status-item">
                        <strong>利用可能ツール数:</strong>
                        {$mcpServerState.availableTools.length}
                    </div>

                    <div class="status-item">
                        <strong>利用可能リソース数:</strong>
                        {$mcpServerState.availableResources.length}
                    </div>
                </div>

                {#if $mcpServerState.error}
                    <div class="error-message">
                        <strong>エラー:</strong>
                        {$mcpServerState.error}
                        <Button
                            on:click={mcpActions.clearError}
                            variant="outlined"
                        >
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
                <Button on:click={startMcpServer} variant="raised">
                    <Label>MCPサーバを起動</Label>
                </Button>
            {/if}

            <Button
                on:click={openSaveDialog}
                variant="outlined"
                disabled={!$mcpServerState.isRunning}
            >
                <Label>現在の設定を保存</Label>
            </Button>
        </Actions>
    </Card>

    <!-- 設定管理セクション -->
    <Card>
        <Content>
            <h2>保存された設定</h2>

            <div class="config-management">
                <Button
                    on:click={() =>
                        (showConfigManagement = !showConfigManagement)}
                    variant="outlined"
                >
                    <Label
                        >{showConfigManagement
                            ? "設定管理を隠す"
                            : "設定管理を表示"}</Label
                    >
                </Button>

                {#if showConfigManagement}
                    <div class="config-list">
                        {#if savedConfigs.length > 0}
                            <DataTable style="width: 100%; margin-top: 16px;">
                                <Head>
                                    <Row>
                                        <Cell>設定名</Cell>
                                        <Cell>説明</Cell>
                                        <Cell>OpenAPI URL</Cell>
                                        <Cell>作成日</Cell>
                                        <Cell>更新日</Cell>
                                        <Cell>アクション</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each savedConfigs as config}
                                        <Row>
                                            <Cell
                                                ><strong>{config.name}</strong
                                                ></Cell
                                            >
                                            <Cell
                                                >{config.description ||
                                                    "-"}</Cell
                                            >
                                            <Cell>
                                                <code style="font-size: 0.9em;">
                                                    {config.config.openApiUrl
                                                        .length > 50
                                                        ? config.config.openApiUrl.substring(
                                                              0,
                                                              50,
                                                          ) + "..."
                                                        : config.config
                                                              .openApiUrl}
                                                </code>
                                            </Cell>
                                            <Cell
                                                >{new Date(
                                                    config.createdAt,
                                                ).toLocaleDateString()}</Cell
                                            >
                                            <Cell
                                                >{new Date(
                                                    config.updatedAt,
                                                ).toLocaleDateString()}</Cell
                                            >
                                            <Cell>
                                                <div class="action-buttons">
                                                    <IconButton
                                                        class="material-icons"
                                                        on:click={() =>
                                                            loadAndApplyConfig(
                                                                config.id,
                                                            )}
                                                        title="設定を適用"
                                                        size="mini"
                                                    >
                                                        download
                                                    </IconButton>
                                                    <IconButton
                                                        class="material-icons"
                                                        on:click={() =>
                                                            startServerFromConfig(
                                                                config.id,
                                                                config.name,
                                                            )}
                                                        title="この設定でMCPサーバを起動"
                                                        size="mini"
                                                        disabled={$mcpServerState.isRunning}
                                                    >
                                                        play_arrow
                                                    </IconButton>
                                                    <IconButton
                                                        class="material-icons"
                                                        on:click={() =>
                                                            editConfig(config)}
                                                        title="設定を編集"
                                                        size="mini"
                                                    >
                                                        edit
                                                    </IconButton>
                                                    <IconButton
                                                        class="material-icons"
                                                        on:click={() =>
                                                            deleteConfig(
                                                                config.id,
                                                                config.name,
                                                            )}
                                                        title="設定を削除"
                                                        size="mini"
                                                    >
                                                        delete
                                                    </IconButton>
                                                </div>
                                            </Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {:else}
                            <p style="margin-top: 16px; color: #666;">
                                保存された設定はありません。現在の設定を保存してください。
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        </Content>
    </Card>

    <!-- 利用可能ツール一覧 -->
    {#if $mcpServerState.availableTools.length > 0}
        <ExpansionCard title="利用可能なMCPツール">
            <Content>
                <h2>
                    利用可能なMCPツール ({$mcpServerState.availableTools
                        .length}件)
                </h2>
                <p>
                    POST、PUT、PATCH、DELETEメソッドのAPIがツールとして利用できます。
                </p>

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
                                    <span
                                        class="method-badge {tool.method.toLowerCase()}"
                                    >
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
        </ExpansionCard>
    {/if}

    <!-- 利用可能リソース一覧 -->
    {#if $mcpServerState.availableResources.length > 0}
        <ExpansionCard title="利用可能なMCPリソース">
            <Content>
                <h2>
                    利用可能なMCPリソース ({$mcpServerState.availableResources
                        .length}件)
                </h2>
                <p>GETメソッドのAPIがリソースとして利用できます。</p>

                <DataTable style="width: 100%;">
                    <Head>
                        <Row>
                            <Cell>リソース名</Cell>
                            <Cell>URI</Cell>
                            <Cell>パス</Cell>
                            <Cell>説明</Cell>
                            <Cell>アクション</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each $mcpServerState.availableResources as resource}
                            <Row>
                                <Cell><code>{resource.name}</code></Cell>
                                <Cell><code>{resource.uri}</code></Cell>
                                <Cell><code>{resource.path}</code></Cell>
                                <Cell>{resource.description}</Cell>
                                <Cell>
                                    <IconButton
                                        class="material-icons"
                                        on:click={() =>
                                            copyResourceInfo(resource)}
                                        title="リソース情報をコピー"
                                    >
                                        content_copy
                                    </IconButton>
                                </Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            </Content>
        </ExpansionCard>
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

                <h3>設定の管理</h3>
                <ul>
                    <li>「現在の設定を保存」ボタンで設定を保存できます</li>
                    <li>保存された設定から直接MCPサーバを起動できます</li>
                    <li>設定にはUUIDが自動的に割り当てられます</li>
                </ul>

                <h3>コマンドラインでの起動方法</h3>
                {#if $mcpServerState.openApiUrl}
                    <pre><code
                            >pnpm run mcp:start -- --url "{$mcpServerState.openApiUrl}"</code
                        ></pre>
                {:else}
                    <pre><code
                            >pnpm run mcp:start -- --url "https://your-api.com/openapi.json"</code
                        ></pre>
                {/if}
            </div>
        </Content>
    </Card>
</div>

<!-- 設定保存ダイアログ -->
<Dialog
    bind:open={saveConfigDialog}
    aria-labelledby="save-config-title"
    aria-describedby="save-config-content"
>
    <Title id="save-config-title">
        {editingConfigId ? "設定を更新" : "設定を保存"}
    </Title>
    <DialogContent id="save-config-content">
        <div class="dialog-form">
            <Textfield
                bind:value={configName}
                label="設定名"
                required
                style="width: 100%; margin-bottom: 16px;"
            />
            <Textfield
                bind:value={configDescription}
                label="説明（オプション）"
                style="width: 100%; margin-bottom: 16px;"
            />
            <p style="color: #666; font-size: 0.9em;">
                現在のOpenAPI
                URL、サーバ設定、リクエスト設定がすべて保存されます。
            </p>
        </div>
    </DialogContent>
    <DialogActions>
        <Button on:click={() => (saveConfigDialog = false)}>
            <Label>キャンセル</Label>
        </Button>
        <Button on:click={saveConfig} variant="raised">
            <Label>{editingConfigId ? "更新" : "保存"}</Label>
        </Button>
    </DialogActions>
</Dialog>

<Snackbar bind:this={snackbar}>
    <div class="snackbar-message">{snackbarMessage}</div>
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

    .sample-buttons {
        display: flex;
        gap: 12px;
        align-self: flex-start;
        flex-wrap: wrap;
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

    .request-settings {
        margin-top: 16px;
    }

    .request-settings-content {
        margin-top: 16px;
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        background-color: #fafafa;
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
        font-family: "Monaco", "Courier New", monospace;
    }

    .snackbar-message {
        color: white;
        font-weight: 500;
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
