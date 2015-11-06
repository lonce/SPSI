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
			svgelmt  : document.createElementNS("http://www.w3.org/2000/svg", "svg"),
			strokeStyle :  "#00FFFF",
			lineWidth : 1,
			hCanvas : null,
			backgroundColor :  "black",
			viewScaleW : vWidth/realWidth,
			viewScaleH : vHeight/realHeight,
			viewShiftW : 0,
			viewShiftH : 0,
			clear : function () { var c = dc.svgelmt; while (c.firstChild) { c.removeChild(c.firstChild); }}

		};

		
		dc.svgelmt.id="isvgObj";
		dc.svgelmt.style.position = "absolute";
		dc.svgelmt.style.top = 0;
		

		dc.svgelmt.setAttributeNS(null, "width", realWidth);
		dc.svgelmt.setAttributeNS(null, "height", realHeight);
		// so we can scale in whatever dimension we want later.
		dc.svgelmt.setAttributeNS(null, "preserveAspectRatio", "none");
		dc.svgelmt.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		var g = document.createElementNS(static_xmlns, "g");
		g.setAttribute('id', 'group');
		g.setAttribute('shape-rendering', 'inherit');
		g.setAttributeNS(null, "vector-effect", "non-scaling-stroke");
		dc.svgelmt.appendChild(g);


		bgrect=document.createElementNS(static_xmlns,"rect");
	    g.appendChild(bgrect);
		bgrect.setAttributeNS(null, "fill", "none");
		bgrect.setAttributeNS(null, "x", 0);
		bgrect.setAttributeNS(null, "y", 0);
		bgrect.setAttributeNS(null, "width", realWidth);
		bgrect.setAttributeNS(null, "height", realHeight);
		bgrect.setAttributeNS(null, "fill-opacity", .5);



		var mousePushed = false;

		var pathString;
		var svgPath;


	    dc.svgelmt.addEventListener("mousedown", function(e){
	    	console.log("black mouse down!!!!!!!!!!")
	    	pathString = "M " + e.offsetX/dc.viewScaleW + "," + (dc.viewShiftH + e.offsetY/dc.viewScaleH) + " "
	       	svgPath = document.createElementNS(static_xmlns, "path");
	       	g.appendChild(svgPath);
	       	svgPath.setAttributeNS(null, "stroke", dc.strokeStyle);
	       	svgPath.setAttributeNS(null, "stroke-width", 1);
	       	svgPath.setAttributeNS(null, "fill", "none");
	       	svgPath.setAttributeNS(null, "d", pathString);

	    	mousePushed=true;

	    });

	    dc.svgelmt.addEventListener("mousemove", function(e){
	    	if (mousePushed){
	    		console.log("mouse move!")
		    	pathString += "L " + e.offsetX/dc.viewScaleW + "," + (dc.viewShiftH + e.offsetY/dc.viewScaleH) + " ";
		    	svgPath.setAttributeNS(null, "d", pathString);
		    	//console.log("pathString is " + pathString);
		    }
	    });

	    dc.svgelmt.addEventListener("mouseup", function(e){
	    	console.log("mouseup!!!!!!!!!!!!")
	    	pathString += "L " + e.offsetX/dc.viewScaleW + "," + (dc.viewShiftH + e.offsetY/dc.viewScaleH) + " ";
	    	svgPath.setAttributeNS(null, "d", pathString);
	    	mousePushed=false;
	    });

	    dc.scale = function(ws, hs){
	    	var bbw = realWidth;//dc.svgelmt.getBBox().width;
	    	var bbh = realHeight;// dc.svgelmt.getBBox().height
	    	ws = ws || 1;
	    	hs = hs || 1;
	    	dc.viewScaleW = ws;
	    	dc.viewScaleH = hs;
	    	dc.viewShiftH = bbh-bbh/hs;  // when we scale vertically, we also shift because of the upuside down coords. 

	    	dc.svgelmt.setAttributeNS(null, "viewBox", 0  + " " + dc.viewShiftH + " " + bbw/ws + " " + bbh/hs);

	    }

	    dc.scale(dc.viewScaleW, dc.viewScaleH);
	    dc.svgCanvasDiv.appendChild(dc.svgelmt);

		return dc;
	}
});