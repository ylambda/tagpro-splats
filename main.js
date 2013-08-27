(function() {

  var ext = {};
  var store = ext.store = chrome.storage.local;

  ext.emit = emit;
  ext.listen = listen;
  ext.saved = false;
  ext.game = {
    splats: []
  };

  // Setup the data
  ext.listen('map', function (data) {
    var game = ext.game;

    game.splats = data.splats || game.splats;

    // game.tiles = data.tiles;
    game.map = data.info.name || 'Untitled';
    game.author = data.info.author || 'Unknown';

    game.port = window.location.port;
    game.server = window.location.hostname.split('.')[0].split('-')[1];

    game.joined = Date.now();
    game.gameEndsAt = game.gameEndsAt || null;
  })

  // Add incoming splats
  ext.listen('splat', function (splat) {
    ext.game.splats.push(splat)
  });

  // Register the expected end time
  ext.listen('time', function(data) {
    ext.game.gameEndsAt = new Date(Date.now() + data.time).getTime();
  })

  // Game is over, save everything
  ext.listen('end', function(){ save() });

  // Save if we haven't already
  ext.listen('save', save);
  ext.listen('beforeunload', save);
  function save() {
    if(ext.saved)
      return;

    var game = ext.game;

    if(!game.server || !game.gameEndsAt)
      return;

    // set game id
    game.id = [game.server, game.port, game.map, game.gameEndsAt].join(':')
    game.id = game.id.slice(0,-3); // ignore milliseconds

    // save
    console.log('saving...');

    var data = {};
    data[game.id] = game;
    store.set(data);

    ext.saved = true;
  }

  // clear local store
  ext.listen('clear', function(){
    console.log('clearing...')
    store.clear();
  });

  // log the given key
  ext.listen('get', function(key) {
    store.get(key, function(res) {
      console.log(res)
    });
  });

  // log extension info
  ext.listen('info', function() {
    console.log(ext);
  });

  ext.listen('export', function(search) {
    if(search == null)
      search = new RegExp('.*')
    
    if(typeof search == 'string')
      search = new RegExp(search);

    store.get(null, function(res) {
      var result;
      var maps = [];

      // Find all matching map names
      Object.keys(res).forEach(function(key) {
        if(search.exec(key) === null)
          return;

        var tokens = key.split(':');
        var name = tokens[2];
        if(maps.indexOf(name) < 0)
          maps.push(name)
      })

      result = maps.map(function(name){
        return {name: name, splats: reduceByName(name)};
      })

      window.open('data:text/html;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(result))
      );

      function reduceByName(name){
        var splats = Object.keys(res).filter(function(key) {
          if(search.exec(key) && key.match(name))
            return true;
        }).map(function(key) {
          return res[key].splats;
        }).reduce(function(prev, cur) {
          return prev.concat(cur);
        }, [])
        return splats;
      }
    })
  })

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