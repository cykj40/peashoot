<script lang="ts" generics="TItem extends Item">
import { dragManager } from '../../dnd/drag-manager'
import { dragState } from '../../dnd/state'
import GridPlacementTile from '../ui/GridPlacementTile.svelte'
import { DEFAULT_LAYOUT_PARAMS } from '../grid-layout-constants'
import { clickOrHold } from '../actions/clickOrHold'
import type { Item, ItemPlacement } from '@peashoot/types'

export interface GridToolbarProps<TItem extends Item> {
	items: TItem[]
	[k: string]: unknown
}

const { items = [], ...rest }: GridToolbarProps<TItem> = $props()

// Group items by category, but deduplicate by unique combination of category + variant + displayName
interface ToolbarCategory {
	category: string
	items: TItem[]
	representativeItem: TItem // The first item to show as the icon
}

function itemListToToolbarCategories(items: TItem[]): ToolbarCategory[] {
	const categoryMap = new Map<string, TItem[]>()
	const seenItems = new Set<string>()

	for (const item of items) {
		// Create a unique key for deduplication: category + variant + displayName
		const uniqueKey = `${item.category}|${item.variant}|${item.displayName}`

		// Skip if we've already seen this exact item
		if (seenItems.has(uniqueKey)) {
			continue
		}
		seenItems.add(uniqueKey)

		const category = item.category
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		const categoryItems = categoryMap.get(category)
		if (categoryItems) {
			categoryItems.push(item)
		}
	}

	return Array.from(categoryMap.entries()).map(([category, categoryItems]) => ({
		category,
		items: categoryItems,
		representativeItem: categoryItems[0],
	}))
}

const categories = $derived(itemListToToolbarCategories(items))

// Track which category dropdown is open
let openDropdown = $state<string | null>(null)

// Track selected item for each category (defaults to first item)
const categorySelectedItems = $state<Map<string, TItem>>(new Map())

function toggleDropdown(category: string) {
	openDropdown = openDropdown === category ? null : category
}

function selectCategoryItem(category: string, item: TItem) {
	categorySelectedItems.set(category, item)
	openDropdown = null
}

// Handle starting drag from toolbar
function handleToolbarDrag(item: TItem, event: MouseEvent | TouchEvent) {
	dragManager.startDraggingNewItem(item, event)
}

// Create a GridPlacement for toolbar display
function createToolbarGridPlacement(item: TItem): ItemPlacement {
	return {
		id: `toolbar_placement_${item.id}`,
		position: { x: 0, y: 0 },
		item: item,
		sourceZoneId: 'toolbar',
	}
}

// Calculate tile size for toolbar
const toolbarTileSize = DEFAULT_LAYOUT_PARAMS.cellSize

// Close dropdown when clicking outside
function handleClickOutside(event: MouseEvent) {
	const target = event.target as HTMLElement
	if (!target.closest('.plant-toolbar__category')) {
		openDropdown = null
	}
}
</script>

<style lang="scss">
.plant-toolbar__tile-container--size-2::before {
	content: '2×2';
	position: absolute;
	top: 2px;
	right: 2px;
	font-size: 8px;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 1px 3px;
	border-radius: 2px;
	z-index: 10;
}

.plant-toolbar__dropdown {
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	margin-top: 8px;
	background: white;
	border: 2px solid rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	padding: 8px;
	z-index: 1000;
	min-width: 200px;
	max-height: 300px;
	overflow-y: auto;

	&::before {
		content: '';
		position: absolute;
		top: -8px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-bottom: 8px solid rgba(0, 0, 0, 0.2);
	}

	&::after {
		content: '';
		position: absolute;
		top: -6px;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-bottom: 6px solid white;
	}
}

.plant-toolbar__dropdown-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px;
	border-radius: 4px;
	cursor: grab;
	transition: background-color 0.15s;
	user-select: none;

	&:hover {
		background-color: #f0f0f0;
	}

	&:active {
		cursor: grabbing;
	}

	&--selected {
		background-color: #e3f2fd;
	}
}

