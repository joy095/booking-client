<script lang="ts">
	import { onMount } from 'svelte';

	// Reactive state using Svelte 5's `reactive` store pattern
	let state = $state({
		image: null as HTMLImageElement | null,
		originalSize: 0,
		width: 0,
		height: 0,
		originalWidth: 0,
		originalHeight: 0,
		brightness: 100,
		contrast: 100,
		saturation: 100,
		hue: 0,
		blur: 0,
		sepia: 0,
		grayscale: false,
		invert: false,
		rotation: 0,
		flipH: false,
		flipV: false,
		format: 'webp' as 'webp' | 'jpeg' | 'png',
		quality: 80,
		maintainAspect: true
	});

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;
	let fileInput: HTMLInputElement;
	let uploadSection: HTMLElement;
	let editorSection: HTMLElement;
	let timeout: ReturnType<typeof setTimeout>;

	onMount(() => {
		ctx = canvas.getContext('2d');
	});

	function debouncedUpdateSizeInfo() {
		clearTimeout(timeout);
		timeout = setTimeout(updateSizeInfo, 500);
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const img = new Image();
			img.onload = () => {
				const tempCanvas = document.createElement('canvas');
				tempCanvas.width = img.naturalWidth;
				tempCanvas.height = img.naturalHeight;
				const tempCtx = tempCanvas.getContext('2d');
				if (!tempCtx) return;
				tempCtx.drawImage(img, 0, 0);

				tempCanvas.toBlob(
					(blob) => {
						if (!blob) return;
						state.originalSize = blob.size;
						const webpUrl = URL.createObjectURL(blob);
						const processedImg = new Image();
						processedImg.onload = () => {
							state.image = processedImg;
							state.originalWidth = processedImg.naturalWidth;
							state.originalHeight = processedImg.naturalHeight;
							state.width = processedImg.naturalWidth;
							state.height = processedImg.naturalHeight;
							state.format = 'webp';
							state.quality = 80;
							uploadSection.classList.add('hidden');
							editorSection.classList.remove('hidden');
							render();
						};
						processedImg.src = webpUrl;
					},
					'image/webp',
					0.8
				);
			};
			img.src = event.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function render() {
		if (!state.image || !ctx) return;

		canvas.width = state.width;
		canvas.height = state.height;

		ctx.save();
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		ctx.translate(centerX, centerY);
		ctx.rotate((state.rotation * Math.PI) / 180);
		ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
		ctx.translate(-centerX, -centerY);

		ctx.filter = [
			`brightness(${state.brightness}%)`,
			`contrast(${state.contrast}%)`,
			`saturate(${state.saturation}%)`,
			`hue-rotate(${state.hue}deg)`,
			`blur(${state.blur}px)`,
			`sepia(${state.sepia}%)`,
			state.grayscale ? 'grayscale(100%)' : 'grayscale(0%)',
			state.invert ? 'invert(100%)' : 'invert(0%)'
		].join(' ');

		ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
		ctx.restore();
		updateSizeInfo();
	}

	async function updateSizeInfo() {
		if (!state.image || !canvas) return;
		const mimeType =
			state.format === 'png' ? 'image/png' : state.format === 'jpeg' ? 'image/jpeg' : 'image/webp';
		const quality = state.format === 'png' ? undefined : state.quality / 100;

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const originalSizeEl = document.getElementById('originalSize');
				const editedSizeEl = document.getElementById('editedSize');
				const sizeReductionEl = document.getElementById('sizeReduction');
				const sizeInfoEl = document.getElementById('sizeInfo');

				if (!originalSizeEl || !editedSizeEl || !sizeReductionEl || !sizeInfoEl) return;

				originalSizeEl.textContent = formatSize(state.originalSize);
				editedSizeEl.textContent = formatSize(blob.size);
				const reduction = ((state.originalSize - blob.size) / state.originalSize) * 100;
				sizeReductionEl.textContent =
					reduction > 0 ? `↓ ${reduction.toFixed(1)}%` : `↑ ${Math.abs(reduction).toFixed(1)}%`;
				sizeReductionEl.className = 'size-reduction ' + (reduction > 0 ? 'positive' : 'negative');
				sizeInfoEl.classList.remove('hidden');
			},
			mimeType,
			quality
		);
	}

	function formatSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
	}

	let downloadText = $derived(`Download ${state.format.toUpperCase()}`);

	function setFormat(format: 'webp' | 'jpeg' | 'png') {
		state.format = format;
		const qualityControl = document.getElementById('qualityControl');
		if (qualityControl) qualityControl.style.display = format === 'png' ? 'none' : 'block';
		debouncedUpdateSizeInfo();
	}

	function rotate(deg: number) {
		state.rotation = (state.rotation + deg + 360) % 360;
	}

	function toggleFlip(direction: 'h' | 'v') {
		if (direction === 'h') state.flipH = !state.flipH;
		else state.flipV = !state.flipV;
	}

	function downloadImage() {
		if (!canvas) return;
		const mimeType =
			state.format === 'png' ? 'image/png' : state.format === 'jpeg' ? 'image/jpeg' : 'image/webp';
		const quality = state.format === 'png' ? undefined : state.quality / 100;
		const ext = state.format === 'jpeg' ? 'jpg' : state.format;

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `edited-image.${ext}`;
				a.click();
				URL.revokeObjectURL(url);
			},
			mimeType,
			quality
		);
	}

	function setPreset(preset) {
		let targetWidth, targetHeight;
		const aspect = state.maintainAspect;

		if (preset === 'hd') {
			targetWidth = 1920;
			targetHeight = 1080;
		} else if (preset === '2k') {
			targetWidth = 2560;
			targetHeight = 1440;
		} else {
			// Square presets: scale to fit within square while maintaining aspect if enabled
			const maxDim = preset;
			if (aspect) {
				const ratio = state.originalWidth / state.originalHeight;
				if (ratio >= 1) {
					state.width = maxDim;
					state.height = Math.round(maxDim / ratio);
				} else {
					state.height = maxDim;
					state.width = Math.round(maxDim * ratio);
				}
			} else {
				state.width = maxDim;
				state.height = maxDim;
			}
			return;
		}

		// Fixed aspect presets: scale to fit within bounds if maintaining aspect
		if (aspect) {
			const targetRatio = targetWidth / targetHeight;
			const origRatio = state.originalWidth / state.originalHeight;
			if (origRatio > targetRatio) {
				state.height = targetHeight;
				state.width = Math.round(targetHeight * origRatio);
			} else {
				state.width = targetWidth;
				state.height = Math.round(targetWidth / origRatio);
			}
		} else {
			state.width = targetWidth;
			state.height = targetHeight;
		}
	}

	function resetFilters() {
		state.brightness = 100;
		state.contrast = 100;
		state.saturation = 100;
		state.hue = 0;
		state.blur = 0;
		state.sepia = 0;
		state.grayscale = false;
		state.invert = false;
		state.rotation = 0;
		state.flipH = false;
		state.flipV = false;
	}

	function resetAll() {
		resetFilters();
		state.image = null;
		state.width = 0;
		state.height = 0;
		uploadSection.classList.remove('hidden');
		editorSection.classList.add('hidden');
		fileInput.value = '';
		const sizeInfo = document.getElementById('sizeInfo');
		if (sizeInfo) sizeInfo.classList.add('hidden');
	}

	$effect(() => {
		if (state.image) render();
	});

	$effect(() => {
		if (state.image) debouncedUpdateSizeInfo();
	});

	function updateHeightFromWidth() {
		if (state.maintainAspect) {
			const ratio = state.originalWidth / state.originalHeight;
			state.height = Math.round(state.width / ratio);
		}
	}

	function updateWidthFromHeight() {
		if (state.maintainAspect) {
			const ratio = state.originalWidth / state.originalHeight;
			state.width = Math.round(state.height * ratio);
		}
	}
