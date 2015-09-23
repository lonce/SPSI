// ================================================================================================
//	fft.js
//
//	Performs forward and inverse FFTs on real and complex sequences.
//
//  Released under the MIT License
//
//  The MIT License (MIT)
//
//  Copyright (c) 2015 Gerald T Beauregard
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
// ================================================================================================

/**
 * General purpose FFT class. Performs forward and inverse FFTs on complex and real sequences.
 *
 * @param {number} logN - Base-2 log of the maximum FFT size to be performed with this object. Optional.
 *
 * @constructor
 * @export
 */
var FFT = function(logN)
{
	this.logN = 0;			// Base-2 log of maximum FFT size for this instance
	this.X = null;			// Vector of linked-list elements
	this.bitRev = null;		// Table of bit-reversed numbers
	
	this.wMulTableRe = null;// Twiddle factor multipliers
	this.wMulTableIm = null;
	
	this.tempRe = null;		// Buffers for real->complex and complex->real FFTs
	this.tempIm = null;
	
	if (logN)
	{
		this.init(logN);
	}
};


/**
 * Initialize the Fourier transform object.
 *
 * @param {number} logN - Base-2 log of the maximum FFT size to be performed with this object.
 *
 * @export
 */
FFT.prototype.init = function(logN)
{
	this.logN = logN;
	var n = 1 << logN;
	
	// Allocate elements for linked list of complex numbers.
	this.X = new Array;
	for (var k = 0; k < n; k++ )
		this.X[k] = new FFTElement;

	// Set up "next" pointers.
	for (k = 0; k < n-1; k++ )
		this.X[k].next = this.X[k+1];
	
	// Generate table of bit-reversed numbers
	this.bitRev = new Array(n);
	for ( k = 0; k < n; k++ )
	{
		//this.bitRev[k] = this.X[k].revTgt = this.bitReverse(k,this.logN);
		this.bitRev[k] = this.bitReverse(k,this.logN);
	}
	
	// Compute multiplier factors for the "twiddle factors".  The twiddle factors are
	// complex unit vectors spaced at regular angular intervals on the unit circle in
	// the complex plane, clockwise for the forward FFT, anti-clockwise for inverse FFT.
	// The angle by which the twiddle factor advances depends on the FFT stage. In many FFT
	// implementations the twiddle factors are cached, but it's often just as fast to compute
	// them on the fly.  In this implementation, we pre-compute just the angular *increment* for
	// the forward case only, and compute the actual twiddle factors on-the-fly.
	//
	// These are indexed by log2 of the number of steps around unit circle.
	// 0 -> 1 (2pi) [Not used, just placeholder]
	// 1 -> 2 (pi)
	// 2 -> 4 (pi/2)
	// 3 -> 8 (pi/4)
	
	this.wMulTableRe = new Array(logN+1);
	this.wMulTableIm = new Array(logN+1);
	for (var i = 0; i <= logN; i++)
	{
		var wAngleInc = -2*Math.PI/(1<<i);
		this.wMulTableRe[i] = Math.cos(wAngleInc);
		this.wMulTableIm[i] = Math.sin(wAngleInc);
	}
	
	// Create some 'temp' buffers for use with real->complex and complex->real FFTs
	this.tempRe = new Array(n/2+1);
	this.tempIm = new Array(n/2+1);
};


/**
 * Performs a complex-to-complex forward FFT.
 *
 * @param {Array} sigRe - Real part of the input signal.
 * @param {Array} sigIm - Imaginary part of input signal.
 * @param {Array} specRe - Real part of output spectrum.
 * @param {Array} specIm - Imaginary part of output spectrum.
 * @param {number|null} logN - Base-2 log of input signal length. Optional.
 *
 * @export
 */
FFT.prototype.forwardComplex = function(sigRe, sigIm, specRe, specIm, logN)
{
	var numArgs = arguments.length;
	console.assert(numArgs == 4 || numArgs == 5);

	this.runOutOfPlace(sigRe, sigIm, specRe, specIm, false, logN || this.logN);
}


/**
 * Performs a complex-to-complex inverse FFT.
 *
 * @param {Array} sigRe - Real part of the input spectrum.
 * @param {Array} sigIm - Imaginary part of input spectrum.
 * @param {Array} specRe - Real part of output signal.
 * @param {Array} specIm - Imaginary part of output signal.
 * @param {number|null} logN - Base-2 log of input signal length. Optional.
 *
 * @export
 */
FFT.prototype.inverseComplex = function(specRe, specIm, sigRe, sigIm, logN)
{
	var numArgs = arguments.length;
	console.assert(numArgs == 4 || numArgs == 5);

	this.runOutOfPlace(srcRe, srcIm, dstRe, dstIm, true, logN || this.logN);
}


