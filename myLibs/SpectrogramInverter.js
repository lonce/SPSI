define(
	["../myLibs/FPP"],
	function(FPP){
		SpectrogramInverter={};

		SpectrogramInverter.phaseEstimate=function(currentMag, phaseAcc){
			computePhases(currentMag, phaseAcc);
		}

		var computePhases =  function (m_mag, m_phase)
		{
			var m_L = (m_mag.length-1)*2;
			m_S = m_L/4;

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





