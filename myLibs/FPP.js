define(
	function(){
		FPP={};

		/**
		 * Interleave two buffers into one
		 */
		FPP.interleave = function (
			bufL,  //vector, 
			bufR,  //vector,
			buf,  //vector,
			n)
		{
			var p = 0;
			for (var i = 0; i < n; i++)
			{
				buf[p++] = bufL[i];
				buf[p++] = bufR[i];
			}
		}
		
		/**
		 * Deinterleave one buffer into two
		 */
		FPP.deinterleave = function (
			buf,  //vector,
			bufL,  //vector, 
			bufR,  //vector,
			n)
		{
			var p = 0;
			for (var i = 0; i < n; i++)
			{
				bufL[i] = buf[p++];
				bufR[i] = buf[p++];
			}
		}
		
		
		/**
		 * Moves samples in a vector. Does the right thing even if the
		 * the new and old positions overlap.
		 * @param	x		Vector whose samples you want to move
		 * @param	fromPos	Read starting from this position
		 * @param	toPos	Write starting from this position
		 * @param	n		Copy this many samples
		 */
		FPP.move = function ( 
			x,  //vector,
			fromPos,
			toPos, 
			n )
		{
			if ( toPos < fromPos )
			{
				while ( n > 0 )
				{
					x[toPos] = x[fromPos];
					toPos++;
					fromPos++;
					n--;
				}
			}
			else if ( toPos > fromPos )
			{	
				fromPos += n-1;
				toPos += n-1;
				while ( n > 0 )
				{
					x[toPos] = x[fromPos];
					toPos--;
					fromPos--;
					n--;
				}
			}
		}
		
		/**
		 * Zeroes out the specified number of samples.
		 * @param	x		Vector whose samples you want to set to zero
		 * @param	fromPos	Set to zero starting from this position
		 * @param	n		Zero out this many samples
		 */
		FPP.zero = function ( 
			x,  //vector, 
			fromPos,
			n )
		{
			if (fromPos == 0)
			{
				for (var i = 0; i < n; i++)
					x[i] = 0.0;
			}
			else
			{
				while ( n > 0 )
				{
					x[fromPos] = 0.0;
					fromPos++;
					n--;
				}
			}
		}
		
		/**
		 * Adds samples from src vector to dst vector
		 * @param	src		Source vector
		 * @param	srcPos	Add from this position
		 * @param	dst		Destination vector
		 * @param	dstPos	Add into dst start from this position
		 * @param	n		Number of samples to add in
		 */
		FPP.add_I = function (
			src,  //vector,
			srcPos,
			dst,  //vector,
			dstPos,
			n )
		{
			if (srcPos == 0 && dstPos == 0)
			{
				for ( var i = 0; i < n; i++ )
					dst[i] += src[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] += src[srcPos];
					dstPos++;
					srcPos++;
					n--;
				}
			}
		}
		
		/**
		 * Adds samples from src1 and src2
		 * @param	src1	Source vector
		 * @param	src1Pos	Add from this position
		 * @param	src2	Source vector
		 * @param	src2Pos	Add from this position
		 * @param	dst		Destination vector
		 * @param	dstPos	Add into dst start from this position
		 * @param	n		Number of samples to add in
		 */
		FPP.add = function (
			src1,  //vector,
			srcPos1,
			src2,  //vector,
			srcPos2,
			dst,  //vector,
			dstPos,
			n )
		{
			if (srcPos1 == 0 && srcPos2 == 0 && dstPos == 0)
			{
				for (var i = 0; i < n; i++)
					dst[i] = src1[i] + src2[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] = src1[srcPos1] + src2[srcPos2];
					dstPos++;
					srcPos1++;		
					srcPos2++;		
					n--;
				}
			}
		}
		
		// Modeled on vDSP_vadd
		FPP.vadd = function (
			x1,  //vector,
			x1Pos,
			x1Stride,
			x2,  //vector,
			x2Pos,
			x2Stride,
			y,  //vector,
			yPos,
			yStride,
			n)
		{
			while ( n > 0 )
			{
				y[yPos] = x1[x1Pos] + x2[x2Pos];
				x1Pos += x1Stride;
				x2Pos += x2Stride;
				yPos += yStride;
				n--;
			}
		}
		
		
		/**
		 * Subtract src2 from src1, put result into dst.
		 */
		FPP.sub = function (
			src1,  //vector,
			srcPos1,
			src2,  //vector,
			srcPos2,
			dst,  //vector,
			dstPos,
			n )
		{
			if (srcPos1 == 0 && srcPos2 == 0 && dstPos == 0)
			{
				for (var i = 0; i < n; i++)
					dst[i] = src1[i] - src2[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] = src1[srcPos1] - src2[srcPos2];
					dstPos++;
					srcPos1++;		
					srcPos2++;		
					n--;
				}
			}
		}
		
		/**
		 * Multiplies a vector in place
		 */
		FPP.mul_I = function(
			src,  //vector,
			dst,  //vector,
			n )
		{
			for ( var i = 0; i < n; i++ )
			{
				dst[i] *= src[i];
			}
		}
		
		/**
		 * Multiplies two vectors, stores result in a third one
		 */
		FPP.mul = function (
			src1,  //vector,
			srcPos1,
			src2,  //vector,
			srcPos2,
			dst,  //vector,
			dstPos,
			n )
		{
			if (srcPos1 == 0 && srcPos2 == 0 && dstPos == 0)
			{
				for (var i = 0; i < n; i++)
					dst[i] = src1[i] * src2[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] = src1[srcPos1] * src2[srcPos2];
					dstPos++;
					srcPos1++;		
					srcPos2++;		
					n--;
				}
			}
		}
		
		/**
		 * Multiplies each element of a vector by a constant value.
		 */
		FPP.mulC = function (
			src,  //vector,
			srcPos,
			val,
			dst,  //vector,
			dstPos,
			n)
		{
			if (srcPos == 0 && dstPos == 0)
			{
				for (var i = 0; i < n; i++)
					dst[i] = val * src[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] = val * src[srcPos];
					srcPos++;
					dstPos++;
					n--;
				}
			}
		}
		
		// Modeled on vDSP_vmul
		FPP.vmul = function (
			x1,  //vector,
			x1Pos,
			x1Stride,
			x2,  //vector,
			x2Pos,
			x2Stride,
			y,  //vector,
			yPos,
			yStride,
			n)
		{
			while ( n > 0 )
			{
				y[yPos] = x1[x1Pos] * x2[x2Pos];
				x1Pos += x1Stride;
				x2Pos += x2Stride;
				yPos += yStride;
				n--;
			}
		}
		
		
		
		/**
		 * Computes the dot product of two vectors.
		 * @param	src1	First vector
		 * @param	srcPos1	Offset into first vector
		 * @param	src2	Second vector
		 * @param	srcPos2	Offset into second vector
		 * @param	n		Number of elements
		 * @return	The dot product
		 */
		FPP.dotProduct = function (
			src1,  //vector,
			srcPos1,
			src2,  //vector,
			srcPos2,
			n)
		{
			var sum = 0.0;
			while ( n > 0 )
			{
				sum += src1[srcPos1] * src2[srcPos2];
				srcPos1++;		
				srcPos2++;		
				n--;
			}
			return sum;
		}
		
		/**
		 * Gets the phases given complex numbers.
		 * 
		 * @param	re		Real component
		 * @param	im		Imaginary component
		 * @param	phase	Phases
		 * @param	n		Number of elements
		 */
		FPP.phase = function (
			re,  //vector,
			im,  //vector,
			phase,  //vector,
			n )
		{
			for ( var i = 0; i < n; i++ )
				phase[i] = Math.atan2(im[i], re[i]);
		}
		
		/**
		 * Gets the magnitudes given a vector of complex numbers.
		 * 
		 * @param	re		Real component
		 * @param	im		Imaginary component
		 * @param	mag		Magnitudes
		 * @param	n		Number of elements
		 */
		FPP.magnitude = function (
			re,  //vector,
			im,  //vector,
			mag,  //vector,
			n )
		{
			for ( var i = 0; i < n; i++ )
				mag[i] = Math.sqrt(im[i]*im[i] + re[i]*re[i]);
		}
		
		
		FPP.power = function (
			re,  //vector,
			im,  //vector,
			srcPos,
			power,  //vector,
			dstPos,
			n )
		{
			while ( n > 0 )
			{
				power[dstPos] = im[srcPos]*im[srcPos] + re[srcPos]*re[srcPos];
				srcPos++;
				dstPos++;
				n--;
			}
		}
		
		/**
		 * Convert from polar coordinates (mag,phase) to 
		 * cartesian/rectangular coordinates (real,imaginary).
		 * @param	mag		Magnitude
		 * @param	phase	Phase (radians)
		 * @param	re		Real component
		 * @param	im		Imaginary component
		 * @param	n		Number of elements
		 * 
		 */
		FPP.polarToCart = function (
			mag,  //vector,
			phase,  //vector,
			re,  //vector,
			im,  //vector,
			n )
		{
			for ( var k = 0; k < n; k++ )
			{
				re[k] = mag[k]*Math.cos(phase[k]);
				im[k] = mag[k]*Math.sin(phase[k]);
			}
			//			var k = 0;
			//			while (n > 0)
			//			{
			//				re[k] = mag[k]*Math.cos(phase[k]);
			//				im[k] = mag[k]*Math.sin(phase[k]);
			//				k++;
			//				n--;
			//			}
		}
		
		/**
		 * Convert from cartesian/rectangular (real,imaginary) 
		 * coordinates to polar coordinates (mag,phase). 
		 * @param	srcRe		Real component
		 * @param	srcIm		Imaginary component
		 * @param	srcPos		Start position in source vectors
		 * @param	dstMag		Magnitude
		 * @param	dstPhase	Phase (radians)
		 * @param	dstPos		Start position in destination vectors
		 * @param	n			Number of elements
		 */
		FPP.cartToPolar = function (
			srcRe,  //vector,
			srcIm,  //vector,
			srcPos,
			dstMag,  //vector,
			dstPhase,  //vector,
			dstPos,
			n )
		{
			while ( n > 0 )
			{
				var re = srcRe[srcPos];
				var im = srcIm[srcPos];
				dstMag[dstPos] = Math.sqrt(re*re + im*im);
				dstPhase[dstPos] = Math.atan2(im, re);
				srcPos++;
				dstPos++;
				n--;
			}
		}
		
		/**
		 * Copies a vector
		 */
		FPP.copy = function (
			src,  //vector,
			srcPos,
			dst,  //vector,
			dstPos,
			n )
		{
			if (srcPos == 0 && dstPos == 0)
			{
				for (var i = 0; i < n; i++)
					dst[i] = src[i];
			}
			else
			{
				while ( n > 0 )
				{
					dst[dstPos] = src[srcPos];
					dstPos++;
					srcPos++;		
					n--;
				}
			}
		}
		
		/**
		 * Gets the maximum value
		 */
		FPP.maxVal = function (
			x,  //vector,
			n)
		{
			var max = -Number.MAX_VALUE;
			for (var i = 0; i < n; i++)
			{
				var v = x[i];
				if (v < max) max = v;
			}
			//			while (n > 0)
			//			{
			//				n--;
			//				var v:Number = x[--n];
			//				if (v > max) max = v;
			//			}
			return max;
		}

		return FPP;

});