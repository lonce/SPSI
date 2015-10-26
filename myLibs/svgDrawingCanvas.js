define(
["../myLibs/utils"],
function(utils){
	// The svg namespace
	var static_xmlns = "http://www.w3.org/2000/svg";

	return function(id, iwidth, iheight){ // id is a id for an svg element on the html DOM that has been sized already
		// The object returned by this factory method
		var dc={
			svgCanvasDiv : document.getElementById(id),
			svgelmt  : document.createElementNS("http://www.w3.org/2000/svg", "svg"),
			strokeStyle :  "#00FFFF",
			lineWidth : 1,
			hCanvas : null,
			backgroundColor :  "black",
			viewScaleW : 1,
			viewScaleH : 1,
			viewShiftW : 0,
			viewShiftH : 0,
			clear : function () { var c = dc.svgelmt; while (c.firstChild) { c.removeChild(c.firstChild); }}

		};

		dc.svgelmt.id="isvgObj";
		dc.svgelmt.style.position = "absolute";
		dc.svgelmt.style.top = 0;
		

		dc.svgelmt.setAttributeNS(null, "width", iwidth);
		dc.svgelmt.setAttributeNS(null, "height", iheight);
		// so we can scale in whatever dimension we want later.
		dc.svgelmt.setAttributeNS(null, "preserveAspectRatio", "none");


		var svgCanvasWidth=dc.svgelmt.width.baseVal.value;
		var svgCanvasHeight=dc.svgelmt.height.baseVal.value;

		bgrect=document.createElementNS(static_xmlns,"rect");
	    dc.svgelmt.appendChild(bgrect);
		bgrect.setAttributeNS(null, "fill", "none");
		bgrect.setAttributeNS(null, "x", 0);
		bgrect.setAttributeNS(null, "y", 0);
		bgrect.setAttributeNS(null, "width", svgCanvasWidth);
		bgrect.setAttributeNS(null, "height", svgCanvasHeight);
		bgrect.setAttributeNS(null, "fill-opacity", .5);



		var mousePushed = false;

		var pathString;
		var svgPath;


	    dc.svgelmt.addEventListener("mousedown", function(e){
	    	console.log("black mouse down!!!!!!!!!!")
	    	pathString = "M " + e.offsetX/dc.viewScaleW + "," + (dc.viewShiftH + e.offsetY/dc.viewScaleH) + " "
	       	svgPath = document.createElementNS(static_xmlns, "path");
	       	dc.svgelmt.appendChild(svgPath);
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
	    	var bbw = dc.svgelmt.getBBox().width;
	    	var bbh = dc.svgelmt.getBBox().height
	    	ws = ws || 1;
	    	hs = hs || 1;
	    	dc.viewScaleW = ws;
	    	dc.viewScaleH = hs;
	    	dc.viewShiftH = bbh-bbh/hs;  // when we scale vertically, we also shift because of the upuside down coords. 

	    	dc.svgelmt.setAttributeNS(null, "viewBox", 0  + " " + dc.viewShiftH + " " + bbw/ws + " " + bbh/hs);

	    }


	    dc.svgCanvasDiv.appendChild(dc.svgelmt);

		return dc;
	}
});