/**
 * Performs a real-to-complex forward FFT. Note that the resulting spectrum
 * will have n/2+1 points. For example, for logN =10, the input signal will
 * have 1024 points, and the resulting spectrum will have 513 points, where
 * {specRe[512], specIm[512]} corresponds to the Nyquist frequency.
 *
 * @param {Array} sig - Input signal.
 * @param {Array} specRe - Real part of output spectrum.
 * @param {Array} specIm - Imaginary part of output spectrum.
 * @param {number|null} logN - Base-2 log of input signal length. Optional.
 *
 * @export
 */
FFT.prototype.forwardReal = function(sig, specRe, specIm, logN)
{
	var numArgs = arguments.length;
	console.assert(numArgs == 3 || numArgs == 4);
	
	logN = (logN === undefined) ? this.logN : logN;
	console.assert(logN <= this.logN);

	var k;
	var n = 1 << logN;

	// Pack the real input into a complex buffer such that the even samples
	// of the input end up in the real part, and the odd samples in the imaginary part.
	for (k = 0; k < n/2; k++)
	{
		this.tempRe[k] = sig[2*k];
		this.tempIm[k] = sig[2*k+1];
	}

	// Do a forward complex FFT
	this.runOutOfPlace(this.tempRe, this.tempIm, this.tempRe, this.tempIm, false, logN-1);

	// Symmetry properties of the complex FFT allow us to extract the transforms
	// for the even (in real part of input) and odd (in imag part of input) sequences.
	//
	// We then apply the top branch of the final decimation-in-time style butterfly
	// to get the bottom half of the transform for the full sequence.
	// See Oppenheim & Schafer, "Discrete-Time Signal Processing", Figure 9.3. p589.
	// Where G is the transform of the even samples, and H is the transform of the odd samples.
	//
	// See also:
	// http://www.engineeringproductivitytools.com/stuff/T0001/PT10.HTM
	
	// Repeat first element of spectrum. This is so we can deal with the (n/2-k) indexing below
	// for the case when k = 0 without requiring a special case or modulo division. Mathematically
	// it's OK to do this, as the spectrum of an DFT technically is periodic.
	this.tempRe[n/2] = this.tempRe[0];
	this.tempIm[n/2] = this.tempIm[0];

	// Get the twiddle factor multiplier
	var wMulRe = this.wMulTableRe[logN];
	var wMulIm = this.wMulTableIm[logN];

	// Twiddle factor is initially a unit real vector. It'll be rotated
	// clockwise using the twiddle factor multiplier
	var wRe = 1.0;
	var wIm = 0.0;
	
	for (k = 0; k <= n/2; k++)
	{
		// Extract spectrum for even samples (real part of packed input)
		// Fe(k) = {Z(k) + Z(N/2-k)*} / 2
		var feRe = 0.5*(this.tempRe[k] + this.tempRe[n/2-k]);
		var feIm = 0.5*(this.tempIm[k] - this.tempIm[n/2-k]);
		
		// Extract spectrum for odd samples (imaginary part of packed input)
		// Fo(k) = -j{Z(k) - Z(N/2-k)*} / 2
		var foRe =  0.5*(this.tempIm[k] + this.tempIm[n/2-k]);
		var foIm = -0.5*(this.tempRe[k] - this.tempRe[n/2-k]);
		
		// F(k) = Fe(k) + e^(-j2pik/N) Fo(k)
		specRe[k] = feRe + (foRe * wRe - foIm * wIm);
		specIm[k] = feIm + (foRe * wIm + foIm * wRe);
		
		// Rotate twiddle factor (via complex multiply)
		var tRe = wRe;
		wRe = wRe * wMulRe  -  wIm * wMulIm;
		wIm = tRe * wMulIm  +  wIm * wMulRe;
	}
}


/**
 * Performs a complex-to-real inverse FFT. Note that the input spectrum is 
 * assumed to have n/2+1 points. For example, for logN =10, the input spectrum must
 * have 513 points, where {specRe[512], specIm[512]} corresponds to the Nyquist frequency;
 * the (real-only) output signal will have 2^logN = 1024 points.
 *
 * @param {Array} sig - Input signal.
 * @param {Array} specRe - Real part of output spectrum.
 * @param {Array} specIm - Imaginary part of output spectrum.
 * @param {number|null} logN - Base-2 log of input signal length. Optional.
 *
 * @export
 */
