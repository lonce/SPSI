define(
["../myLibs/utils"],
function(utils){


	return function(id, realW, realH){ // id is a id for an svg element on the html DOM that has been sized already
		// The object returned by this factory method
		var dc={
			dCanvas : document.getElementById(id),
			strokeStyle :  "#FF00FF",
			lineWidth : 1,
			hCanvas : null,
			backgroundColor :  "black"
		};

		var dCanvasWidth=dc.dCanvas.width;
		var dCanvasHeight=dc.dCanvas.height;

		var ctx		= dc.dCanvas.getContext("2d");
		var mousePressed = false;
		var lastX	= 0;
		var lastY	= 0;
		var cpos; // local var for storing canvas mouse position 

		// Hidden canvas
		var hCtx, hLastX, hLastY, hpos;
		if (realW){
			// the "hidden canvas" has the actual dimensions of the spectrogram we want to draw into
			// usually much higher resolution in time than we can display for drawing
			dc.hCanvas = document.createElement("canvas");

			dc.hCanvas.width = dc.hCanvas.offsetWidth = dc.hCanvas.clientWidth = realW;
			dc.hCanvas.height = dc.hCanvas.offsetHeight = dc.hCanvas.clientHeight = realH;
			hCtx = dc.hCanvas.getContext("2d");
			hLastX = 0;
			hLastY = 0;
		}

		// start drawing
		dc.dCanvas.addEventListener("mousedown", function(e){
			mousePressed=true;

			cpos = utils.getCanvasMousePosition(dc.dCanvas, e);
			lastX=cpos.x;
			lastY=cpos.y;

			if (dc.hCanvas){
				hpos = quickMap(cpos);
				hLastX = hpos.x;
				hLastY = hpos.y;
			}

		});

		// draw a line
		dc.dCanvas.addEventListener("mousemove", function(e){
			
			if (mousePressed){
				cpos =  utils.getCanvasMousePosition(dc.dCanvas, e);
				ctx.beginPath();
				ctx.moveTo(lastX, lastY);
				ctx.strokeStyle=dc.strokeStyle;
				ctx.lineWidth=dc.lineWidth;
				ctx.lineTo(cpos.x, cpos.y);
				ctx.stroke();
				lastX=cpos.x;
				lastY=cpos.y;

				if (dc.hCanvas){
					hpos = quickMap(cpos);
					hCtx.beginPath();
					hCtx.moveTo(hLastX, hLastY);
					hCtx.strokeStyle=dc.strokeStyle;
					hCtx.lineWidth=dc.lineWidth;
					hCtx.lineTo(hpos.x, hpos.y);
					hCtx.stroke();
					hLastX = hpos.x;
					hLastY = hpos.y;
				}
			}
		});

		// stop drawing
		dc.dCanvas.addEventListener("mouseup", function(e){
			mousePressed=false;
	
			cpos =  utils.getCanvasMousePosition(dc.dCanvas, e);
			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
			ctx.strokeStyle=dc.strokeStyle;
			ctx.lineWidth=dc.lineWidth;
			ctx.moveTo(cpos.x, cpos.y);
			ctx.stroke();
			lastX=cpos.x;
			lastY=cpos.y;

			if (dc.hCanvas){
				hpos = quickMap(cpos);
				hCtx.beginPath();
				hCtx.moveTo(hLastX, hLastY);
				hCtx.strokeStyle=dc.strokeStyle;
				hCtx.lineWidth=dc.lineWidth;
				hCtx.stroke();
				hLastX=hpos.x;
				hLastY=hpos.y;
			}

		});

		dc.clear = function(){
			ctx.fillStyle=dc.backgroundColor;
			ctx.fillRect(0,0,dCanvasWidth, dCanvasHeight);	

			if (dc.hCanvas){
				hCtx.fillStyle=dc.backgroundColor;
				hCtx.fillRect(0,0,realW, realH);	
			}
		}

		var quickMap=function(fmouse){
			return({"x": Math.round(realW*fmouse.x/dCanvasWidth),
					"y": Math.round(realH*fmouse.y/dCanvasHeight)});
		};

		return dc;
	}
});