.plant-toolbar__category-badge {
	position: absolute;
	bottom: 2px;
	right: 2px;
	background: rgba(0, 0, 0, 0.7);
	color: white;
	font-size: 10px;
	padding: 2px 4px;
	border-radius: 3px;
	z-index: 10;
	pointer-events: none;
}

.plant-toolbar-item {
	transition: all 0.2s;
}
</style>

<svelte:window onclick={handleClickOutside} />

<div
	{...rest}
	class={`plant-toolbar overflow-visible mb-6 ${typeof rest.class === 'string' ? rest.class : ''} ${$dragState.draggedNewItem !== null ? 'dragging' : ''}`}
>
	<div
		class="plant-toolbar__grid grid grid-cols-[repeat(auto-fit,minmax(60px,1fr))] gap-1"
	>
		{#each categories as { category, items: categoryItems, representativeItem } (category)}
			{@const selectedItem = categorySelectedItems.get(category) || representativeItem}
			{@const toolbarPlacement = createToolbarGridPlacement(selectedItem)}
			{@const isDropdownOpen = openDropdown === category}

			<div
				class="plant-toolbar__category plant-toolbar__item flex flex-col items-center gap-1 relative overflow-visible"
			>
				<!-- Category tile -->
				<div
					class={`plant-toolbar__tile-container relative w-[60px] h-[60px] flex items-center justify-center rounded-md border-2 border-black/40 box-border shadow-md user-select-none cursor-grab transition-transform transition-shadow duration-100 overflow-visible
					${selectedItem.size > 1 ? 'plant-toolbar__tile-container--size-2' : ''}`}
					role="button"
					tabindex="0"
					use:clickOrHold={{
						onClick: () => {
							if (categoryItems.length > 1) {
								toggleDropdown(category)
							}
						},
						onHold: (e) => {
							handleToolbarDrag(selectedItem, e)
						},
					}}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault()
							if (categoryItems.length > 1) {
								toggleDropdown(category)
							} else {
								const syntheticEvent = new MouseEvent('mousedown', {
									clientX: 0,
									clientY: 0,
									bubbles: true,
								})
								handleToolbarDrag(selectedItem, syntheticEvent)
							}
						}
					}}
				>
					<GridPlacementTile
						placement={toolbarPlacement}
						sizePx={toolbarTileSize}
						showSizeBadge={true}
					/>
					{#if categoryItems.length > 1}
						<div class="plant-toolbar__category-badge">
							{categoryItems.length}
						</div>
					{/if}
				</div>

				<!-- Dropdown for multiple items in category -->
				{#if isDropdownOpen && categoryItems.length > 1}
					<div class="plant-toolbar__dropdown">
						{#each categoryItems as item (item.id)}
							{@const itemPlacement = createToolbarGridPlacement(item)}
							<div
								class="plant-toolbar__dropdown-item"
								class:plant-toolbar__dropdown-item--selected={selectedItem.id === item.id}
								role="button"
								tabindex="0"
								use:clickOrHold={{
									onClick: () => {
										selectCategoryItem(category, item)
									},
									onHold: (e) => {
										// Start dragging from dropdown item
										handleToolbarDrag(item, e)
									},
								}}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault()
										selectCategoryItem(category, item)
									}
								}}
							>
								<div class="w-[40px] h-[40px] flex-shrink-0">
									<GridPlacementTile
										placement={itemPlacement}
										sizePx={40}
										disableTooltip={true}
									/>
								</div>
								<div class="flex-1">
									<div class="font-medium text-sm">{item.displayName}</div>
									<div class="text-xs text-gray-500">{item.variant}</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Label -->
				<div class="plant-toolbar__label text-xs font-medium text-gray-500 text-center">
					{category}
				</div>
			</div>
		{/each}
	</div>
</div>
