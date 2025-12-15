<script lang="ts">
	import Dialog, { Title, Content, Actions } from "@smui/dialog";
	import Button, { Icon, Label } from "@smui/button";
	import Select, { Option } from "@smui/select";
	import { getContext } from "svelte";
	import OperationList from "./OperationList.svelte";
    import type { Writable } from "svelte/store";
    import { RestfulOperation } from "$lib/restful/RestfulOperation";
    import { type RestfulComponentConfig } from "$lib/restful/RestfulInterfaces";
	import Short from "$lib/components/common/Short.svelte";

	const operationStore = getContext("operationStore") as Writable<RestfulOperation>;
	const config = getContext("config") as RestfulComponentConfig
	let {
		value = "",
		column = "",
		item = {}
	}: {
		value?: string | any[];
		column?: string;
		item?: object;
	} = $props();
	let open = $state(false);
	let selectedIndex = $state<string | null>(null);

	// 配列かどうかを判定
	const isArray = $derived(Array.isArray(value));
	const arrayValue = $derived(isArray ? value as any[] : []);

	// 配列が空でない場合、最初の要素を選択
	$effect(() => {
		if (isArray && arrayValue.length > 0 && selectedIndex === null) {
			selectedIndex = "0";
		}
	});

	// 実際に使用する値（配列の場合は選択された要素、そうでない場合はvalueそのまま）
	const actualValue = $derived.by(() => {
		if (isArray) {
			if (selectedIndex !== null) {
				const index = parseInt(selectedIndex, 10);
				if (!isNaN(index) && index >= 0 && index < arrayValue.length) {
					return String(arrayValue[index]);
				}
			}
			return "";
		}
		return String(value ?? "");
	});

	// x-restfului-link拡張情報からリンクを生成
	const links = $derived.by(() => {
		if (!column || !actualValue) return [];
		const operation = $operationStore;
		const propertyDef = operation.getPropertyDefinition(column);
		if (!propertyDef) return [];
		
		const extended = propertyDef as any;
		const xLink = extended['x-restfului-link'];
		if (!xLink) return [];
		
		// 配列または単一の値に対応
		const linkArray = Array.isArray(xLink) ? xLink : [xLink];
		
		// プレースホルダーを実際の値に置き換え
		return linkArray.map((link: string) => {
			// {value} や {$value} や {column} や {owl:sameAs} などの形式のプレースホルダーを置き換え
			return link.replace(/\{([^}]+)\}/g, (match, placeholder) => {
				// {value} または {$value} の場合は actualValue を使用
				if (placeholder === 'value' || placeholder === '$value') {
					return encodeURIComponent(actualValue);
				}
				// プレースホルダーが column 名と一致する場合は actualValue を使用
				if (placeholder === column) {
					return encodeURIComponent(actualValue);
				}
				// その他のプレースホルダーは item から取得を試みる
				if (item && typeof item === 'object') {
					const itemValue = (item as any)[placeholder];
					if (itemValue !== undefined) {
						return encodeURIComponent(String(itemValue));
					}
				}
				// プレースホルダーが見つからない場合は、actualValue を使用（フォールバック）
				return encodeURIComponent(actualValue);
			});
		});
	});
</script>

<Dialog bind:open>
	<Title>Link - {column}</Title>
	<Content>
		{#if open}
			{#if isArray && arrayValue.length > 0}
				<div style="margin-bottom: 16px;">
					<div style="font-weight: bold; margin-bottom: 8px;">配列要素を選択:</div>
					<div style="margin-bottom: 16px;">
						<Select 
							variant="outlined" 
							bind:value={selectedIndex}
							style="width: 100%;"
						>
							{#each arrayValue as itemValue, index}
								<Option value={String(index)}>
									[{index}] {String(itemValue).substring(0, 100)}{String(itemValue).length > 100 ? '...' : ''}
								</Option>
							{/each}
						</Select>
					</div>
					{#if selectedIndex !== null}
						{@const index = parseInt(selectedIndex, 10)}
						{#if !isNaN(index) && index >= 0 && index < arrayValue.length}
							<div style="margin-bottom: 16px;">
								<div style="font-weight: bold; margin-bottom: 8px;">選択された値:</div>
								<div style="padding: 8px; background-color: #f5f5f5; border-radius: 4px;">
									<Short value={arrayValue[index]} length={200}></Short>
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{:else if isArray}
				<div style="margin-bottom: 16px; color: #666;">
					配列が空です
				</div>
			{/if}
			
			{#if links.length > 0 && actualValue}
				<div style="margin-bottom: 16px;">
					<div style="font-weight: bold; margin-bottom: 8px;">x-restfului-link:</div>
					<div style="display: flex; flex-direction: column; gap: 8px;">
						{#each links as link}
							{@const pathAndQuery = link.split('?')}
							{@const path = pathAndQuery[0]}
							{@const query = pathAndQuery[1] || ""}
							<a 
								href={config.linkSupport.createLink({
									page: "operation",
									restPath: path,
									restMethod: "get",
									additionalSearch: query,
								})}
								style="color: #1976d2; text-decoration: underline; font-size: 0.875rem; word-break: break-all; display: block;"
							>
								{path}{query ? '?' + query : ''}
							</a>
						{/each}
					</div>
				</div>
			{/if}
			
			{#if actualValue}
				<OperationList {config} value={actualValue} {column} {item} currentOperation={$operationStore} ></OperationList>
			{/if}
		{/if}
	</Content>
	<Actions>
		<Button onclick={() => (open = false)}>
			<Label>Close</Label>
		</Button>
	</Actions>
</Dialog>
<div style="display: flex; justify-content: center; align-items: center; gap: 8px;">
	<Button>
		<Icon class="material-icons" onclick={() => (open = true)}>link</Icon>
	</Button>
	<Short value={value}></Short>
</div>