</script>

<div class="container">
	<h1 class="title">Live Image Editor</h1>

	<div id="uploadSection" class="upload-card" bind:this={uploadSection}>
		<svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
			/>
		</svg>
		<h2 class="upload-title">Upload an Image</h2>
		<p class="upload-text">Choose an image to start editing with live preview</p>
		<label>
			<input
				type="file"
				accept="image/*"
				bind:this={fileInput}
				on:change={handleFileInput}
				class="file-input"
			/>
			<span class="upload-btn">Select Image</span>
		</label>
	</div>

	<div id="editorSection" class="editor-grid hidden" bind:this={editorSection}>
		<div class="preview-panel">
			<div class="panel-header">
				<h2 class="panel-title">Live Preview</h2>
				<button on:click={resetAll} class="close-btn">✕</button>
			</div>
			<div class="canvas-container">
				<canvas id="mainCanvas" bind:this={canvas}></canvas>
			</div>
			<div id="sizeInfo" class="size-info hidden">
				<div class="size-item">
					<span class="size-label">Original:</span>
					<span class="size-value" id="originalSize">0 KB</span>
				</div>
				<div>→</div>
				<div class="size-item">
					<span class="size-label">Edited:</span>
					<span class="size-value" id="editedSize">0 KB</span>
				</div>
				<div id="sizeReduction" class="size-reduction">0%</div>
			</div>
			<div class="action-buttons">
				<button on:click={downloadImage} class="download-btn">{downloadText}</button>
				<button on:click={resetAll} class="secondary-btn">New Image</button>
			</div>
		</div>

		<div class="controls-panel">
			<div class="controls-scroll">
				<div class="control-section">
					<h3 class="section-title">Preset Sizes</h3>
					<div class="preset-buttons">
						<button on:click={() => setPreset(512)} class="preset-btn">512px Square</button>
						<button on:click={() => setPreset(1024)} class="preset-btn">1024px Square</button>
						<button on:click={() => setPreset('hd')} class="preset-btn">HD (1920x1080)</button>
						<button on:click={() => setPreset('2k')} class="preset-btn">2K (2560x1440)</button>
					</div>
				</div>

				<div class="control-section">
					<h3 class="section-title">Dimensions</h3>
					<div class="control-item">
						<label class="control-label">Width: {state.width}px</label>
						<input
							type="number"
							class="dimension-input"
							bind:value={state.width}
							on:input={updateHeightFromWidth}
						/>
					</div>
					<div class="control-item">
						<label class="control-label">Height: {state.height}px</label>
						<input
							type="number"
							class="dimension-input"
							bind:value={state.height}
							on:input={updateWidthFromHeight}
						/>
					</div>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={state.maintainAspect} />
						<span>Maintain aspect ratio</span>
					</label>
				</div>

				<div class="control-section">
					<h3 class="section-title">Output Settings</h3>
					<div class="control-item">
						<label class="control-label">Format</label>
						<div class="format-buttons">
							<button
								class="format-btn {state.format === 'webp' ? 'active' : ''}"
								on:click={() => setFormat('webp')}>WebP</button
							>
							<button
								class="format-btn {state.format === 'jpeg' ? 'active' : ''}"
								on:click={() => setFormat('jpeg')}>JPEG</button
							>
							<button
								class="format-btn {state.format === 'png' ? 'active' : ''}"
								on:click={() => setFormat('png')}>PNG</button
							>
						</div>
					</div>
					<div class="control-item" id="qualityControl">
						<label class="control-label">Quality: {state.quality}%</label>
						<input
							type="range"
							min="1"
							max="100"
							step="5"
							bind:value={state.quality}
							class="slider"
						/>
					</div>
				</div>

				<div class="control-section">
					<h3 class="section-title">Adjustments</h3>
					<div class="control-item">
						<label class="control-label">Brightness: {state.brightness}%</label>
						<input
							type="range"
							min="0"
							max="200"
							step="5"
							bind:value={state.brightness}
							class="slider"
						/>
					</div>
					<div class="control-item">
						<label class="control-label">Contrast: {state.contrast}%</label>
						<input
							type="range"
							min="0"
							max="200"
							step="5"
							bind:value={state.contrast}
							class="slider"
						/>
					</div>
					<div class="control-item">
						<label class="control-label">Saturation: {state.saturation}%</label>
						<input
							type="range"
							min="0"
							max="200"
							step="5"
							bind:value={state.saturation}
							class="slider"
						/>
					</div>
					<div class="control-item">
						<label class="control-label">Hue: {state.hue}°</label>
						<input type="range" min="0" max="360" step="1" bind:value={state.hue} class="slider" />
					</div>
					<div class="control-item">
						<label class="control-label">Blur: {state.blur}px</label>
						<input
							type="range"
							min="0"
							max="10"
							step="0.5"
							bind:value={state.blur}
							class="slider"
						/>
					</div>
					<div class="control-item">
						<label class="control-label">Sepia: {state.sepia}%</label>
						<input
							type="range"
							min="0"
							max="100"
							step="5"
							bind:value={state.sepia}
							class="slider"
						/>
					</div>
				</div>

				<div class="control-section">
					<h3 class="section-title">Filters</h3>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={state.grayscale} />
						<span>Grayscale</span>
					</label>
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={state.invert} />
						<span>Invert</span>
					</label>
				</div>

				<div class="control-section">
					<h3 class="section-title">Transform</h3>
					<div class="control-item">
						<label class="control-label">Rotation: {state.rotation}°</label>
						<div class="button-group">
							<button on:click={() => rotate(-90)} class="transform-btn">↶ -90°</button>
							<button on:click={() => rotate(90)} class="transform-btn">↷ +90°</button>
						</div>
					</div>
					<div class="button-group">
						<button
							on:click={() => toggleFlip('h')}
							class="transform-btn {state.flipH ? 'active' : ''}">Flip H</button
						>
						<button
							on:click={() => toggleFlip('v')}
							class="transform-btn {state.flipV ? 'active' : ''}">Flip V</button
						>
					</div>
				</div>

				<button on:click={resetFilters} class="reset-btn">Reset Filters</button>
			</div>
		</div>
	</div>
