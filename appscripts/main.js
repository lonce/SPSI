
require(
	["../myLibs/utils", "../myLibs/SpectrogramInverter", "../myLibs/audioDisplayFactorySVG", "../myLibs/fft"],

	function (utils, SpectrogramInverter, audioDisplayFactory) {

		var c=document.getElementById("canvasID");

		// Initialize svg canvases for audio wavefor displays
		var inputDisplay=audioDisplayFactory("insigCanvasID");
		var outputDisplay=audioDisplayFactory("outsigCanvasID");
		var spsiDisplay=audioDisplayFactory("spsiCanvasID");

		
		console.log("Spectrogram canvas width = " + c.width + ", and height = " + c.height);

		// Called on button push
		function onTestFFT()
		{
			var i;
			var logN = 8;
			var windowLength = 1 << logN;

			var sr = 44100;
			var frameStartIndex=0;
			var frameNum=0;

			var stepSize=windowLength/2;
			
			var fft = new FFT();
			fft.init(logN);
			
			//            makeTone(f, sr, len)
			var sig=utils.makeTone(sr/32, sr, windowLength)  
					.concat(utils.makeTone(sr/8, sr, windowLength))
					.concat(utils.makeTone(sr/16, sr, windowLength))
					.concat(utils.makeTone(sr/4, sr, windowLength)); 

			inputDisplay.show(sig);

			var reconSig = new Array(sig.length).fill(0);

			var numSlices = Math.floor(sig.length/stepSize);
			var slicePlotWidth=c.width/numSlices; // pixels per slice
			console.log("canvas width is " + c.width + ", numSlices is " + numSlices + ", and the slicePlotWidth is " + slicePlotWidth);
			var binPlotHeight= Math.floor(c.height/(windowLength/2+1)); // pixels per bin
	
			
			var frame = new Array(windowLength);
			var reconFrame = new Array(windowLength);
			var wFrame; // a windowed frame 


			var specRe = new Array(windowLength/2+1);
			var specIm = new Array(windowLength/2+1);
			
			var maxSectrogramVal=0;// = Math.max(...specMag); // The spread operater in ECMAScript6
			var specMag;
			var spectrogram = []; // m[time, specMag]

			var hannWindow=utils.hannArray(windowLength);
			
			console.log("signal length is " + sig.length);
			console.log("num slices will be " + numSlices);

			// Step through the signal storing magnitude spectra as columns of a spectrogram
			while((frameStartIndex+windowLength) <= sig.length) {
				frame=sig.slice(frameStartIndex, frameStartIndex + windowLength);
				wframe = utils.dotStar(hannWindow, frame); 
				specRe.fill(0);  // ECMAScript6!
				specIm.fill(0)
				fft.forwardReal(wframe, specRe, specIm);
				
				// ------ log to console -------
				//utils.arrays2Console(specRe, specIm, 0, windowLength/2+1, "specRe  :   SpecIm");
				
				fft.inverseReal(specRe, specIm, reconFrame);
				// window; overlapp add
				wframe = utils.dotStar(hannWindow, reconFrame);
				FPP.add_I(reconSig, frameStartIndex, reconFrame, 0, windowLength)

				// ------ log to console -------
				//utils.arrays2Console(wframe, reconFrame, 0, windowLength, "wFrame  :   reconFrame");
				
				// Compute magnitude spectrum
				specMag = utils.mag(specRe, specIm);
				maxSectrogramVal = Math.max(maxSectrogramVal, Math.max(...specMag)); // The spread operater in ECMAScript6
				spectrogram[frameNum]=specMag;

				frameNum++;
				frameStartIndex+= stepSize;
			}

			// Plot the spectrogram
			utils.plot(spectrogram, slicePlotWidth, binPlotHeight, maxSectrogramVal, c, slicePlotWidth/2);

			outputDisplay.show(sig);

			// Now do the SPSI reconstruction!
		
			var debugText = document.getElementById('debugText');
			debugText.innerHTML = "Done";
		}


		
		function onClear()
		{
			var debugText = document.getElementById('debugText');
			debugText.innerHTML = " .... ";
		}

		// set up button listeners
		document.getElementById("testFFTButt").addEventListener('click', onTestFFT);
		document.getElementById("clearButt").addEventListener('click', onClear);
	}
);