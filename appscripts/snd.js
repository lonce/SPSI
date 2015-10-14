define(
	[],
function(){

	var audioCtx = new AudioContext();

	return function (audioBuf){
		var snd = {
			aBuf : audioBuf,
			srcNode : null
		};

		snd.farray2Buf=function(farray){
			snd.aBuf=audioCtx.createBuffer(1, farray.length, 44100);
			var nowBuffering = snd.aBuf.getChannelData(0);
			for(var i=0;i<farray.length;i++){
				nowBuffering[i]=farray[i];
			}
		}

		snd.getChannelData = function(n){
			snd.aBuf.getChannelData(n);
		}

		snd.loadBufferSrc = function(){
			snd.srcNode=audioCtx.createBufferSource();
			snd.srcNode.buffer=snd.aBuf;
			snd.srcNode.connect(audioCtx.destination);	
		}

		snd.play = function(){
			snd.loadBufferSrc();
			if (snd.srcNode!=null){
				snd.srcNode.start();
			}else{
				console.log("Sound buffer not initialized yet");
			}
		}

		snd.stop = function(){
			if (snd.srcNode!=null){
				snd.srcNode.stop();
			}
		}

		return snd;
	}
});
