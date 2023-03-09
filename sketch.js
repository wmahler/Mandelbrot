let resolution = 150;
let zoomSpeed = 0.15;
let maxZoomLevel = 1;
let palette;
let xmin = -2.5;
let ymin = -2.5;
let xmax = 2.5;
let ymax = 2.5;
let targetXmin, targetYmin, targetXmax, targetYmax;
let zoomLevel = 0;
let counterPlayer = 0;
let allSets = new Array();
let runGenerator = false;
let runPlayer = false;
let brotShown = false;
let mrEnabled = false;
let infoDiv;
let zoomSpeedSlider, maxIterationSlider, resolutionSlider;

function setup() {
	// setting up p5
	createCanvas(800, 600);
	pixelDensity(1);
	colorMode(HSB, 360, 100, 100, 255);
	palette = [color(12, 219, 191), color(208, 255, 12), color(255, 66, 66), color(255, 147, 41), color(232, 0, 255), color(179, 0, 255), color(12, 255, 235), color(255, 0, 221), color(255, 255, 255), color(38, 38, 38)];
	let context = canvas.getContext('2d');
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = 'high';
	context.canvas.willReadFrequently = true;
	// creating user interface
	button1 = createButton('generate mandelbrot');
	button1.position(width / 2, height / 2);
	button1.mousePressed(() => {
		runGenerator = true;
		button1.hide();
		maxIterationSlider.show();
		zoomSpeedSlider.show();
		resolutionSlider.show();
		button2.show();
		button3.show();
	});
	button4 = createButton('play the animation!');
	button4.position(width + 50, 350);
	button4.mousePressed(() => {
		brotShown = true;
		counterPlayer = 0;
		runPlayer = true
		frameRate(40);
	});
	button4.hide();
	button3 = createButton('stop zoom');
	button3.hide();
	button3.position(width + 50, 300);
	button3.mousePressed(() => {
		runGenerator = false;
		button3.hide();
		button2.show();
		mrEnabled = false;
		button4.show();
	});
	button2 = createButton('start zoom');
	button2.position(width + 50, 300);
	button2.hide();
	button2.mousePressed(() => {
		maxZoomLevel = maxIterationSlider.value();
		runGenerator = true;
		button2.hide();
		button3.show();
		mrEnabled = true;
		button5.hide();
		button4.hide();
	});
	button5 = createButton('take step!');
	button5.position(width + 50, 400);
	button5.mousePressed(() => {
		maxZoomLevel = 1;
		zoomLevel = 0;
		runGenerator = true;
	});
	button5.hide();
	zoomSpeedSlider = createSlider(0, 0.5, zoomSpeed, 0.01);
	zoomSpeedSlider.position(width + 175, 85);
	zoomSpeedSlider.hide();
	maxIterationSlider = createSlider(1, 250, maxZoomLevel, 1);
	maxIterationSlider.position(width + 175, 50);
	maxIterationSlider.hide();
	resolutionSlider = createSlider(10, 3000, resolution, 10);
	resolutionSlider.position(width + 175, 66);
	resolutionSlider.hide();
	infoDiv = createDiv('Dimensions: ' + width + 'x' + height +
		'<br>Iteration: ' + zoomLevel + '/' + maxZoomLevel +
		'<br>Resolution: ' + resolution +
		'<br>ZoomSpeed: ' + zoomSpeed);
	infoDiv.position(width + 20, 30);
}

function draw() {
	// Multiscale Rendering resolution increase while running 
	if (mrEnabled) {
		if (runGenerator && resolution < 3000) {
			resolution = Math.floor(resolution * 1.015);
			resolutionSlider.value(resolution);
		}
	} else {
		resolution = resolutionSlider.value();
	}
	if (runGenerator) {
		// return if maxZoomLevel is reached
		if (zoomLevel >= maxZoomLevel) {
			runGenerator = false;
			return;
		}
		// get pixels array
		loadPixels();
		//search brightest pixel an zoom in by setting new target xmin/xmax/ymin/ymax
		let brightestX = 0;
		let brightestY = 0;
		let brightest = 0;
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
		let cx = map(brightestX, 0, width, xmin, xmax);
		let cy = map(brightestY, 0, height, ymin, ymax);
		newWidth = (xmax - xmin) / 2;
		newHeight = (ymax - ymin) / 2;
		targetXmin = cx - newWidth / 2;
		targetYmin = cy - newHeight / 2;
		targetXmax = cx + newWidth / 2;
		targetYmax = cy + newHeight / 2;
		// create Arrays for next Mandelbrot
		let ca = new Array(width);
		let cb = new Array(height);
		let data = new Array(width * height);
		// map x and y to the new min and max
		for (let x = 0; x < width; x++) {
			ca[x] = map(x, 0, width, xmin, xmax);
		}
		for (let y = 0; y < height; y++) {
			cb[y] = map(y, 0, height, ymin, ymax);
		}
		// loop through all pixels and write new pixel value in array "data"
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
		// get brightness values of all pixels
		let brightnessValues = [];
		for (let i = 0; i < pixels.length; i += 4) {
			let [r, g, b] = pixels.slice(i, i + 3);
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
		// update the pixels array 
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
		// increase zoomLevel Counter
		zoomLevel++;
		// push this set to the allSets array
		allSets.push(pixels);
		// write updated pixels array to screen
		updatePixels();
		// animate with linear interpolation
		xmin = lerp(xmin, targetXmin, zoomSpeed);
		ymin = lerp(ymin, targetYmin, zoomSpeed);
		xmax = lerp(xmax, targetXmax, zoomSpeed);
		ymax = lerp(ymax, targetYmax, zoomSpeed);
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
	// set slider values
	maxZoomLevel = maxIterationSlider.value();
	zoomSpeed = zoomSpeedSlider.value();
	// display info
	infoDiv.html('Dimensions: ' + width + 'x' + height +
		'<br>Iteration: ' + zoomLevel + '/' + maxZoomLevel +
		'<br>Resolution: ' + resolution +
		'<br>ZoomSpeed: ' + zoomSpeed);
	// Switch to playmode
	if (zoomLevel == maxZoomLevel) {
		if (zoomLevel != 1) {
			// switch start/stop buttons
			button3.hide();
			button2.show();
			// show play animation button
			if (!brotShown) {
				button4.show();
			}
		} else {
			// show next iteration button
			button5.show();
		}
	}
}