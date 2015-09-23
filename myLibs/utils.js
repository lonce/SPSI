define(
	function(){
		utils={};

		utils.map=function(val, m, n, p, q){
			return p + ((val-m)/(n-m))*(q-p);
		}

		// returns vector of r[i] =  sqrt(a[i]*a[i]+b[i]*b[i])
		utils.mag=function(a,b){
			var r=[];
			var max=-Number.MAX_VALUE;
			var l=a.length;
			for(var i=0;i<l;i++){
				r[i]=Math.sqrt(a[i]*a[i]+b[i]*b[i]);
			}
			return r;
		}

		// Provide a value to map to a heat color, and the max val that would be red for normalization.
		// cold is blue (hsl(240, ...)) and red is hot (hsl(0,...))
		utils.heatHSL = function(ival, imax){
			var myString = "hsl(" + (240 - 240 * ival/imax) + ",100%,50%)"
			return myString;
		}	

		// m[i,j] where i indexes "time" and j indexes "freq"
		// pw - pixel width, ph - pixel height, (to allocate to each matrix element)
		// maxval - largest value in matrix (used for normalization)
		// c - canvas to draw on
		// shift to center slice displays over center of corresponding waveform window
		utils.plot = function(m, pw, ph, maxval, c, shift){
			console.log("plot: slice width will be " + pw + ", and will shift by " + shift)
			var maxi=m.length;
			var maxj=m[0].length
			var ctx = c.getContext("2d");

			for (var i=0;i<maxi;i++){
				for (var j=0; j<maxj; j++){
					ctx.beginPath();
					ctx.rect(i*pw+shift,c.height-(j+1)*ph,pw,ph);
					ctx.fillStyle=utils.heatHSL(m[i][j],maxval);
					//console.log("m["+i+","+j+"] = " + m[i][i] + ", and the color string is " + ctx.fillStyle);
					ctx.fill();
					ctx.closePath();
				}
			}
		}	

		// Generate a cos signal
		utils.makeTone=function(f, sr, len){
			var sig=[];
			for (var i=0;i<len;i++){
					sig[i]=Math.cos(f*2*Math.PI*i/sr)
					//sig[i] = Math.cos(freq(i)*2*Math.PI*i/N);
			}
			return sig;
		}

		// Hann window value computed for index
		utils.hann = function(length, index) {
  			return 0.5 * (1 - Math.cos(2*Math.PI * index / (length - 1)));
		};

		// Hann window returned as an array
		utils.hannArray = function(length){
			var hann=[];
			for (var i = 0; i<length;i++){
				hann[i]=utils.hann(length,i);
			}
			return hann;
		}

		// Element-wise vector multiplication
		utils.dotStar=function(a,b){
			var c=[];
			for (var i=0;i<a.length;i++){
				c[i]=a[i]*b[i];
			}
			return c;
		}

		// Print pairs of array values to screen
		utils.arrays2Console=function(a,b,low,hi, header){
			var m = low ? low : 0;
			var n = hi ? hi : Math.min(a.length, b.length);

			console.log(header);
			for (var i = m; i < n; i++){
				console.log(i, a[i].toFixed(3), b[i].toFixed(3));
			}
		}

		return utils;
	}

);