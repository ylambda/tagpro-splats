lamb = (function(lamb) {

  // This script is injected into the page
  // It simply passes messages to the chrome extension
  // using the `emit` function.

  // Force extension to save data
  lamb.save = function() {
    emit('save')
  }

  // Dump info
  lamb.info = function() {
    emit('info');
  }

  // Read a key from LocalStorage
  lamb.get = function(keys) {
    emit('get', keys);
  }

  // Clear the database
  lamb.clear = function() {
    emit('clear');
  }

  // Pass tagpro events to the extension
  if(tagpro.socket) {
    tagpro.socket.on('splat', function(data) {
      emit('splat', data);
    });
    
    tagpro.socket.on('map', function(data) {
      emit('map', data);
    })

    tagpro.socket.on('time', function(data) {
      emit('time', data);
    })

    tagpro.socket.on('end', function(data) {
      emit('save')
    })
  }

  function emit(event, data){
    var e = new CustomEvent(event, {detail: data});
    window.dispatchEvent(e);
  }

  return lamb;
}(window.lamb || {}))