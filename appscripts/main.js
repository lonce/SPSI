
require(
	["../myLibs/utils", "../myLibs/SpectrogramInverter", "../myLibs/audioDisplayFactorySVG", "../myLibs/fft"],

	function (utils, SpectrogramInverter, audioDisplayFactory) {

		var c=document.getElementById("canvasID");

		// Initialize svg canvases for 3 audio wavefor displays
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

			var stepsPerFrame = 4;
			var stepSize=windowLength/stepsPerFrame;
			
			var fft = new FFT();
			fft.init(logN);
			
			//            makeTone(f, sr, len)
			var sig=utils.makeTone(sr/32, sr, windowLength)  
					.concat(utils.makeTone(sr/8, sr, windowLength))
					.concat(utils.makeTone(sr/16, sr, windowLength))
					.concat(utils.makeTone(sr/4, sr, windowLength)); 

			// Display audio input signal
			inputDisplay.show(sig);

			// This will hold the signal constructed from just doing the iFFT
			var reconSig = new Array(sig.length).fill(0);

			var numSlices = Math.floor(sig.length/stepSize);
			var slicePlotWidth=c.width/numSlices; // pixels per slice
			var spectDisplayShift=(slicePlotWidth*stepsPerFrame-slicePlotWidth)/2; // just used to nicely align display of spectrogram over waveform
			console.log("canvas width is " + c.width + ", numSlices is " + numSlices + ", and the slicePlotWidth is " + slicePlotWidth);
			var binPlotHeight= Math.floor(c.height/(windowLength/2+1)); // pixels per bin
	
			// frame-length arrays to hold the waveform at various stems
			var frame = new Array(windowLength);
			var reconFrame = new Array(windowLength);
			var wFrame; // a windowed frame 

			// Real and Imaginary part of the spectrum
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
				FPP.add_I(wframe, 0, reconSig, frameStartIndex, windowLength)

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
			utils.plot(spectrogram, slicePlotWidth, binPlotHeight, maxSectrogramVal, c, spectDisplayShift);//3*slicePlotWidth/2);
			// and the reconstructed audio signal
			outputDisplay.show(reconSig);

			//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			// Now do the SPSI reconstruction! 
			var spsireconSig = new Array(sig.length).fill(0);
			var phaseAcc= new Array(windowLength/2+1).fill(0);
			var m_tempRe = new Array(windowLength/2+1).fill(0);
			var m_tempIm = new Array(windowLength/2+1).fill(0);

			frameNum=0;
			frameStartIndex=0;
			while(frameNum < spectrogram.length) {
				// phaseAcc is used both as input (current phases) and as output (returned phases) at each step
				SpectrogramInverter.phaseEstimate(spectrogram[frameNum], phaseAcc);
				//convert (mag, phase) to (re, im)
				FPP.polarToCart( spectrogram[frameNum], phaseAcc, m_tempRe, m_tempIm, windowLength/2 );
				// invert
				fft.inverseReal(m_tempRe, m_tempIm, reconFrame);
				// window
				wframe = utils.dotStar(hannWindow, reconFrame);
				// overlap and add
				FPP.add_I(wframe, 0, spsireconSig, frameStartIndex, windowLength)

				frameNum++;
				frameStartIndex+=stepSize;

			}
			// see what it looks like!
			spsiDisplay.show(spsireconSig);
		
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