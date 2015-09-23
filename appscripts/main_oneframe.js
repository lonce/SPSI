
require(
	["../myLibs/utils", "../myLibs/fft"],

	function () {

		var c=document.getElementById("canvasID");
		console.log("width = " + c.width + ", and height = " + c.height);

		var freq=function(i){
			return 16;
		}

		function onTestFFT()
		{
			var i;
			var logN = 5;
			var windowLength = 1 << logN;

			var sr = 44100;

			//var stepSize=windowLength/2;
			
			var fft = new FFT();
			fft.init(logN);
			
			//            makeTone(f, sr, len)
			var sig=utils.makeTone(sr/4, sr, windowLength);

			//var fftReal = new FFTReal(logN);
			
			var frame = new Array(windowLength);
			var specRe = new Array(windowLength/2+1);
			var specIm = new Array(windowLength/2+1);
			var specMag;

			var hannWindow=utils.hannArray(windowLength);
			
			// sig is just one frame long for now
			frame=sig;
			var wframe = utils.dotStar(hannWindow, frame); 
			specRe.fill(0);  // ECMAScript6!
			specIm.fill(0)

			fft.forwardReal(wframe, specRe, specIm);

			// ------ log to console -------
			utils.arrays2Console(specRe, specIm, 0, windowLength/2+1, "specRe  :   SpecIm");
			
			var reconFrame = new Array(windowLength);
			fft.inverseReal(specRe, specIm, reconFrame);

			// ------ log to console -------
			utils.arrays2Console(wframe, reconFrame, 0, windowLength, "wFrame  :   reconFrame");

			// Compute and plot magnitude spectrum
			specMag = utils.mag(specRe, specIm);
			var maxval = Math.max(...specMag); // The spread operater in ECMAScript6

			var m = []; // m[time, specMag]
			m[0]=specMag;
			console.log("the number of frequency bins is " + m[0].length);
			console.log("...so each bin is allocated a height of " + Math.floor(c.height/m[0].length) + " pixels.")
			utils.plot(m, Math.floor(c.width/m.length), Math.floor(c.height/m[0].length), maxval, c);

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