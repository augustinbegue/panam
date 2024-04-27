<script lang="ts">
	import type {
		IMonitoringResponse,
		IProvider,
		IMessageRow,
		IProviderLineReferenceRow,
		ISettings,
		IMessagesResponse
	} from '$lib';
	import { onDestroy, onMount } from 'svelte';
	import idfmProvider from '$lib/providers/idfm.json';
	import { goto } from '$app/navigation';
	import type { Disruption, Line } from '@prisma/client';
	const idfm = idfmProvider as any as IProvider;

	let settings: ISettings;

	let panam: HTMLDivElement;

	let lineInfo: {
		line: Line;
		icons: {
			line: string;
			type: string;
		};
	};

	let arrivals = [0, 0];
	let monitoring: IMonitoringResponse;
	let destinations = ['La Courneuve', 'La Courneuve'];
	let currentTime = {
		hours: '00',
		minutes: '00'
	};

	$: multiMode = !destinations.every((d) => d === destinations[0]);

	let messages: IMessagesResponse = [];

	async function updateMonitoring() {
		const res = await fetch(
			`/api/${settings.provider}/stops/${encodeURIComponent(settings.stopId)}/monitoring`
		);

		monitoring = (await res.json()) as IMonitoringResponse;
		monitoring.arrivals = monitoring.arrivals.filter((m) => m.lineId.includes(settings.lineId));

		arrivals = monitoring.arrivals.map((m) =>
			Math.round((new Date(m.expectedArrivalTime).getTime() - Date.now()) / 1000 / 60)
		);

		destinations = monitoring.destinations;
	}

	let currentMessage = 0;
	async function updateMessages() {
		const res = await fetch(`/api/${settings.provider}/lines/${settings.lineId}/messages`);

		messages = (await res.json()) as IMessagesResponse;

		console.log(messages);
		if (currentMessage >= messages.length) {
			currentMessage = 0;
		}
	}

	async function cycleMessages() {
		currentMessage = (currentMessage + 1) % messages.length;
	}

	function updateTime() {
		currentTime = {
			hours: new Date().getHours().toString().padStart(2, '0'),
			minutes: new Date().getMinutes().toString().padStart(2, '0')
		};
	}

	let fetchInterval = 0;
	let timeInterval = 0;
	onMount(async () => {
		settings = JSON.parse(localStorage.getItem('settings') ?? '{}');
		if (!settings) {
			goto('/settings');
			return;
		}

		let lineRes = await fetch(`/api/${settings.provider}/lines/${settings.lineId}`);
		if (!lineRes.ok) {
			goto('/settings');
			return;
		}
		lineInfo = await lineRes.json();

		updateMonitoring();
		updateTime();
		updateMessages();
		fetchInterval = setInterval(() => {
			updateMonitoring();
			updateMessages();
			cycleMessages();
		}, 20_000);
		timeInterval = setInterval(() => {
			updateTime();
			arrivals = monitoring.arrivals.map((m) =>
				Math.round((new Date(m.expectedArrivalTime).getTime() - Date.now()) / 1000 / 60)
			);
		}, 1_000);
	});

	onDestroy(() => {
		clearInterval(fetchInterval);
		clearInterval(timeInterval);
	});
</script>

