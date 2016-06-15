define(
	["../myLibs/FileSaver.req"],
	function (fileSaver ) {
		return function (blob){
			//var blob = new Blob([dataURL]);
			//console.log("now save blob");
			var foo = new fileSaver(blob);
		}
	}
);


