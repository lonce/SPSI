define(
	[],
	function(){
		utils={};

        utils.getCanvasMousePosition = function (canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            //context.scale(1, 0.5);
            var bbox = canvas.getBoundingClientRect();
            return {
            x: (evt.clientX - rect.left)*(canvas.width/bbox.width),
            y: (evt.clientY - rect.top)*(canvas.height/bbox.height)
            };
        }

        utils.max2D=function(m){
        	var maxval=0;
        	var maxi=m.length;
			var maxj=m[0].length
			for(var i=0;i<maxi;i++){
				for(j=0;j<maxj;j++)
					if (m[i][j] > maxval) {maxval=m[i][j];}
			}
			return maxval;
        }
            
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
			if ((!m) || (m.length<=0)) return;
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

		utils.clear = function(canvas){
			var ctx=canvas.getContext("2d");
			ctx.rect(0,0,canvas.width,canvas.height);
			ctx.fillStyle="black";
			ctx.fill();					
		}

		// use canvas coords to sample (4-way interpolations) from m
		// m is thus the "source" we sample from, and canvas is the dest where the sampled values will go
		utils.plot2D = function(source, maxval, destination, cb){
			var time = Date.now();

			if ((!source) || (source.length<=0)) return;
			var destWidth=destination.width;
			var destHeight=destination.height;
			var sourceWidth=source.length;  // used for mapping destination coords to spectrogram coords
			var sourceHeight=source[0].length;

			var sourceXfloat, sourceYfloat;
			var ctx = destination.getContext("2d");

			var mget=function(x,y){
				//console.log("mget " + x + ", " + y);
				if ((x >= (sourceWidth-1)) || (y >= (sourceHeight-1))){
					console.log ( "x is " + x + ", and y is " + y);
					return(0);
				}
				var i1 = Math.floor(x);
				var i2 = Math.ceil(x);
				var j1 = Math.floor(y);
				var j2 = Math.ceil(y);
				if ((! source[i1]) || (! source[i2])) {
					console.log ( "WTF: i1 is " + i1 + ", and i2 is " + i2);
					return(0);

				};

				//This little hack make susre that if the mget point is smack on a grid point, that point gets weight=1
				if (i1===i2){
					if (i1===0) {
						i2=i1+1;
					} else {
						i1=i2-1
					}
				}

				if (j1===j2){
					if (j1===0) {
						j2=j1+1;
					} else {
						j1=j2-1
					}
				}

				// weighted average of 4 grid points of source[][] near x,y
				return ((j2-y)*source[i1][j1] + (y-j1)*source[i1][j2])*(i2-x) + ((j2-y)*source[i2][j1] + (y-j1)*source[i2][j2])*(x-i1);
				//return Math.max(source[i1][j1], Math.max(source[i1][j2], Math.max(source[i2][j1], source[i2][j2])));
			}

			// for every pixel, interpolate from source[][]
			for (var i=0;i<destWidth;i++){
				for (var j=0;j<destHeight;j++){
					sourceXfloat = utils.map(i,0,destWidth,0,sourceWidth-1);
					sourceYfloat = utils.map(j,0,destHeight,0,sourceHeight-1);

					ctx.fillStyle=utils.heatHSL(Math.sqrt(mget(sourceXfloat,sourceYfloat)),Math.sqrt(maxval));
					ctx.fillRect(i,destHeight-1-j,1,1);
				}
			}

			console.log("plot2D took " + (Date.now()-time) + " milliseconds");
			cb && cb();
		}

		//https://en.wikipedia.org/wiki/Grayscale
		var rgb2grey = function(r, g, b){
			return .299*r + .587*g + .114*b;
		}

		// Here, source is a canvas, and destination is a 2D array
		utils.pixels2Matrix = function(source, destination){
			if ((!source) || (source.length<=0)) return;
			var destWidth=destination.length;
			var destHeight=destination[0].length;

			// Intercavas does our interpolation for us
			var interCanvas = document.createElement("canvas");
			interCanvas.width=destWidth;
			interCanvas.height=destHeight;
			var interCtx=interCanvas.getContext("2d");
			interCtx.drawImage(source , 0, 0, destWidth, destHeight);

			var time = Date.now();
			var pixelData = interCtx.getImageData(0,0,destWidth, destHeight);
			// now the interCanvas and the matrix are the same dimensions. Just grab pixel data and convert to grey scale. 
			var pixel;
			var pindex=0;
				for(var j=0;j<destHeight;j++){
					for (var i=0;i<destWidth; i++){

					//pixel=interCtx.getImageData(i, j, 1, 1);
					//destination[i][j]=rgb2grey(pixel.data[0], pixel.data[1], pixel.data[2]);
					destination[i][destHeight-1-j]=rgb2grey(pixelData.data[pindex], pixelData.data[pindex+1], pixelData.data[pindex+2]);
					if (destination[i][destHeight-1-j] != 0){
						console.log("pt ["+i+","+j+"] = " + destination[i][destHeight-1-j]);
					}
					pindex+=4;
					
				}
			}
			console.log("pixels2Matrix took " + (Date.now()-time) + " milliseconds");
		}

		utils.svg2Matrix = function(isvgObj, destination, cb){
			
			var svgObj = isvgObj.cloneNode(true);

			// Scale svg to fit desination size
			svgObj.setAttribute("width", destination.length);
			svgObj.setAttribute("height", destination[0].length);
			console.log("svg2Matrix, setting viewbox width to  " + isvgObj.width.baseVal.value + ", and viewbox Hight to " + isvgObj.height.baseVal.value);
			svgObj.setAttributeNS(null, "viewBox", "0 0 " + isvgObj.width.baseVal.value + " " + isvgObj.height.baseVal.value);
			svgObj.setAttributeNS(null, "preserveAspectRatio", "none");


			isvgObj.setAttributeNS(null, "transform", "scale(" + destination.length/isvgObj.getAttribute("width") + " " + destination[0].length/isvgObj.getAttribute("height") +")");




			var data = new XMLSerializer().serializeToString(svgObj);
			var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
			var DOMURL = window.URL || window.webkitURL || window;
			var url = DOMURL.createObjectURL(svg);

			var c = document.createElement("canvas");
			c.width = destination.length;
			c.height = destination[0].length;
			var ctx = c.getContext('2d');
			ctx.fillStyle="black";
			ctx.fillRect(0,0,c.width, c.height);	


			var img = new Image();
			img.onload = function () {
				ctx.drawImage(img, 0, 0);
				DOMURL.revokeObjectURL(url);

				utils.pixels2Matrix(c, destination);
				//document.getElementById("svgCanvasDiv").appendChild(c);
				cb();
			}

			img.src = url;

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
			var wr=Math.sqrt(length/4)/Math.sqrt(length);
			var scale = 2*wr/Math.sqrt(1.5); // see Griffin Lim for window scaling
  			return scale*0.5 * (1 - Math.cos(Math.PI/length+2*Math.PI * index / length));
		};

		// Hann window returned as an array
		utils.hannArray = function(length){
			var hann=[];
			var area=0;
			for (var i = 0; i<length;i++){
				hann[i]=utils.hann(length,i);
				area+=hann[i];
			}
			console.log("Hann window area is " + area);
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