{#if !window.screenTop && !window.screenY}
	<div class="floating">
		<a href="/settings">
			<img src="/assets/icons/gear-solid.svg" alt="" />
		</a>

		<button on:click={() => panam.requestFullscreen()}>
			<img src="/assets/icons/expand-solid.svg" alt="" />
		</button>
	</div>
{/if}

{#if lineInfo}
	<div class="panam" bind:this={panam}>
		<div class="direction">
			<img src={lineInfo.icons.type} alt="" />
			<img src={lineInfo.icons.line} alt="" />
			{#if multiMode}
				<h1>
					{monitoring.info.name}
				</h1>
				<h2>
					{currentTime.hours}
					<span class="animate-pulse">:</span>
					{currentTime.minutes}
				</h2>
			{:else}
				<h1>{destinations[0] ?? '...'}</h1>
			{/if}
		</div>
		<div class="grow flex flex-row">
			{#if multiMode}
				<div class="multimode">
					{#if arrivals.length > 0}
						{#each arrivals.slice(0, 5) as arrival, i}
							<div>
								<p>{destinations[i]}</p>
								{#if arrival <= 0}
									<p class="animate-pulse">
										{0}
									</p>
								{:else if arrival <= 30}
									<p>
										{arrival}
									</p>
								{:else}
									<p>
										{new Date(monitoring.arrivals[i].expectedArrivalTime).toLocaleTimeString(
											'fr-FR',
											{
												hour: '2-digit',
												minute: '2-digit'
											}
										)}
									</p>
								{/if}
							</div>
						{/each}
					{:else}
						<div>
							<p>Aucune information disponible.</p>
						</div>
					{/if}
				</div>
			{:else}
				<div class="information">
					<div class="legends">
						<p>1<span class="text-xs align-super">er</span> {settings.type}</p>

						<p>2<span class="text-xs align-super">e</span> {settings.type}</p>

						<p class="time">
							{currentTime.hours}
							<span class="animate-pulse">:</span>
							{currentTime.minutes}
						</p>
					</div>
					<div class="times">
						{#if arrivals[0] <= 0}
							<p class="animate-pulse">0</p>
						{:else}
							<p>
								{arrivals[0] ?? '...'}
							</p>
						{/if}
						<span></span>
						<p>
							{arrivals[1] ?? '...'}
						</p>
					</div>
				</div>
			{/if}
			{#if messages.length > 0}
				<div class="min-w-[46%] max-w-[46%] bg-gray-200 rounded-t-xl mt-4 mr-4 font-parisine">
					<div class="flex flex-row gap-2 xl:gap-4">
						{#each messages as message, i}
							<div
								class="flex flex-row gap-2 xl:gap-4 rounded-t-xl p-2 xl:p-4"
								class:bg-white={currentMessage === i}
							>
								{#each message.impactedLines as l}
									<div class="flex flex-row gap-1 relative">
										{#key l.id}
											{#await fetch(`/api/${settings.provider}/lines/${l.id}`).then( (res) => res.json() ) then info}
												<img
													class="w-8 h-8 lg:w-10 lg:h-12 xl:w-14 xl:h-14 2xl:w-20 2xl:h-20"
													src={info.icons.type}
													alt=""
												/>
												<img
													class="w-8 h-8 lg:w-10 lg:h-12 xl:w-14 xl:h-14 2xl:w-20 2xl:h-20"
													src={info.icons.line}
													alt=""
												/>
											{/await}
										{/key}
										{#if message.severity === 'INFORMATION'}
											<img
												class="absolute w-4 h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 right-[-0.25rem] xl:right-[-0.75rem] top-[-0.25rem] xl:top-[-0.75rem]"
												src="/assets/icons/traffic-1.svg"
												alt=""
											/>
										{:else if message.severity === 'PERTURBEE'}
											<img
												class="absolute w-4 h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 right-[-0.25rem] xl:right-[-0.75rem] top-[-0.25rem] xl:top-[-0.75rem]"
												src="/assets/icons/traffic-4.svg"
												alt=""
											/>
										{:else if message.severity === 'BLOQUANTE'}
											<img
												class="absolute w-4 h-4 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-10 2xl:h-10 right-[-0.25rem] xl:right-[-0.75rem] top-[-0.25rem] xl:top-[-0.75rem]"
												src="/assets/icons/traffic-3.svg"
												alt=""
											/>
										{/if}
									</div>
								{/each}
							</div>
						{/each}
					</div>
					<div
						class="p-4 bg-white h-full font-parisine text-xl lg:text-2xl xl:text-4xl 2xl:text-[6xl]"
					>
						{#each messages as message, i}
							<div class:hidden={currentMessage !== i}>
								<h1 class="font-bold">{@html message.title}</h1>
								{@html message.message}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		<div class="line" style="background-color: #{lineInfo.line.colourWebHexa};"></div>
	</div>
{/if}
