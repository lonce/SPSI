define(
[],
  function(){
    var img1 = new Image;
    img1.onload = function() {
      console.log("image is loaded")
      console.log("size of dataURL image is " + img1.width + "," + img1.height)
    };
    img1.src ="resources/spin712.gif";


    var wait = {
        loading : function(textid, cb){
          var over = document.createElement('div');
          over.id="overlay";
          over.innerHTML='<h4>' + textid + '</h4>'; 
          over.appendChild(img1);
          var foo = document.getElementsByTagName('body')[0];
          foo.appendChild(over);
          console.log("child appended");
          setTimeout(function(){
            console.log("call cb")
            cb();
          },5000);
        },
        done:  function(){
          console.log("DONE");
          document.getElementById("overlay").remove();
        }

    };
    document.addEventListener('keyup', function(e){
      if (e.which === 27){
        wait.done();
      }
    });
    return wait;
});

