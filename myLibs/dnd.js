define(
function(){

	// idropTarget - an html element that will handle the drops
	// cb - the function to call with an audioBuff arg when the file is loaded and the data converted
	return function (idropTarget, cb){

		var dnd={
			dropTarget : idropTarget,
			handlers : {
				drop: function(e){
					dnd.toggleActive(e, false);
					if (e.dataTransfer.files.length) {
						console.log("Begin file decode.");
						loadBlob(e.dataTransfer.files[0]);
					} else {
					console.log("Error, not a file.");
					}
				},
				dragover: function(e){
					dnd.toggleActive(e, true);
				},
				dragleave: function (e) {
					dnd.toggleActive(e, false);
				}
			},

			toggleActive : function(e, toggle){
				e.stopPropagation();
				e.preventDefault();
				if (toggle) {
					// if it isn't already classed as dragover
					if (dnd.dropTarget.className.indexOf('dragover') < 0){
						dnd.dropTarget.className+=(' dragover');
						console.log("dnd.dropTarget.className  is now " + dnd.dropTarget.className)
					}
				}else {
					// declass so that it won't respond to dragovers
					dnd.dropTarget.className.replace('dragover', '');
					console.log("dnd.dropTarget.className  is now " + dnd.dropTarget.className)
				}
			}

		}; // dnd object

		// initialize dropTarget with the handlers we've defined
		Object.keys(dnd.handlers).forEach(function(event){
			dnd.dropTarget.addEventListener(event, dnd.handlers[event]);
		});


		// load an audio file into an array buffer
		var loadBlob = function(blob){
			var reader = new FileReader();

			reader.addEventListener('load', function (e) {
				decodeArrayBuffer(e.target.result);
			});

			reader.readAsArrayBuffer(blob);
		};

		// decode to an audioBuffer and trigger the user callback
		var decodeArrayBuffer = function (arraybuffer) {
			var offlineAc = new OfflineAudioContext(1, 44100*40, 44100);

			offlineAc.decodeAudioData(arraybuffer, (function (audioBuf) {
				console.log("done with conversion -")
				cb(audioBuf);

			}));
		};
	}

});