FFT.prototype.inverseReal = function(specRe, specIm, sig, logN)
{
	var numArgs = arguments.length;
	console.assert(numArgs == 3 || numArgs == 4);

	logN = (logN === undefined) ? this.logN : logN;

	// From http://www.engineeringproductivitytools.com/stuff/T0001/PT10.HTM
	// In order to reverse this process, and calculate the inverse transform of a single
	// sequence which is known to be real, we need a way of calculating Z(k) given F(k).
	// This is quite easy.  Observing that symmetry implies F(N/2+k) = F(N/2-k)*, the final
	// butterfly stage can be reverse as follows:
	// 	Fe(k) = 1/2(F(k) + F(N/2-k)*)
	// 	Fo(k) = 1/2(F(k) - F(N/2-k)*) e^(j2pi k/N)
	// 	Z(k) = Fe(k) + jFo(k)  k = 0..N/2-1
	// Evaluating the IFFT will yield the even samples as the real part and
	// the odd samples as the imaginary part.

	// Get size of FFT
	var n = 1 << logN;
	
	// Get twiddle factor multiplier for rotating twiddle factor unit vector.
	var wMulRe = this.wMulTableRe[logN];
	var wMulIm = this.wMulTableIm[logN];

	// It's an IFFT, so flip sign of imaginary part so we get counter-clockwise
	// rotation of the twiddle factor
	wMulIm *= -1;

	// Twiddle factor initially is unit real vector.
	var wRe = 1.0;
	var wIm = 0.0;
	
	// For each bin
	for (var k = 0; k < n/2; k++)
	{
		// Get transform of the even samples.
		// Fe(k) = 1/2 (F(k) + F(N/2-k)*)
		var feRe = 0.5*(specRe[k] + specRe[n/2-k]);
		var feIm = 0.5*(specIm[k] - specIm[n/2-k]);
		
		// Get transform of the odd samples
		// Fo(k) = 1/2 (F(k) - F(N/2-k)*) e^(j2pi k/N)
		var re = (specRe[k] - specRe[n/2-k]);
		var im = (specIm[k] + specIm[n/2-k]);
		var foRe = 0.5*(re * wRe - im * wIm);
		var foIm = 0.5*(re * wIm + im * wRe);
		
		// Combine the two
		// Z(k) = Fe(k) + j Fo(k)
		this.tempRe[k] = feRe - foIm;
		this.tempIm[k] = feIm + foRe;
		
		// Rotate twiddle factor (via complex multiply)
		var tRe = wRe;
		wRe = wRe * wMulRe - wIm * wMulIm;
		wIm = tRe * wMulIm + wIm * wMulRe;
	}
	
	// Do complex n/2 length FFT.
	this.runOutOfPlace(this.tempRe, this.tempIm, this.tempRe, this.tempIm, true, logN-1);
	
	// Even samples end up in real part of result, odd samples in imaginary part. Here
	// we unpack the result, grabbing even samples from real part, odd ones from imaginary part.
	for (k = 0; k < n/2; k++)
	{
		sig[2*k]   = this.tempRe[k];
		sig[2*k+1] = this.tempIm[k];
	}
}



/**
 * Performs a complex-to-complex out-of-place forward or inverse FFT. For internal use
 * only. Users of the FFT should instead call methods for the specific cases instead, 
 * i.e. forwardComplex, inverseComplex, forwardReal, and inverse Real.
 *
 * @param {Array} srcRe - Real part of input.
 * @param {Array} srcIm - Imaginary part of input.
 * @param {Array} dstRe - Real part of output.
 * @param {Array} dstIm - Imaginary part of output.
 * @param {boolean} inverse True for IFFT
 * @param {number} logN - Base-2 log of output signal length.
 */
