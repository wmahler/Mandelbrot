let w = 800; 				// width of the fractal
let h = 600; 				// height of the fractal
let resolution = 50; 		// can be upped to get higher res results, but color is also tied to this value, gets upped by mrIncrease every mrIterationCounter Iteration
let mrIncrease = 33; 		// Multiscale Renderering, resolution gets increased by this value
let maxZoomLevel = 100; 	// how deep you wanna go
let zoomSpeed = 0.20; 		// how fast you wanna go

let xmin = -2.5;
let ymin = -2.5;
let xmax = 2.5;
let ymax = 2.5;
let zoom = 2;
let zoomLevel = 0;
let mrIterationCounter = 1;
let targetXmin, targetYmin, targetXmax, targetYmax;
let ca = new Array(w);
let cb = new Array(h);
let data = new Array(w * h);
let allSets = new Array();
let palette;
let colorShifter = 0;
let colorShifterGoesUp = true;
let runGenerator = false;
let counterPlayer = 0;
let runPlayer = false;
let brotShown = false;
let showRefreshButton = true;
let font;
let infoDiv;
let maxZoomLevelSlider, zoomSpeedSlider;
let savedBrightestX = 0;
let savedBrightestY = 0;


function preload() {
	font = loadFont('assets/RobotoMono-VariableFont_wght.ttf');
}

function setup() {
	createCanvas(w, h);
	pixelDensity(1);
	colorMode(HSB, 360, 100, 100, 255);
	textFont(font);
	textSize(32);
	fill(255);
	stroke(8);
	text('Iterations: ' + maxZoomLevel, 30, 50);
	text('Resolution: ' + resolution, 30, 100);
	text('Speed: ' + zoomSpeed, 30, 150);
	text('Dimensions: ' + w + 'x' + h, 30, 200);
	const context = canvas.getContext('2d');
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	context.canvas.willReadFrequently = true;
	palette = [
		color(12, 219, 191),
		color(208, 255, 12),
		color(255, 66, 66),
		color(255, 147, 41),
		color(232, 0, 255),
		color(179, 0, 255),
		color(12, 255, 235),
		color(255, 0, 221),
		color(255, 255, 255),
		color(38, 38, 38)
	];
	button = createButton('generate mandelbrot');
	button.position(30, 250);
	button.mousePressed(function () {
		runGenerator = true;
		button.hide();
	});
	zoomSpeedSlider = createSlider(0, 1, zoomSpeed, 0.01);
	zoomSpeedSlider.position(w + 150, 65);
}

