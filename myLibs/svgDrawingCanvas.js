define(
["../myLibs/utils"],
function(utils){
	// The svg namespace
	var static_xmlns = "http://www.w3.org/2000/svg";

	// canvasDiv is where the svg element will be placed (absolute 0,0)
	// vWidth and vHeight are for viewing, realWidth and realHeight are the real size we draw upon
	return function(id, vWidth, vHeight, realWidth, realHeight){ // id is a id for an svg element on the html DOM that has been sized already
		// The object returned by this factory method
		var dc={
			svgCanvasDiv : document.getElementById(id),
			vSVG : document.createElementNS("http://www.w3.org/2000/svg", "svg"),
			spectSVG  : document.createElementNS("http://www.w3.org/2000/svg", "svg"),
			strokeStyle :  "#FFFFFF",
			lineWidth : 1,
			lineBoxWidth : 12, // zero means just draw a path, otherwise draw a closed contour with forward and return paths
			hCanvas : null,

			zoomX  : 1, // the portion of the image in the view
			zoomY : 1,
			viewRatioW : vWidth/realWidth, //scale means relative to realHeight and Width
			viewRatioH : vHeight/realHeight,
			pixelScaleW : function(p){return (p/(dc.zoomX*dc.viewRatioW));},
			pixelScaleH : function(p){return (p/(dc.zoomY*dc.viewRatioH));},


			viewShiftW : 0,
			viewShiftH : 0,
			clear : function () { var c = dc.spectSVG; while (c.firstChild) { c.removeChild(c.firstChild); }}
		};

		dc.vSVG.id="isvgObj";
		dc.vSVG.style.position = "absolute";
		dc.vSVG.style.top = 0;
		dc.vSVG.setAttributeNS(null, "width", vWidth);
		dc.vSVG.setAttributeNS(null, "height", vHeight);
		dc.vSVG.setAttributeNS(null, "preserveAspectRatio", "none");
		
		bbgrect=document.createElementNS(static_xmlns,"rect");
	    dc.vSVG.appendChild(bbgrect);
		bbgrect.setAttributeNS(null, "fill", "green");
		bbgrect.setAttributeNS(null, "x", 0);
		bbgrect.setAttributeNS(null, "y", 0);
		bbgrect.setAttributeNS(null, "width", vWidth);
		bbgrect.setAttributeNS(null, "height", vHeight);
		bbgrect.setAttributeNS(null, "fill-opacity", .1);

		dc.svgCanvasDiv.appendChild(dc.vSVG);
		dc.vSVG.appendChild(dc.spectSVG);
		dc.spectSVG.setAttributeNS(null, "width", realWidth);
		dc.spectSVG.setAttributeNS(null, "height", realHeight);
		dc.vSVG.setAttributeNS(null, "viewBox", 0  + " " + 0 + " " + realWidth + " " + realHeight);
		//dc.vSVG.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		//dc.spectSVG.setAttributeNS(null, "x", 50);
		//dc.spectSVG.setAttributeNS(null, "y", 50);


		// so we can scale in whatever dimension we want later.
		dc.spectSVG.setAttributeNS(null, "preserveAspectRatio", "none");
		//dc.spectSVG.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		//dc.spectSVG.setAttributeNS(null, "viewPort", 0  + " " + 0 + " " + vWidth + " " + vHeight);


		var g = document.createElementNS(static_xmlns, "g");
		g.setAttribute('id', 'group');
		g.setAttribute('shape-rendering', 'inherit');
		//g.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		dc.spectSVG.appendChild(g);
		g.setAttributeNS(null, "preserveAspectRatio", "none");


		bgrect=document.createElementNS(static_xmlns,"rect");
	    g.appendChild(bgrect);
		bgrect.setAttributeNS(null, "fill", "blue");
		bgrect.setAttributeNS(null, "stroke" , "red");
		bgrect.setAttributeNS(null, "stroke-width" , 0);
		bgrect.setAttributeNS(null, "x", 0);
		bgrect.setAttributeNS(null, "y", 0);
		bgrect.setAttributeNS(null, "width", "100%");
		bgrect.setAttributeNS(null, "height", "100%");
		bgrect.setAttributeNS(null, "fill-opacity", .1);

		



		var mousePushed = false;

		var pathString;
		var forwardPathString;
		var returnPathString;

		var svgPath;

    	var mposX; //temporary
    	var mposY; // temporary

	    dc.spectSVG.addEventListener("mousedown", function(e){

	    	mposX = (dc.viewShiftW + dc.pixelScaleW(e.offsetX));
	    	mposY = (dc.viewShiftH + dc.pixelScaleH(e.offsetY));

	    	forwardPathString = "M " + mposX + "," + (mposY+dc.lineBoxWidth/2) + " "; 
	    	returnPathString = mposX + "," + (mposY-dc.lineBoxWidth/2) + " ";
	    	pathString = forwardPathString + returnPathString + " Z";

	       	svgPath = document.createElementNS(static_xmlns, "path");
	       	g.appendChild(svgPath);
	       	svgPath.setAttributeNS(null, "stroke", dc.strokeStyle);
	       	svgPath.setAttributeNS(null, "stroke-width", dc.lineWidth);
	       	svgPath.setAttributeNS(null, "fill", "white");
	       	svgPath.setAttributeNS(null, "d", pathString);

	    	mousePushed=true;

	    });

	    dc.spectSVG.addEventListener("mousemove", function(e){
	    	if (mousePushed){

	    		mposX = (dc.viewShiftW + dc.pixelScaleW(e.offsetX));
	    		mposY = (dc.viewShiftH + dc.pixelScaleH(e.offsetY));


	      		forwardPathString += "L " +  mposX + "," + (mposY+dc.lineBoxWidth/2) + " ";
	    		returnPathString   = "L " +  mposX + "," + (mposY-dc.lineBoxWidth/2) + " " + returnPathString;
	    		pathString = forwardPathString + returnPathString + " Z";

		    	svgPath.setAttributeNS(null, "d", pathString);
		    }
	    });

	    dc.spectSVG.addEventListener("mouseup", function(e){
    		mposX = (dc.viewShiftW + dc.pixelScaleW(e.offsetX));
    		mposY = (dc.viewShiftH + dc.pixelScaleH(e.offsetY));


      		forwardPathString += "L " +  mposX + "," + (mposY+dc.lineBoxWidth/2) + " ";
    		returnPathString   = "L " +  mposX + "," + (mposY-dc.lineBoxWidth/2) + " " + returnPathString;
    		pathString = forwardPathString + returnPathString + " Z";

	    	svgPath.setAttributeNS(null, "d", pathString);
	    	mousePushed=false;
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
	    	bgrect.setAttributeNS(null, "fill-opacity", val);
	    }

		return dc;
	}
});