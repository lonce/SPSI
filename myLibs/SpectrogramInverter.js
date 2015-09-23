define(
	["../myLibs/FPP"],
	function(FPP){
		SpectrogramInverter={};

	/**
	 * Analyzes and resynthesizes mono audio using only the magnitude spectrum, but
	 * unlike RTISI, it does it with no iteration!
	 */

		var m_log2Len = 0;
		
		var	m_L = 0;							// Analysis window length
		var m_S = 0;							// Synthesis step
		var m_fft;								// The FFT
		var m_win;					// Analysis/synthesis window
		var m_outBuf;				// Overlap-add output buffer
		
		var m_mag;					// Magnitude
		var m_phase;				// Phase
		
		var m_tempRe;				// Temporary real/imaginary buffer
		var m_tempIm;
		


		/**
		 * Initialize
		 * @param	Log-base-2 of analysis window length
		 */		
		SpectrogramInverter.init = function(
			log2Len )
		{
			m_log2Len = log2Len;
			
			// ---------------------------------
			// Compute window length and output block lengths
			m_L = 1 << log2Len;
			m_S = m_L/4;
			
			console.log( "SpectrogramInverter.init: m_L:", m_L, "m_S:", m_S );
			
			// ---------------------------------
			// Initialize the FFT
			m_fft = new FFT();
			m_fft.init(log2Len);
			
			// ---------------------------------
			// Create analysis/synthesis window
			// As per Griffin-Lim
			//m_win = new Array(m_L);
			m_win = new Array(m_L);
			
			const a =  0.5;	// Hanning
			const b = -0.5;

			//	Rectangular window magnitude
			var wr = Math.sqrt(m_S)/Math.sqrt(m_L);

			//	Scale factor for Hamming/Hanning window
			var scale = 2*wr / Math.sqrt(4*a*a + 2*b*b);
			
			for ( var k = 0; k < m_L; k++ )
			{
				m_win[k] = scale*(a + b*Math.cos(2*Math.PI*k/m_L));
			}			
			
			// Overlap-add summing buffer
			m_outBuf = new Array(m_L);
			FPP.zero( m_outBuf, 0, m_L );
			
			// Allocate some "temp" buffers use in process function
			m_tempRe = new Array(m_L);
			m_tempIm = new Array(m_L);

			// Magnitude and phase
			m_mag = new Array(m_L/2);
			m_phase	= new Array(m_L/2);
		}
		
		/**
		 * Call when you want to pause playback. This clears the output
		 * buffer so you don't get a glitch when you start playing again.
		 */
		SpectrogramInverter.clearOutBuf = function()
		{
			FPP.zero(m_outBuf, 0, m_L);
			
			// Also reset phases
			FPP.zero(m_phase, 0, m_L/2);
		}

		/**
		 * Process a single frame of input. Input frames
		 * are 2^log2Len long.  Synthesis uses quarter-frame
		 * overlap, so output buffers are 1/4 the input frame
		 * length. 
		 * @param	src			Source frame buffer (m_L samples)
		 * @param	dst			Output buffer (m_S samples, i.e. a quarter frame)
		 * @param	origPhase	If true, use original phases from source audio
		 */
		SpectrogramInverter.process = function(
			src,
			dst,
			origPhase)
		{
			var i;
			origPhase = typeof origPhase !== 'undefined' ?  origPhase : false;
			
			var PI = Math.PI;
			var TWOPI = 2*Math.PI;			
			
			// Shift buffer for synthesized output to left by m_S samples
			FPP.move(m_outBuf, m_S, 0, m_L-m_S);
			FPP.zero(m_outBuf, m_L-m_S, m_S);
			
			// Apply window analysis window
			FPP.mul(src, 0, m_win, 0, m_tempRe, 0, m_L);
			FPP.zero(m_tempIm, 0, m_L);

			// Do FFT	
			m_fft.run(m_tempRe, m_tempIm);

			// Get the magnitude of the new frame
			FPP.magnitude(m_tempRe, m_tempIm, m_mag, m_L/2);
			
			if (origPhase == false)
			{
				// Try RTISI-like initial phase estimation (i.e. by getting phase
				// from 3/4-filled frame of output audio buffer)
				//FPP.mul(m_outBuf, 0, m_win, 0, m_tempRe, 0, m_L);
				//FPP.zero(m_tempIm, 0, m_L);
				//m_fft.run(m_tempRe, m_tempIm);
				//FPP.phase(m_tempRe, m_tempIm, m_phase, m_L/2);
				
				// Update phases based on magnitude spectrum
				computePhases();
			}
			else
			{
				// Forcing use of original phases (typically for testing
				// or quality comparison).  
				// Get the original phase and overwrite phase estimate
				FPP.phase(m_tempRe, m_tempIm, m_phase, m_L/2);
			}

			// Combine magnitudes and phases
			FPP.polarToCart( m_mag, m_phase, m_tempRe, m_tempIm, m_L/2 );
			
			// Make upper part of spectrum, using even symmetry for real part, odd symmetry for imaginary part
			for (i = 1; i < m_L/2; i++)
			{
				m_tempRe[m_L-i] =  m_tempRe[i];
				m_tempIm[m_L-i] = -m_tempIm[i];
			}
			m_tempRe[0] = m_tempRe[m_L/2] = 0.0;
			m_tempIm[0] = m_tempIm[m_L/2] = 0.0;
			
			// Invert the spectra to get audio signal.
			// (Imaginary part should be close to zero after this).
			m_fft.run(m_tempRe, m_tempIm, true);
			
			//	Apply synthesis window to newly generated audio
			FPP.mul_I(m_win, m_tempRe, m_L);

			//	Overlap-add new audio with that generated so far
			FPP.add_I( m_tempRe, 0, m_outBuf, 0, m_L );
			
			//	Oldest quarter frame is now done, so pass to output
			FPP.copy( m_outBuf, 0, dst, 0, m_S );
		}	

		
		/**
		 * Do phase update based on magnitude spectrum
		 */
		var computePhases =  function ()
		{
			// For each bin
			for (var i = 1; i < m_L/2-1; i++)
			{
				// If it's a peak
				if (m_mag[i] > m_mag[i-1] && m_mag[i] > m_mag[i+1])
				{
					// Phase estimate using quadratic interpolation as per Julios O. Smith
					// http://www.dsprelated.com/dspbooks/sasp/Quadratic_Interpolation_Spectral_Peaks.html
					// To be determined: does quadratic interpolation work best on magnitude spectrum,
					// power spectrum, log spectrum?  I don't know, but I find it works pretty well with
					// the magnitude spectrum.

					// Use quadratic interpolation to estimate the
					// real peak position
					var alpha = m_mag[i-1];
					var beta = m_mag[i];
					var gamma = m_mag[i+1];
					
					var denom = alpha - 2*beta + gamma;
					var p = (denom != 0) ? 0.5*(alpha-gamma)/denom : 0.0;
					
					// Get the adjusted phase rate
					var phaseRate = 2*Math.PI*(i+p)/m_L;
					
					// Update the phase accumulator for this peak bin
					m_phase[i] += m_S*phaseRate;
					
					var peakPhase = m_phase[i];
					
					// ----
					// Apply simple phase locking around the peaks.
					// 
					// The phase relationships of the bins around the peak were determined by
					// some simple experiments, but I (Gerry) was inspired by stuff I'd read in
					// Laroche/Dolson "About This Phasiness Business" (1997), which mentions a paper
					// M.S. Puckette "Phase-locked vocoder" (1995).  
					// http://msp.ucsd.edu/Publications/mohonk95.pdf
					// According to Laroche/Dolson:
					// "Puckette in [5] recognized that for a constant-frequency constant-amplitude sinusoid 
					// the synthesis phases around the maximum of the Fourier transform should exhibit +/- pi 
					// alternations and proposed a very simple way to constrain them to do so".
					//
					// I don't know whether my method is the same as what Puckette described.  Mine just
					// corresponds to what I measured experimentally with in a tiny C++ test app.
					
					// Do 0/pi phase shift thing around the peak
					// If actual peak is to the right
					var bin;
					if (p > 0)
					{
						// - Bins to left have shift of pi
						// - First bin to right has pi shift
						// - Other bins to right have zero shift
						bin = i-1;
						while (bin > 0 && m_mag[bin] < m_mag[bin+1])
						{
							m_phase[bin] = peakPhase + Math.PI;
							bin--;
						}
						bin = i+1;
						while (bin < m_L/2-1 && m_mag[bin] < m_mag[bin-1])
						{
							if (bin == i+1)
								m_phase[bin] = peakPhase + Math.PI;
							else
								m_phase[bin] = peakPhase + 0;
							bin++;
						}
					}
					else
					{
						// Peak is to the left
						// - Bins to right have shift of pi
						// - First bin to left has pi shift
						// - Other bins to left have zero shift
						bin = i-1;
						while (bin > 0 && m_mag[bin] < m_mag[bin+1])
						{
							if (bin == i-1)
								m_phase[bin] = peakPhase + Math.PI;
							else
								m_phase[bin] = peakPhase + 0;
							bin--;
						}
						bin = i+1;
						while (bin < m_L/2-1 && m_mag[bin] < m_mag[bin-1])
						{
							m_phase[bin] = peakPhase + Math.PI;
							bin++;
						}
					}
				}
			}
			
			// Should be done if we're going to play for a very long time to avoid
			// getting enormous phase values.
			// Limit phase to +/- PI
			//vDSP_vsmul(m_phaseAccum.data(), 1, &INVTWOPI, m_phaseAccum.data(), 1, m_N/2);
			//vDSP_vfrac(m_phaseAccum.data(), 1, m_phaseAccum.data(), 1, m_N/2);
			//vDSP_vsmul(m_phaseAccum.data(), 1, &TWOPI, m_phaseAccum.data(), 1, m_N/2);
		} // computePhases

		return SpectrogramInverter;
		
});





