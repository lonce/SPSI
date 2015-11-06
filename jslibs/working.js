define(
[],
  function(){
    var wait = {
        loading : function(textid){
          var over = document.createElement('div');
          over.id="overlay";
          over.innerHTML='<h4>' + textid + '</h4> <img id="loading" src="resources/spin712.gif">'  
          var foo = document.getElementsByTagName('body')[0];
          foo.appendChild(over);
        },
        done:  function(){
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

