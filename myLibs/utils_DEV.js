		// Here, source is a canvas, and destination is a 2D array
		utils.pixels2Array_notReadyYet = function(source, maxval, destination){
			if ((!source) || (source.length<=0)) return;
			var destWidth=destination.length;
			var destHeight=destination[0].length;
			var sourceWidth=source.width;  
			var sourceHeight=source.height;


			var sourceXfloat, sourceYfloat;
			var ctx = destination.getContext("2d");

			var mget=function(x,y){
				//console.log("mget " + x + ", " + y);
				if ((x >= (sourceWidth-1)) || (y >= (sourceHeight-1))){
					console.log ( "x is " + x + ", and y is " + y);
					return(0);
				}
				// will interpolate between m[i1, j1], m[i2, j1], m[i1,j2], and m[i2,j2]
				var i1 = Math.floor(x);
				var i2 = Math.ceil(x);
				var j1 = Math.floor(y);
				var j2 = Math.ceil(y);

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
		}

		// use matrix coordes to sample from canvas (interpolated) 
		// 