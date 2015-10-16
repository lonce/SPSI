
require(
	["../myLibs/utils", "../myLibs/dnd", "snd",  "../myLibs/SpectrogramInverter", "../myLibs/audioDisplayFactorySVG", "../myLibs/fft"],

	function (utils, dnd, sound, SpectrogramInverter, audioDisplayFactory) {

		var c=document.getElementById("canvasID");
		utils.clear(c);

		// Initialize svg canvases for 3 audio wavefor displays
		var inputDisplay=audioDisplayFactory("insigCanvasID");
		var spsiDisplay=audioDisplayFactory("spsiCanvasID");


		var sr = 44100;
		var i;
		var logN = 11;
		var windowLength = 1 << logN;

		var inSnd, spsiSnd; // sound graphs for playing

		// "GLOBAL" - used in Sonogram and SPSI Reconstruction
		var spectrogram = []; 
		var fft = new FFT();
		fft.init(logN);
		//--------------
		var sig=[];

		/*
		// test signal:      makeTone(f, sr, len)
		sig=utils.makeTone(sr/32, sr, 2*windowLength)  
				.concat(utils.makeTone(sr/8, sr, 2*windowLength))
				.concat(utils.makeTone(sr/16, sr, 2*windowLength))
				.concat(utils.makeTone(sr/4, sr, 2*windowLength)); 

		// Display audio input signal
		inputDisplay.show(sig);
		inSnd = sound();
		inSnd.farray2Buf(sig);
		*/

		// Drag and drop action
		dnd(document.getElementById("inSigDivId"), function(audioBuf){
			sig=audioBuf.getChannelData(0);
			inSnd = sound(audioBuf);
			inputDisplay.show(sig);

			spsiDisplay.clear();
			utils.clear(c);

			computeSonogram();

		});

		// Play buttons for each of the 3 signals we are displaying
		var inSndButt=document.getElementById("playInputButt");

		var spsiSndButt=document.getElementById("playReconButt");
		// sound toggler for all 'play' buttons
		var toggleSnd=function(e){
			var snd;
			if (e.target===inSndButt) {console.log("play inSnd"); snd = inSnd;};
			if (e.target===spsiSndButt) {console.log("play spsiSnd"); snd = spsiSnd;};

			if (! snd) {console.log("no snd here"); return;}
			if (e.target.value==="PLAY"){
				snd.play();
				e.target.value="STOP";
			} else{
				snd.stop();
				e.target.value="PLAY";
			}
		}
		inSndButt.addEventListener("mousedown", toggleSnd);
		spsiSndButt.addEventListener("mousedown", toggleSnd);

		
		console.log("Spectrogram canvas width = " + c.width + ", and height = " + c.height);

		function computeSonogram()
		{
			var frameStartIndex=0;
			var frameNum=0;

			var stepsPerFrame = 4;
			var stepSize=windowLength/stepsPerFrame;
			

			var numSlices = Math.floor(sig.length/stepSize);
			var slicePlotWidth=c.width/numSlices; // pixels per slice
			var spectDisplayShift=(slicePlotWidth*stepsPerFrame-slicePlotWidth)/2; // just used to nicely align display of spectrogram over waveform
			console.log("canvas width is " + c.width + ", numSlices is " + numSlices + ", and the slicePlotWidth is " + slicePlotWidth);
			var binPlotHeight= Math.max(1, Math.floor(c.height/(windowLength/2+1))); // pixels per bin
	
			console.log("windowlength is " + windowLength + ", binPlotHeight " + binPlotHeight);
			console.log("numSlices is " + numSlices + ", slicePlotWidth " + slicePlotWidth);

			// frame-length arrays to hold the waveform at various stems
			var frame = new Array(windowLength);
			var reconFrame = new Array(windowLength);
			var wFrame; // a windowed frame 

			// Real and Imaginary part of the spectrum
			var specRe = new Array(windowLength/2+1);
			var specIm = new Array(windowLength/2+1);
			
			var maxSpectrogramVal=0;// = Math.max(...specMag); // The spread operater in ECMAScript6
			var specMag;

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
				
				// Compute magnitude spectrum
				specMag = utils.mag(specRe, specIm);
				maxSpectrogramVal = Math.max(maxSpectrogramVal, Math.max(...specMag)); // The spread operater in ECMAScript6

				spectrogram[frameNum]=specMag;

				frameNum++;
				frameStartIndex+= stepSize;
			}

			// Plot the spectrogram
			//utils.plot(spectrogram, slicePlotWidth, binPlotHeight, maxSpectrogramVal, c, spectDisplayShift);//3*slicePlotWidth/2);
			utils.plot2D(spectrogram, maxSpectrogramVal, c);//3*slicePlotWidth/2);			
		}

		// Called on button push
		function onReconstruct()
		{

			var frameStartIndex=0;
			var frameNum=0;

			var stepsPerFrame = 4;
			var stepSize=windowLength/stepsPerFrame;
			

			// frame-length arrays to hold the waveform at various stems
			var frame = new Array(windowLength);
			var reconFrame = new Array(windowLength);
			var wFrame; // a windowed frame 

			// Real and Imaginary part of the spectrum
			var specRe = new Array(windowLength/2+1);
			var specIm = new Array(windowLength/2+1);
			
			var maxSpectrogramVal=0;// = Math.max(...specMag); // The spread operater in ECMAScript6
			var specMag;

			var hannWindow=utils.hannArray(windowLength);
						
			//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			// Now do the SPSI reconstruction! 
			var spsiReconSig = new Array(sig.length).fill(0);
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
				FPP.add_I(wframe, 0, spsiReconSig, frameStartIndex, windowLength)

				frameNum++;
				frameStartIndex+=stepSize;

			}

			spsiSnd=sound();
			spsiSnd.farray2Buf(spsiReconSig)
			// see what it looks like!
			spsiDisplay.show(spsiReconSig);
		
		}

		// set up button listeners
		spsiDisplay.clear();
		utils.clear(c);
		computeSonogram();
		document.getElementById("SPSIButt").addEventListener('click', onReconstruct);
	}
);