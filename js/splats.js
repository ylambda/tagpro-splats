lamb = (function(lamb) {

  // This script is injected into the page
  // It simply passes messages to the chrome extension
  // using the `emit` function.

  init();
  function init () {
    if (window.tagpro && tagpro.socket) {   
      return registerListeners();
    }
    
    setTimeout(init, 1);
  }

  // Pass tagpro events to the extension
  function registerListeners() {
    tagpro.socket.on('end',   function(data) { emit('end')          });
    tagpro.socket.on('map',   function(data) { emit('map', data)    });
    tagpro.socket.on('time',  function(data) { emit('time', data)   });
    tagpro.socket.on('splat', function(data) { emit('splat', data)  });
  }

  // Force extension to save
  lamb.save = function() { emit('save') };

  // Log extension info
  lamb.info = function() { emit('info') };

  // Read a key from local store
  lamb.get = function(keys) { emit('get', keys) };

  // Clear the database
  lamb.clear = function() { emit('clear') };


  function emit(event, data){
    var e = new CustomEvent(event, {detail: data});
    window.dispatchEvent(e);
  }

  return lamb;

}(window.lamb || {}))