define(
["../myLibs/utils"],
function(utils){
	// The svg namespace
	var static_xmlns = "http://www.w3.org/2000/svg";
	var xlinkns = "http://www.w3.org/1999/xlink";

	// canvasDiv is where the svg element will be placed (absolute 0,0)
	// vWidth and vHeight are for viewing, realWidth and realHeight are the real size we draw upon
	return function(id, vWidth, vHeight, realWidth, realHeight){ // id is a id for an svg element on the html DOM that has been sized already
		// The object returned by this factory method
		var dc={
			svgCanvasDiv : document.getElementById(id),
			vSVG : document.createElementNS(static_xmlns, "svg"), // smaller, for viewing
			spectSVG  : document.createElementNS(static_xmlns, "svg"), // larger resolution, for spectrum
			strokeStyle :  "#FFFFFF",
			lineWidth : 1,
			lineBoxWidth : 15, // zero means just draw a path, otherwise draw a closed contour with forward and return paths
			pathFill : "pink",
			pathOpacity: ".5",
			pattern : "",
			hCanvas : null,

			zoomX  : 1, // the portion of the image in the view
			zoomY : 1,
			viewRatioW : vWidth/realWidth, //scale means relative to realHeight and Width
			viewRatioH : vHeight/realHeight,
			pixelShiftScaleX : function(p){return (dc.viewShiftW +p/(dc.zoomX*dc.viewRatioW));},
			pixelShiftScaleY : function(p){return (dc.viewRatioH + p/(dc.zoomY*dc.viewRatioH));},


			viewShiftW : 0,
			viewShiftH : 0,
			clear : function () { 
				var c = dc.spectSVG;
				var g = document.getElementById("drawGroup");
				c.removeChild(g);
				drawGroup=createDrawingSurface();
				dc.spectSVG.appendChild(drawGroup);
			}
		};

		var drawOpacity=.1;

		// See snippets
		dc.setFill = function(img){
			// defs ---------------------------------------------------------
			dc.defs = document.createElementNS(static_xmlns, "defs");
			dc.spectSVG.appendChild(dc.defs);

			// pattern -------------------------------------------------------
			dc.pattern = document.createElementNS(static_xmlns, "pattern");
			dc.pattern.setAttributeNS(null, 'id', "pattern");
			dc.pattern.setAttributeNS(null, 'x', "0");
			dc.pattern.setAttributeNS(null, 'y', "0");
			dc.pattern.setAttributeNS(null, 'width', realWidth);
			dc.pattern.setAttributeNS(null, 'height', realHeight);
			dc.pattern.setAttributeNS(null, 'patternUnits', "userSpaceOnUse");
			dc.pattern.setAttributeNS(null, 'preserveAspectRatio', "none");
			//dc.pattern.setAttributeNS(null, "viewBox", 0  + " " + 0 + " " + realWidth + " " + realHeight);

			dc.defs.appendChild(dc.pattern);

			// image ---------------------------------------------------------
			dc.image = document.createElementNS(static_xmlns, "image");
			dc.image.setAttributeNS(null, 'x', "0");
			dc.image.setAttributeNS(null, 'y', "0");
			dc.image.setAttributeNS(null, 'width', realWidth);
			dc.image.setAttributeNS(null, 'height', realHeight);
			dc.image.setAttributeNS(null, 'preserveAspectRatio', "none");  // note
			dc.image.setAttributeNS( xlinkns, "href", img );
			//dc.image.setAttributeNS( xlinkns, "href", "http://vignette4.wikia.nocookie.net/mlp/images/2/2a/FANMADE_Trixie_icon.png" );

			// Just double check img (dataURL) dimensions
			/*
			var img1 = new Image;
		    img1.onload = function() {
		    	console.log("size of dataURL image is " + img1.width + "," + img1.height)
		    };
		    img1.src =img;
			*/



			dc.pattern.appendChild(dc.image);
			dc.pathFill="url(#pattern)";



		}

		dc.vSVG.id="isvgObj";
		dc.vSVG.style.position = "absolute";
		dc.vSVG.style.top = 0;
		dc.vSVG.setAttributeNS(null, "width", vWidth);
		dc.vSVG.setAttributeNS(null, "height", vHeight);
		dc.vSVG.setAttributeNS(null, "preserveAspectRatio", "none");

		dc.svgCanvasDiv.appendChild(dc.vSVG);
		
		bbgrect=document.createElementNS(static_xmlns,"rect");
		bbgrect.setAttributeNS(null, "fill", "green");
		bbgrect.setAttributeNS(null, "x", 0);
		bbgrect.setAttributeNS(null, "y", 0);
		bbgrect.setAttributeNS(null, "width", vWidth);
		bbgrect.setAttributeNS(null, "height", vHeight);
		bbgrect.setAttributeNS(null, "fill-opacity", .1);

	    dc.vSVG.appendChild(bbgrect);

		dc.spectSVG.setAttributeNS(null, "xlink", xlinkns);
		dc.spectSVG.setAttributeNS(null, "width", realWidth);
		dc.spectSVG.setAttributeNS(null, "height", realHeight);

		dc.vSVG.appendChild(dc.spectSVG);
		dc.vSVG.setAttributeNS(null, "viewBox", 0  + " " + 0 + " " + realWidth + " " + realHeight);



		//dc.vSVG.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		//dc.spectSVG.setAttributeNS(null, "x", 50);
		//dc.spectSVG.setAttributeNS(null, "y", 50);


		// so we can scale in whatever dimension we want later.
		dc.spectSVG.setAttributeNS(null, "preserveAspectRatio", "none");
		//dc.spectSVG.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		//dc.spectSVG.setAttributeNS(null, "viewPort", 0  + " " + 0 + " " + vWidth + " " + vHeight);

		
		var createDrawingSurface = function(svgelmt){
			drawGroup = document.createElementNS(static_xmlns, "g");
			drawGroup.setAttribute('id', 'drawGroup');
			drawGroup.setAttribute('shape-rendering', 'inherit');
			//g.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
			dc.spectSVG.appendChild(drawGroup);
			drawGroup.setAttributeNS(null, "preserveAspectRatio", "none");


			bgrect=document.createElementNS(static_xmlns,"rect");
			bgrect.setAttributeNS(null, "fill", "blue");
			bgrect.setAttributeNS(null, "stroke" , "red");
			bgrect.setAttributeNS(null, "stroke-width" , 0);
			bgrect.setAttributeNS(null, "x", 0);
			bgrect.setAttributeNS(null, "y", 0);
			bgrect.setAttributeNS(null, "width", "100%");
			bgrect.setAttributeNS(null, "height", "100%");
			bgrect.setAttributeNS(null, "fill-opacity", drawOpacity);

		    drawGroup.appendChild(bgrect);
		    return drawGroup;

		}
		var drawGroup=createDrawingSurface();
		dc.spectSVG.appendChild(drawGroup);

		var mousePushed_drawing = false;

		var pathString;
		var forwardPathString;
		var returnPathString;

		var svgPath;

    	var mposX; //temporary
    	var mposY; // temporary

	    dc.spectSVG.addEventListener("mousedown", function(e){

	    	mposX = dc.pixelShiftScaleX(e.offsetX);
	    	mposY = dc.pixelShiftScaleY(e.offsetY);

	    	forwardPathString = "M " + mposX + "," + (mposY+dc.lineBoxWidth/2) + " "; 
	    	returnPathString = mposX + "," + (mposY-dc.lineBoxWidth/2) + " ";
	    	pathString = forwardPathString + returnPathString + " Z";

	       	svgPath = document.createElementNS(static_xmlns, "path");
	       	drawGroup.appendChild(svgPath);
	       	svgPath.setAttributeNS(null, "stroke", dc.strokeStyle);
	       	svgPath.setAttributeNS(null, "stroke-width", dc.lineWidth);
	       	svgPath.setAttributeNS(null, "fill", dc.pathFill);
	       	svgPath.setAttributeNS(null, "d", pathString);
	       	svgPath.setAttributeNS(null, "transform", "matrix(1 0 0 1 0 0)");

	       	svgPath.originShiftX=0;
	       	svgPath.originShiftY=0;
	       	svgPath.dragPosX=0;
	       	svgPath.dragPosY=0;
	       	svgPath.dragging=false;
	       	
	       	svgPath.addEventListener("mousedown", function(e){
	       		mposX = dc.pixelShiftScaleX(e.offsetX);
	    		mposY = dc.pixelShiftScaleY(e.offsetY);
	       		console.log("mousedown on path object");
	       		e.preventDefault();
	       		e.stopPropagation();
	       		this.dragging=true;
	       		console.log("setting dragpos to [" + this.dragPosX + ", " + this.dragPosY);
	       		this.dragPosX=mposX;
	       		this.dragPosY=mposY;

	       		dc.spectSVG.dragging=this;
	       	});

	       	svgPath.addEventListener("mouseup", function(e){
	       		if (! this.dragging) return;
	       		e.preventDefault();
	       		e.stopPropagation();
				this.dragging=false;
				dc.spectSVG.dragging=false;
			});



	    	mousePushed_drawing=true;

	    });

	    dc.spectSVG.addEventListener("mousemove", function(e){
	    	if (mousePushed_drawing){

	    		mposX = dc.pixelShiftScaleX(e.offsetX);
	    		mposY = dc.pixelShiftScaleY(e.offsetY);


	      		forwardPathString += "L " +  mposX + "," + (mposY+dc.lineBoxWidth/2) + " ";
	    		returnPathString   = "L " +  mposX + "," + (mposY-dc.lineBoxWidth/2) + " " + returnPathString;
	    		pathString = forwardPathString + returnPathString + " Z";

		    	svgPath.setAttributeNS(null, "d", pathString);
		    } else if (dc.spectSVG.dragging){
		    	var dobj = dc.spectSVG.dragging;
	       		mposX = dc.pixelShiftScaleX(e.offsetX);
	    		mposY = dc.pixelShiftScaleY(e.offsetY);

	       		if (! dobj.dragging) return;

	       		dobj.originShiftX+=(mposX-dobj.dragPosX);
	       		dobj.originShiftY+=(mposY-dobj.dragPosY);
	       		dobj.setAttributeNS(null, "transform", "matrix(1 0 0 1 " + dobj.originShiftX + " " +  dobj.originShiftY + ")");
	       		console.log("setting transform matrix to " + "matrix(1 0 0 1 " + dobj.originShiftX + " " +  dobj.originShiftY + ")" );
	       		dobj.dragPosX=mposX;
	       		dobj.dragPosY=mposY;

		    }
	    });

	    dc.spectSVG.addEventListener("mouseup", function(e){
    		mposX = dc.pixelShiftScaleX(e.offsetX);
    		mposY = dc.pixelShiftScaleY(e.offsetY);


      		forwardPathString += "L " +  mposX + "," + (mposY+dc.lineBoxWidth/2) + " ";
    		returnPathString   = "L " +  mposX + "," + (mposY-dc.lineBoxWidth/2) + " " + returnPathString;
    		pathString = forwardPathString + returnPathString + " Z";

	    	svgPath.setAttributeNS(null, "d", pathString);
	    	mousePushed_drawing=false;
	    });

	    dc.zoom = function(ws, hs){
	    	dc.zoomX=ws;
	    	dc.zoomY=hs;

	    	console.log("will scale vertically by " + dc.zoomY);
	    	// The shift changes with the zoom because of the upsidedown coords
	    	dc.viewShiftH = realHeight-realHeight/dc.zoomY;  // when we scale vertically, we also shift because of the upuside down coords. 

	    	dc.vSVG.setAttributeNS(null, "viewBox", dc.viewShiftW  + " " + dc.viewShiftH + " " + realWidth/dc.zoomX + " " + realHeight/dc.zoomY);

			//dc.spectSVG.setAttributeNS(null, "transform", "scale(" + dc.zoomX + ")");

	    	console.log("viewbox = " + dc.viewShiftW + ", " +  dc.viewShiftH + ", " + realWidth/dc.zoomX + ", " + realHeight/dc.zoomY);
	    }
	    

	    dc.setDrawOpacity=function(val){
	    	drawOpacity = val;
	    	bgrect.setAttributeNS(null, "fill-opacity", drawOpacity);
	    }

		return dc;
	}
});