FFT.prototype.runOutOfPlace = function(srcRe, srcIm, dstRe, dstIm, inverse, logN)
{
	console.assert(arguments.length == 6, "Incorrect number of args for runOutOfPlace");

	console.assert(logN > 0 && logN <= this.logN);
	var n = 1 << logN;

	console.assert(srcRe && srcRe.length >= n);
	console.assert(srcIm && srcIm.length >= n);
	console.assert(dstRe && dstRe.length >= n);
	console.assert(dstIm && dstIm.length >= n);
	
	var numFlies = n >> 1;		// Number of butterflies per sub-FFT
	var span = n >> 1;			// Width of the butterfly
	var spacing = n;			// Distance between start of sub-FFTs
	
	// Copy data into linked complex number objects.
	// If it's an IFFT, we divide by N while we're at it
	var x = this.X[0];
	var i = 0;
	var invN = 1.0/n;
	var scale = inverse ? invN : 1.0;
	for (i = 0; i < n; i++)
	{
		x.re = scale*srcRe[i];
		x.im = scale*srcIm[i];
		x = x.next;
	}
	
	// For each stage of the FFT
	for (var stage = 0; stage < logN; ++stage )
	{
		// Get twiddle factor multiplier for this stage. We use the multiplier
		// to rotate a unit vector twiddle factor on the complex plane.
		var wMulRe = this.wMulTableRe[logN-stage];
		var wMulIm = this.wMulTableIm[logN-stage];
		
		// If it's inverse, we use complefx conjugate so twiddle factors rotate
		// around unit circle counter-clockwise, instead of clockwise.
		if (inverse) wMulIm *= -1;
		
		for (var start = 0; start < n; start += spacing)
		{
			var xTop = this.X[start];
			var xBot = this.X[start+span];
			
			var wRe = 1.0;
			var wIm = 0.0;
			
			// For each butterfly in this stage
			for (var flyCount = 0; flyCount < numFlies; ++flyCount)
			{
				// Get the top & bottom values
				var xTopRe = xTop.re;
				var xTopIm = xTop.im;
				var xBotRe = xBot.re;
				var xBotIm = xBot.im;
				
				// Top branch of butterfly has addition
				xTop.re = xTopRe + xBotRe;
				xTop.im = xTopIm + xBotIm;
				
				// Bottom branch of butterly has subtraction,
				// followed by multiplication by twiddle factor
				xBotRe = xTopRe - xBotRe;
				xBotIm = xTopIm - xBotIm;
				xBot.re = xBotRe*wRe - xBotIm*wIm;
				xBot.im = xBotRe*wIm + xBotIm*wRe;
				
				// Advance butterfly to next top & bottom positions
				xTop = xTop.next;
				xBot = xBot.next;
				
				// Update the twiddle factor, via complex multiply
				// by unit vector with the appropriate angle
				// (wRe + j wIm) = (wRe + j wIm) x (wMulRe + j wMulIm)
				var tRe = wRe;
				wRe = wRe*wMulRe - wIm*wMulIm;
				wIm = tRe*wMulIm + wIm*wMulRe;
			}
		}
		
		numFlies >>= 1; 	// Divide by 2 by right shift
		span >>= 1;
		spacing >>= 1;
	}
	
	// The algorithm leaves the result in bit-reversed order. In the next few lines,
	// we unscramble the order while copying values from the scratch space to
	// the output arguments.
	
	// The array of bit-reversed numbers has this.logN numbers. If we're
	// doing an FFT with fewer elements, we can get the correct sequence
	// of bit reversed values by stepping through the array with a larger
	// stride, and masking out the upper bits.

	// For example, if the FFT object was initialized with logN = 5, the array
	// will have have 32 5-bit numbers, each bit-reversed. If we only want 16
	// 4-bit numbers, we use every second value and use a mask such that we
	// grab only the lowest 4 bits.

	// Get the stride. Stride is 1 if the size for this FFT matches the logN
	// passed to init().
	var bitRevStride = 1 << (this.logN - logN);
	
	// Apply bit mask depending on FFT size. We use lowest logN bits.
	// E.g. for n = 32 point FFT, mask is 5 bits (00011111 = 32-1).
	var revMask = n-1;
	
	for (i = 0; i < n; i++)
	{
		var srcID = this.bitRev[i*bitRevStride] & revMask;
		dstRe[i] = this.X[srcID].re;
		dstIm[i] = this.X[srcID].im;
	}
};


/**
 * Do bit reversal of a specified number of bits of an integer.
 * For example, 1101 bit-reversed is 1011.
 * @param x {number} Value to be bit-reversed.
 * @param numBits {Number} Number of bits in the value to be bit-reversed.
 * @return {number} The bit-reversed value.
 */
FFT.prototype.bitReverse = function(x, numBits)
{
	var y = 0;
	for (var i = 0; i < numBits; i++)
	{
		y <<= 1;
		y |= x & 0x0001;
		x >>= 1;
	}
	return y;
};


/**
 * Element of scratch space by the FFT algorithm. The scratch space is
 * a linked-list of complex numbers.
 * @constructor
 */
var FFTElement = function()
{
	this.re = 0.0;			// Real component
	this.im = 0.0;			// Imaginary component
	this.next = null;		// Next element in linked list
};

// Special voodoo to ensure that the code doesn't get compiled to nothing by
// Google's Closure Compiler (https://closure-compiler.appspot.com/home).
// See section "Solution: Export the Symbols You Want to Keep" in:
// https://developers.google.com/closure/compiler/docs/api-tutorial3?csw=1

window['FFT'] = FFT; // <-- Constructor
FFT.prototype['init'] = FFT.prototype.init;
FFT.prototype['forwardComplex'] = FFT.prototype.forwardComplex;
FFT.prototype['inverseComplex'] = FFT.prototype.inverseComplex;
FFT.prototype['forwardReal'] = FFT.prototype.forwardReal;
FFT.prototype['inverseReal'] = FFT.prototype.inverseReal;



