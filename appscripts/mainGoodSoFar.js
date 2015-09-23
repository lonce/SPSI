
require(
	["../myLibs/utils", "../myLibs/SpectrogramInverter", "../myLibs/audioDisplayFactorySVG", "../myLibs/fft"],

	function (utils, SpectrogramInverter, audioDisplayFactory) {

		var c=document.getElementById("canvasID");
		var inputDisplay=audioDisplayFactory("insigCanvasID");

		
		console.log("Canvas width = " + c.width + ", and height = " + c.height);

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

			//var fftReal = new FFTReal(logN);

			var numSlices = Math.floor(sig.length/stepSize)
			var slicePlotWidth=c.width/numSlices;
			var binPlotHeight= Math.floor(c.height/(windowLength/2+1));
	
			
			var frame = new Array(windowLength);
			var specRe = new Array(windowLength/2+1);
			var specIm = new Array(windowLength/2+1);
			var wFrame;
			
			var maxSectrogramVal=0;// = Math.max(...specMag); // The spread operater in ECMAScript6
			var specMag;
			var spectrogram = []; // m[time, specMag]


			var hannWindow=utils.hannArray(windowLength);
			
			console.log("signal length is " + sig.length);
			console.log("num slices will be " + numSlices)

			// Step through the signal storing magnitude spectra as columns of a spectrogram
			while((frameStartIndex+windowLength) <= sig.length) {
				frame=sig.slice(frameStartIndex, frameStartIndex + windowLength);
				wframe = utils.dotStar(hannWindow, frame); 
				specRe.fill(0);  // ECMAScript6!
				specIm.fill(0)
				fft.forwardReal(wframe, specRe, specIm);
				
				// ------ log to console -------
				//utils.arrays2Console(specRe, specIm, 0, windowLength/2+1, "specRe  :   SpecIm");
				
				var reconFrame = new Array(windowLength);
				fft.inverseReal(specRe, specIm, reconFrame);

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
			utils.plot(spectrogram, slicePlotWidth, binPlotHeight, maxSectrogramVal, c);

			// --- Recreate signal from spectrogram

			for (var fnum=0;fnum<m.length;fnum++){
				
			}

		
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