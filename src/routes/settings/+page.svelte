<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ILineStopsResponse, IProvider, ISettings } from '$lib';
	import idfmProvider from '$lib/providers/idfm.json';
	import type { Line, Stop } from '@prisma/client';
	import { onMount } from 'svelte';
	const idfm = idfmProvider as any as IProvider;

	let settings: ISettings = JSON.parse(localStorage.getItem('settings') || '{}');

	function saveSettings() {
		localStorage.setItem('settings', JSON.stringify(settings));
		goto('/');
	}

	let lines: Line[] = [];
	async function getLines() {
		const type = idfm.types[settings.type];

		if (!type) return [];

		const res = await fetch(`/api/idfm/lines/list/${type.transportmode}/${type.transportsubmode}`);

		if (!res.ok) return [];

		lines = await res.json();
		lines = lines.sort((a, b) => {
			if (!isNaN(parseInt(a.name)) && !isNaN(parseInt(b.name))) {
				return parseInt(a.name) - parseInt(b.name);
			} else {
				return a.name.localeCompare(b.name);
			}
		});
	}

	let stops: {
		name: string;
		directions: {
			[name: string]: {
				id: string;
			};
		};
	}[] = [];
	let stopIndex: number = 0;
	async function getStops() {
		const res = await fetch(`/api/idfm/lines/${settings.lineId}/stops`);

		if (!res.ok) return;

		let data = (await res.json()) as ILineStopsResponse;

		stops = [];
		stops = data.reduce((acc, stop) => {
			if (!acc.find((s) => s.name === stop.name)) {
				let i = acc.push({
					name: stop.name,
					directions: {}
				});

				let key = stop.arrivals.map((a) => a.destinationDisplay).join(' • ');
				acc[i - 1].directions[key] = {
					id: stop.id
				};
			} else {
				let i = acc.findIndex((s) => s.name === stop.name);
				let key = stop.arrivals.map((a) => a.destinationDisplay).join(' • ');
				acc[i].directions[key] = {
					id: stop.id
				};
			}

			return acc;
		}, stops);

		stops = stops.filter(
			(s) => Object.keys(s.directions).length > 0 && Object.keys(s.directions)[0] !== ''
		);

		if (settings.stopId) {
			let stop = stops.find((s) =>
				Object.keys(s.directions).find((d) => s.directions[d].id === settings.stopId)
			);
			if (stop) stopIndex = stops.indexOf(stop);
		}
	}

	onMount(async () => {
		if (!settings.type) settings.type = Object.keys(idfm.types)[0];

		await getLines();
		if (!settings.lineId && lines.length > 0) settings.lineId = lines[0].id;

		await getStops();
		if (!settings.stopId && stops.length > 0) stopIndex = 0;
	});
</script>

<div class="floating">
	<a href="/">
		<img src="/assets/icons/arrow-left-solid.svg" alt="" />
	</a>
</div>

<div class="panam">
	<div class="direction">
		<i class="fa-solid fa-gear"></i>
		<h1>Settings</h1>
	</div>
	<div class="information">
		<form on:submit|preventDefault={saveSettings}>
			<label>
				<span>Provider</span>
				<select bind:value={settings.provider} disabled>
					<option value="idfm">Île-de-France Mobilités</option>
				</select>
			</label>

			<label>
				<span>
					Type
					<img src="/assets/icons/{settings.type}.svg" alt={settings.type} />
				</span>

				<select
					bind:value={settings.type}
					on:change={async () => {
						await getLines();
						settings.lineId = lines[0].id;
						await getStops();
						stopIndex = 0;
					}}
				>
					{#each Object.keys(idfm.types) as type}
						<option value={type} selected={type === settings.type}>
							{type}
						</option>
					{/each}
				</select>
			</label>

			<label>
				<span>Line</span>
				<div class="flex flex-row gap-4 pb-4">
					{#each lines as line}
						<button
							class=" border-white"
							on:click|preventDefault={async (e) => {
								settings.lineId = line.id;
								await getStops();
								stopIndex = 0;
							}}
							class:border-4={line.id === settings.lineId}
							class:bg-white={line.id === settings.lineId}
							class:rounded-full={settings.type === 'metro'}
							class:rounded-2xl={settings.type === 'rer' || settings.type === 'train'}
							class:rounded-md={settings.type === 'tram'}
						>
							<img
								class="w-16 h-16"
								src="/assets/icons/{settings.type}-{settings.type === 'tram'
									? line.name.toLowerCase().slice(1)
									: line.name.toLowerCase()}.svg"
								alt="{settings.type}-{line.name}"
							/>
						</button>
					{/each}
				</div>
			</label>

			<label>
				<span>Stop</span>
				<select
					bind:value={stopIndex}
					on:change={async () => {
						settings.stopId = stops[stopIndex].directions[0].id;
					}}
				>
					{#each stops as stop, i}
						<option value={i} selected={i === stopIndex}>
							{stop.name}
						</option>
					{/each}
				</select>
			</label>

			{#if stops[stopIndex]}
				<label>
					<span>Direction</span>
					<select bind:value={settings.stopId}>
						{#each Array.from(Object.keys(stops[stopIndex].directions)) as direction}
							<option
								value={stops[stopIndex].directions[direction].id}
								selected={direction === settings.stopId}
							>
								{direction}
							</option>
						{/each}
					</select>
				</label>
			{/if}

			<button type="submit">Save</button>
		</form>
	</div>
	<div class="line" style="background-color: {idfm.color};"></div>
</div>
