(function() {

   var ext = {};
   var store = ext.store = chrome.storage.local;

   ext.emit = emit;
   ext.listen = listen;
   ext.game = {splats: []};
   ext.saved = false;

  ext.listen('map', function (data) {
    var g = ext.game;

    ext.port = window.location.port;
    ext.map = data.info.name || 'Untitled';
    ext.server = window.location.hostname.split('.')[0].split('-')[1];

    g.map = ext.map;
    g.port = ext.port;
    g.tiles = data.tiles;
    g.author = data.info.author || 'Unknown';
    g.server = ext.server;
    g.joined = Date.now();
    g.splats = data.splats || [];
    g.gameEndsAt = g.gameEndsAt || null;
  })

  // TODO: handle multiple splats?
  ext.listen('splat', function (splat) {
    ext.game.splats.push(splat)
  });

  ext.listen('time', function(data) {
    var g = ext.game;
    g.gameEndsAt = new Date(Date.now() + data.time).getTime();
  })

  ext.listen('end', function(){
    console.log('ended')
    save();
  })

  ext.listen('save', save);
  ext.listen('beforeunload', save);
  function save() {
    var g = ext.game;
    if(ext.saved || !g || !g.server || !g.gameEndsAt) return;
    console.log('saving..')
    // set game id - ignore milliseconds
    g.id = [g.server, g.port, g.map, g.gameEndsAt].join(':').slice(0,-3);

    var data = {};
    data[g.id] = g;
    store.set(data);
    ext.saved = true;
  }

  // clear local storage
  ext.listen('clear', function(){
    console.log('clearing...')
    store.clear();
  });

  // log the given key
  ext.listen('get', function(key) {
    store.get(key, function(res) {
    });
  });

  // list info
  ext.listen('info', function(res) {
    console.log(ext);
  });

  function listen(event, listener) {
    window.addEventListener(event, function(e){
      listener(e.detail);
    });
  }

  function emit(event, data) {
    var e = new CustomEvent({detail: data});
    window.dispatchEvent(e);
  }

  function injectScript(path) {
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.src = chrome.extension.getURL(path);
    script.onload = removeScript;
    (document.head||document.documentElement).appendChild(script);
  }

  function removeScript() {
    this.parentNode.removeChild(this);
  }


  var scripts = ["js/splats.js"];
  scripts.forEach(injectScript);

})();