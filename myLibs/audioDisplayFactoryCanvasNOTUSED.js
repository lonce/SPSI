define(
	function(){
		return function(id){
			audioDisplay={};

			var canvas;
			var ctx;
			var backgroundColor="#000000";
			var cHeight, cWidth;
			//var imageData; // will use to hold pixel array of canvas 


			audioDisplay.show=function(sig){
				var resamp = resample(sig, cWidth);
				var pIndex;
				drawBackground();
				
				//imageData = ctx.getImageData(0, 0, cWidth, cHeight);
				ctx.strokeStyle= "#00FF00";
				ctx.beginPath();
				ctx.moveTo(i, Math.floor(cHeight*(resamp[0]+1)/2))
				for (var i=0;i<cWidth;i++){
					//setPixel(i, Math.floor(cHeight*(resamp[i]+1)/2), 255,255,255,255);
					ctx.lineTo(i, Math.floor(cHeight*(resamp[i]+1)/2))
				}
				ctx.stroke();
				ctx.closePath();
				
				//ctx.putImageData(imageData, 0, 0);

			}

			// --- private ----------------------------
			var drawBackground=function(){
				ctx.fillStyle=backgroundColor;
				ctx.fillRect(0,0,cWidth, cHeight);
			}

			/*
			// assumes cWidth and imageData are correctly set
			var setPixel=function(m, n, r, g, b, a){
				var pIndex=4*(m+n*cWidth);
				imageData.data[pIndex]=r;
				imageData.data[pIndex+1]=g;
				imageData.data[pIndex+2]=b;
				imageData.data[pIndex+3]=a;
				console.log("Set pixel [" + m + "," + n + "] to "+ "r=" + r + ", g=" + g + ", b=" + b + ", a=" + a );
			}
			*/

			var resample = function (sig, numPoints){
				var retVal=[];
				var sigLen=sig.length;
				var fIndex; 
				var floorIndex, ceilIndex;
				var w; // fractional part of fIndex

				for (var i=0;i<numPoints;i++){
					fIndex=(i/numPoints)*(sigLen-1);
					floorIndex=Math.floor(fIndex);
					ceilIndex=Math.ceil(fIndex);
					w=fIndex%1;
					retVal[i] = (1-w)*sig[floorIndex] + w*sig[ceilIndex];
				}
				return retVal;
			}

			//initialization
//			(function(id){
				canvas=document.getElementById(id);
				ctx=canvas.getContext("2d");
				cWidth=canvas.width;
				cHeight=canvas.height;

				drawBackground();
				//imageData = ctx.createImageData(cWidth, cHeight);
//			})(id);

			return audioDisplay;
		}
	}
);
