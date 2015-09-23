// This module returns a "factory" for creating svg displays.
// Pass the factory DOM aelement id that has been sized already in CSS
define(
	["../myLibs/utils"],
	function(utils){
		// The svg namespace
		var static_xmlns = "http://www.w3.org/2000/svg";

		return function(id){ // id is a id for an svg element on the html DOM that has been sized already
			// The object returned by this factory method
			audioDisplay={};

			var svgelmt;  // from the DOM
			var ctx;
			var backgroundColor="#000000";
			var cHeight, cWidth;

			// will hold the svg path string representing the waveform
			var svgWaveform = document.createElementNS(static_xmlns, "path");

			// ---------- Public -----------------------------------------------------------

			// Compute a pathstring for svgWaveform from the signal for display
			audioDisplay.show=function(sig){
				// for now, fit sig into the width of the display
				var resamp = resample(sig, cWidth);
				var pIndex;
				var pathString;

				svgWaveform.setAttributeNS(null, "stroke", "green");
				// Map signal [-1,1] to display [cHeight, 0] 
				pathString="M"+ 0 + ","+ utils.map(resamp[0], -1, 1, cHeight, 0)  +  " ";
				for (var i=1;i<cWidth;i++){
					pathString=pathString.concat("L"+ i + ","+ utils.map(resamp[i], -1, 1, cHeight, 0) + " ");
				}
				//console.log("pathString is " + pathString); // svgPath that will be drawn
 				svgWaveform.setAttributeNS(null, "d", pathString);
			}

			// ------- Private ----------------------------------------------------------------
			// Grab numPoints evenly spaced samples (interpolated) from whole of sig
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

			// Initialize the display with a background and the empty waveform
			svgelmt=document.getElementById(id);
			cWidth=svgelmt.width.baseVal.value;
			cHeight=svgelmt.height.baseVal.value;

		    bgrect=document.createElementNS(static_xmlns,"rect");
		    svgelmt.appendChild(bgrect);
    		bgrect.setAttributeNS(null, "fill", backgroundColor);
			bgrect.setAttributeNS(null, "x", 0);
			bgrect.setAttributeNS(null, "y", 0);
			bgrect.setAttributeNS(null, "width", cWidth);
			bgrect.setAttributeNS(null, "height", cHeight);

			svgelmt.appendChild(svgWaveform);  // keep it on the svgelmt; just change its path attribute

			return audioDisplay;
		}
	}
);
