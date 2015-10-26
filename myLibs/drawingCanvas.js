// dCanvas is the displayed canvas that the user sees and draws on.
// hCanvas is the hidden canvas that has the specified dimensions (generally corresponding to
//   the dimensions of the spectrogram that we will use to convert to a matrix for SPSI conversion

define(
["../myLibs/utils"],
function(utils){


	return function(id, realW, realH){ // id is a id for an canvas element on the html DOM that has been sized already
		// The object returned by this factory method
		var dc={
			dCanvas : document.getElementById(id),
			imgData : new Image(),
			strokeStyle :  "#FF00FF",
			lineWidth : 1,
			hCanvas : null,
			backgroundColor :  "black",
			viewScaleW : 1,
			viewScaleH : 1,
			viewShiftW : 0,
			viewShiftH : 0,
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

			// if we have a hidden canvas, draw on it, too.
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

		dc.setImage = function(imgsrc){
			dc.imgData.src=imgsrc;
			ctx.drawImage(dc.imgData, 0, 0, dc.dCanvas.width, dc.dCanvas.height);

		}

		dc.scale = function(ws, hs){
	    	var bbw = dc.imgData.width;
	    	var bbh = dc.imgData.height
	    	ws = ws || 1;
	    	hs = hs || 1;
	    	dc.viewScaleW = ws;
	    	dc.viewScaleH = hs;
	    	dc.viewShiftH = bbh-bbh/hs;  // when we scale vertically, we also shift because of the upuside down coords. 

			ctx.drawImage(dc.imgData, 0, dc.viewShiftH, bbw/ws, bbh/hs, 0, 0, dc.dCanvas.width, dc.dCanvas.height);
	    	//dc.svgelmt.setAttributeNS(null, "viewBox", 0  + " " + dc.viewShiftH + " " + bbw/ws + " " + bbh/hs);



		}

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