function draw() {
	if (runGenerator) {
		// set values
		zoomSpeed = zoomSpeedSlider.value();

		// check resolution
		if (resolution < 10) {
			resolution = 10;
		}

		// remove old info div
		if (infoDiv) { infoDiv.remove(); }

		// return if maxZoomLevel is reached
		if (zoomLevel >= maxZoomLevel) {
			runGenerator = false;
			return;
		}

		// show reload button
		if (showRefreshButton) {
			showRefreshButton = false;
			button = createButton('reload page...');
			button.position(300, height + 30);
			button.mousePressed(function () {
				window.location.reload();
			});
		}

		// colorShift, TODO
		// if (colorShifter >= 65) { colorShifterGoesUp = false; }
		// if (colorShifter <= 0) { colorShifterGoesUp = true; }
		// if (colorShifterGoesUp) { colorShifter++; } else { colorShifter--; }
		// for (let t = 0; t < palette.length; t++) {
		// 	let tempColor = palette[t].levels;
		// 	let r = tempColor[0];
		// 	let g = tempColor[1];
		// 	let b = tempColor[2];
		// 	if (t % 3 == 0) { palette[t] = color(r + colorShifter,g,b); } else if (t % 3 == 1) { palette[t] = color(r,g + colorShifter,b); } else if (t % 3 == 2){ palette[t] = color(r, g, b + colorShifter); }
		// }
		// console.log(palette);

		// get pixels array
		loadPixels();

		// get brightness values of all pixels
		let brightnessValues = [];
		for (let i = 0; i < pixels.length; i += 4) {
			let r = pixels[i];
			let g = pixels[i + 1];
			let b = pixels[i + 2];
			let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			brightnessValues.push(brightness);
		}

		// calculate minimum and maximum brightness values
		let minBrightnessCC = brightnessValues[0];
		let maxBrightnessCC = brightnessValues[0];
		for (let i = 1; i < brightnessValues.length; i++) {
			if (brightnessValues[i] < minBrightnessCC) {
				minBrightnessCC = brightnessValues[i];
			}
			if (brightnessValues[i] > maxBrightnessCC) {
				maxBrightnessCC = brightnessValues[i];
			}
		}

		// apply contrast stretching to pixels
		for (let i = 0; i < pixels.length; i += 4) {
			let r = pixels[i];
			let g = pixels[i + 1];
			let b = pixels[i + 2];
			let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			brightness = map(brightness, minBrightnessCC, maxBrightnessCC, 0, 255);
			pixels[i] = brightness;
			pixels[i + 1] = brightness;
			pixels[i + 2] = brightness;
		}

		//search brightest pixel an zoom in by setting new target xmin/xmax/ymin/ymax
		let brightestX = 0;
		let brightestY = 0;
		let brightest = 0;
		if (zoomLevel % 3 == 0 || zoomLevel < 5) {
			for (let i = 0; i < pixels.length; i += 4) {
				let x = (i / 4) % width;
				let y = Math.floor((i / 4) / width);
				let b = pixels[i + 2];
				if (b > brightest) {
					brightest = b;
					brightestX = x;
					brightestY = y;
				}
			}
			savedBrightestX = brightestX;
			savedBrightestY = brightestY;
		} else {
			brightestX = savedBrightestX;
			brightestY = savedBrightestY;
		}
		let cx = map(brightestX, 0, width, xmin, xmax);
		let cy = map(brightestY, 0, height, ymin, ymax);
		newWidth = (xmax - xmin) / zoom;
		newHeight = (ymax - ymin) / zoom;
		targetXmin = cx - newWidth / 2;
		targetYmin = cy - newHeight / 2;
		targetXmax = cx + newWidth / 2;
		targetYmax = cy + newHeight / 2;

		// Calculations
		for (let x = 0; x < width; x++) {
			ca[x] = map(x, 0, width, xmin, xmax);
		}
		for (let y = 0; y < height; y++) {
			cb[y] = map(y, 0, height, ymin, ymax);
		}
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				let a = ca[x];
				let b = cb[y];
				let n = 0;
				while (n < resolution && zoomLevel < maxZoomLevel) {
					let aa = a * a - b * b;
					let bb = 2 * a * b;
					a = aa + ca[x];
					b = bb + cb[y];
					if (abs(a + b) > 16) {
						break;
					}
					n++;
				}
				data[x + y * width] = n;
			}
		}

		// draw new pixels
		for (let i = 0; i < pixels.length; i += 4) {
			let x = (i / 4) % width;
			let y = Math.floor((i / 4) / width);
			let c = data[x + y * width];
			if (c === resolution) {
				pixels[i] = 0;
				pixels[i + 1] = 0;
				pixels[i + 2] = 0;
				pixels[i + 3] = 255;
			} else {
				let hue = map(c, 0, resolution, 0, 1);
				let colorIndex = Math.floor(hue * (palette.length - 2));
				let c1 = palette[colorIndex];
				let c2 = palette[colorIndex + 1];
				let n = map(hue, colorIndex / (palette.length - 1), (colorIndex + 1) / (palette.length - 1), 0, 1);
				let c3 = lerpColor(c1, c2, n);
				pixels[i] = red(c3);
				pixels[i + 1] = green(c3);
				pixels[i + 2] = blue(c3);
				pixels[i + 3] = 190;
			}
		}

		// animate with linear interpolation
		xmin = lerp(xmin, targetXmin, zoomSpeed);
		ymin = lerp(ymin, targetYmin, zoomSpeed);
		xmax = lerp(xmax, targetXmax, zoomSpeed);
		ymax = lerp(ymax, targetYmax, zoomSpeed);

		// increase zoomLevel Counter
		zoomLevel++;

		// push this set to the allSets array
		allSets.push(pixels);

		// write updated pixels array to screen
		updatePixels();

		// display info
		infoDiv = createDiv('Iteration: ' + zoomLevel + '/' + maxZoomLevel + '<br>' + 'Resolution: ' + resolution + '<br>' + 'ZoomSpeed: ' + zoomSpeed);
		infoDiv.position(w + 20, 30);

		// Multiscale Rendering resolution increase, modulo 1 = every iteration
		if (zoomLevel % 1 == 0) {
			resolution += mrIncrease;
		}

	} else if (runPlayer) {
		loadPixels();
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let i = (x + y * width) * 4;
				pixels[i + 0] = allSets[counterPlayer][i + 0];
				pixels[i + 1] = allSets[counterPlayer][i + 1];
				pixels[i + 2] = allSets[counterPlayer][i + 2];
				pixels[i + 3] = allSets[counterPlayer][i + 3];
			}
		}
		updatePixels();
		counterPlayer++;
		if (counterPlayer == Object.keys(allSets).length) {
			runPlayer = false;
			brotShown = false;
		}
	}

	// Switch to playmode
	if (zoomLevel == maxZoomLevel) {
		if (!brotShown) {
			button = createButton('play the mandelbrot animation!');
			button.position(30, height + 30);
			button.mousePressed(function () {
				brotShown = true;
				counterPlayer = 0;
				runPlayer = true
				frameRate(24);
			});
		}
	}
}