</div>

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	body {
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: linear-gradient(135deg, #f5f3ff 0%, #dbeafe 100%);
		min-height: 100vh;
		padding: 1rem;
	}

	.container {
		max-width: 1400px;
		margin: 0 auto;
	}

	.title {
		font-size: 2.25rem;
		font-weight: bold;
		text-align: center;
		margin-bottom: 2rem;
		color: #1f2937;
	}

	.upload-card {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		text-align: center;
	}

	.upload-icon {
		width: 4rem;
		height: 4rem;
		margin: 0 auto 1rem;
		color: #9333ea;
	}

	.upload-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.upload-text {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.file-input {
		display: none;
	}

	.upload-btn {
		display: inline-block;
		background: #9333ea;
		color: white;
		padding: 0.75rem 2rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background 0.2s;
		border: none;
		font-size: 1rem;
	}

	.upload-btn:hover {
		background: #7e22ce;
	}

	.editor-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.editor-grid {
			grid-template-columns: 2fr 1fr;
		}
	}

	.preview-panel,
	.controls-panel {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.panel-title {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		padding: 0.5rem;
	}

	.canvas-container {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		border-radius: 0.5rem;
		padding: 1rem;
		min-height: 400px;
	}

	#mainCanvas {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.size-info {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.size-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.size-label {
		color: #6b7280;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.size-value {
		font-weight: 600;
		color: #374151;
		margin-top: 0.25rem;
	}

	.size-reduction {
		font-weight: 700;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
	}

	.size-reduction.positive {
		color: #16a34a;
		background: #dcfce7;
	}

	.size-reduction.negative {
		color: #dc2626;
		background: #fee2e2;
	}

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.download-btn,
	.secondary-btn {
		flex: 1;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.download-btn {
		background: #10b981;
		color: white;
	}

	.download-btn:hover:not(:disabled) {
		background: #059669;
	}

	.download-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.secondary-btn {
		background: #6b7280;
		color: white;
	}

	.secondary-btn:hover {
		background: #4b5563;
	}

	.controls-scroll {
		max-height: calc(100vh - 5rem);
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.control-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.section-title {
		font-weight: 600;
		font-size: 1.125rem;
		margin-bottom: 1rem;
	}

	.control-item {
		margin-bottom: 1rem;
	}

	.control-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.dimension-input {
		width: 100%;
		padding: 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.dimension-input:focus {
		outline: none;
		border-color: #9333ea;
	}

	.preset-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.preset-btn {
		padding: 0.5rem 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.preset-btn:hover {
		background: #f3f4f6;
		border-color: #9333ea;
	}

	.format-buttons {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.format-btn {
		padding: 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.format-btn.active {
		background: #9333ea;
		color: white;
		border-color: #9333ea;
	}

	.slider {
		width: 100%;
		height: 0.5rem;
		border-radius: 0.25rem;
		background: #e5e7eb;
		outline: none;
		-webkit-appearance: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #9333ea;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: #9333ea;
		cursor: pointer;
		border: none;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.button-group {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.transform-btn {
		padding: 0.5rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: #e5e7eb;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s;
	}

	.transform-btn.active {
		background: #9333ea;
		color: white;
	}

	.reset-btn {
		width: 100%;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		background: #e5e7eb;
		color: #374151;
		cursor: pointer;
		transition: background 0.2s;
	}

	.hidden {
		display: none;
	}
</style>
