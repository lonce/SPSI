
require(
	["../myLibs/utils", "../myLibs/dnd", "snd", "../myLibs/drawingCanvas", "../myLibs/svgDrawingCanvas",  "../myLibs/SpectrogramInverter", "../myLibs/audioDisplayFactorySVG", "../myLibs/fft"],

	function (utils, dnd, sound, drawingCanvas, svgDrawingCanvas, SpectrogramInverter, audioDisplayFactory) {


		// Opens a canvas to show the full-resolution spectrogram of the drawing
		var displayHighResFlag = false;
		var loadTestSigFlag = false;

		var spectCanvas=document.getElementById("spectCanvasID");
		utils.clear(spectCanvas);

		// Initialize svg canvases for 3 audio wavefor displays
		var inputDisplay=audioDisplayFactory("insigCanvasID");
		var spsiDisplay=audioDisplayFactory("spsiCanvasID");


		var sr = 44100;
		var i;
		var logN = 11;
		var windowLength = 1 << logN;

		var inSnd, spsiSnd; // sound graphs for playing

		// "GLOBAL" - used in Sonogram and SPSI Reconstruction
		var soundSpectrogram = []; 
		var matrix = [];

		//--------------
		var sig=[];

		if (loadTestSigFlag){
			// test signal:      makeTone(f, sr, len)
			sig=utils.makeTone(sr/32, sr, 2*windowLength)  
					.concat(utils.makeTone(sr/8, sr, 2*windowLength))
					.concat(utils.makeTone(sr/16, sr, 2*windowLength))
					.concat(utils.makeTone(sr/4, sr, 2*windowLength)); 

			// Display audio input signal
			inputDisplay.show(sig);
			inSnd = sound();
			inSnd.farray2Buf(sig);
		}

		// Drag and drop action
		dnd(document.getElementById("inSigDivId"), function(audioBuf){
			sig=audioBuf.getChannelData(0);
			inSnd = sound(audioBuf);
			inputDisplay.show(sig);

			spsiDisplay.clear();
			utils.clear(spectCanvas);

			
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
				snd.play(function(){
					e.target.value="PLAY"; // swith button back when sound ends
				});
				e.target.value="STOP";
			} else{
				snd.stop();
				e.target.value="PLAY";
			}
		}
		inSndButt.addEventListener("mousedown", toggleSnd);
		spsiSndButt.addEventListener("mousedown", toggleSnd);

		
		console.log("soundSpectrogram canvas width = " + spectCanvas.width + ", and height = " + spectCanvas.height);



		//-------------------------------------------------------
		var dc1=drawingCanvas("drawCanvas1ID", 460,windowLength/2+1);
/*		var dc2=drawingCanvas("drawCanvas2ID");

		var convertButt = document.getElementById("scaleConvertID");

		for (var i=0;i<460;i++){
			matrix[i]=new Array(windowLength/2+1).fill(0);
		};
		convertButt.addEventListener("click", function(){
			utils.pixels2Matrix(dc1.hCanvas, matrix);

			if (displayHighResFlag){
				dc2.dCanvas.hidden=false;

				// Show the hidden canvas in its full glory
				//dc2.dCanvas.getContext("2d").drawImage(dc1.hCanvas , 0, 0, dc2.dCanvas.width, dc2.dCanvas.height);

				// show the matrix in its full glory
				utils.plot2D(matrix, utils.max2D(matrix), dc2.dCanvas);
			}

			onReconstruct(matrix);

		});

*/
		//=----------------------------------------------------
		var svgDC=svgDrawingCanvas("svgCanvasDiv", 800, 256, 460,1025);
		var dc2=drawingCanvas("drawCanvas2ID");

		var convertButt = document.getElementById("draw2SPSIButt");

		for (var i=0;i<460;i++){
			matrix[i]=new Array(windowLength/2+1).fill(0);
		};


		convertButt.addEventListener("click", function(){
			utils.svg2Matrix(svgDC.spectSVG, matrix, function(){

				if (displayHighResFlag){
					dc2.dCanvas.hidden=false;
					// Show the hidden canvas in its full glory
					//dc2.dCanvas.getContext("2d").drawImage(svgDC.hCanvas , 0, 0, dc2.dCanvas.width, dc2.dCanvas.height);

					// show the matrix in its full glory
					utils.plot2D(matrix, utils.max2D(matrix), dc2.dCanvas);
				}
				onReconstruct(matrix);			
			});
		});

		var vZoomSlider = document.getElementById("vZoomSlider");
		vZoomSlider.addEventListener("input", function(){
			document.getElementById("vZoomText").value=vZoomSlider.value;
			svgDC.zoom(hZoomSlider.value, vZoomSlider.value);
			dc1.zoom(hZoomSlider.value, vZoomSlider.value);
		});

		var hZoomSlider = document.getElementById("hZoomSlider");
		hZoomSlider.addEventListener("input", function(){
			document.getElementById("hZoomText").value=hZoomSlider.value;
			svgDC.zoom(hZoomSlider.value, vZoomSlider.value);
			dc1.zoom(hZoomSlider.value, vZoomSlider.value);
		});

		var copySpectButt = document.getElementById("copySpectButt");
			copySpectButt.addEventListener('click', function(){

			dc1.setImage(spectCanvas.toDataURL());
			svgDC.zoom(hZoomSlider.value, vZoomSlider.value);
			dc1.zoom(hZoomSlider.value, vZoomSlider.value);



		});
		//----------------------------------------------------
		function computeSonogram()
		{


			var frameStartIndex=0;
			var frameNum=0;

			var stepsPerFrame = 4;
			var stepSize=windowLength/stepsPerFrame;
			

			var numSlices = Math.floor(sig.length/stepSize);
			var slicePlotWidth=spectCanvas.width/numSlices; // pixels per slice
			var spectDisplayShift=(slicePlotWidth*stepsPerFrame-slicePlotWidth)/2; // just used to nicely align display of soundSpectrogram over waveform
			console.log("canvas width is " + spectCanvas.width + ", numSlices is " + numSlices + ", and the slicePlotWidth is " + slicePlotWidth);
			var binPlotHeight= Math.max(1, Math.floor(spectCanvas.height/(windowLength/2+1))); // pixels per bin
	
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


			var fft = new FFT();
			fft.init(logN);

			// Step through the signal storing magnitude spectra as columns of a soundSpectrogram
			while((frameStartIndex+windowLength) <= sig.length) {
				frame=sig.slice(frameStartIndex, frameStartIndex + windowLength);
				wframe = utils.dotStar(hannWindow, frame); 
				specRe.fill(0);  // ECMAScript6!
				specIm.fill(0)
				fft.forwardReal(wframe, specRe, specIm);
				
				// Compute magnitude spectrum
				specMag = utils.mag(specRe, specIm);
				maxSpectrogramVal = Math.max(maxSpectrogramVal, Math.max(...specMag)); // The spread operater in ECMAScript6

				soundSpectrogram[frameNum]=specMag;

				frameNum++;
				frameStartIndex+= stepSize;
			}

			// Plot the soundSpectrogram
			//utils.plot(soundSpectrogram, slicePlotWidth, binPlotHeight, maxSpectrogramVal, spectCanvas, spectDisplayShift);//3*slicePlotWidth/2);


			console.log("working .......");
			utils.plot2D(soundSpectrogram, maxSpectrogramVal, spectCanvas);//3*slicePlotWidth/2);			
			
		}

		// Called on button push
		function onReconstruct(sgram)
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
						
			var fft = new FFT();
			fft.init(logN);

			//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
			// Now do the SPSI reconstruction! 
			var spsiReconSig = new Array(Math.ceil(((sgram.length+3)*windowLength)/4)).fill(0);
			var phaseAcc= new Array(windowLength/2+1).fill(0);
			var m_tempRe = new Array(windowLength/2+1).fill(0);
			var m_tempIm = new Array(windowLength/2+1).fill(0);

			var foo1 = sgram.length;

			frameNum=0;
			frameStartIndex=0;
			while(frameNum < sgram.length) {
				// phaseAcc is used both as input (current phases) and as output (returned phases) at each step
				SpectrogramInverter.phaseEstimate(sgram[frameNum], phaseAcc);
				//convert (mag, phase) to (re, im)
				FPP.polarToCart( sgram[frameNum], phaseAcc, m_tempRe, m_tempIm, windowLength/2 );
				// invert
				fft.inverseReal(m_tempRe, m_tempIm, reconFrame);
				// window
				wframe = utils.dotStar(hannWindow, reconFrame);
				// overlap and add
				if (frameNum === (sgram.length-1)){
					var foo = 3;
				}
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
		utils.clear(spectCanvas);
		//computeSonogram();
		document.getElementById("clearDrawingButtID").addEventListener('click', function(){
				if (svgDC) {svgDC.clear()};
				if (dc1) {dc1.clear()};
				if (dc2) {dc2.clear()};
		});
		document.getElementById("Spect2SPSIButt").addEventListener('click', 
			function(){
				onReconstruct(soundSpectrogram);
		});

		document.getElementById("hideSpectBackground").addEventListener('input', function(){
			svgDC.setDrawOpacity(this.value);
		});

	}
);