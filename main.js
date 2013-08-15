(function() {

   var ext = {};
   var store = ext.store = chrome.storage.local;

   ext.emit = emit;
   ext.listen = listen;
   ext.merged = false;

  // Begin storing info
  // Mapname, author, tiles, splats
  // The port and server are used to help determine
  // if this game has already been joined before
  // e.g. hitting refresh
  ext.listen('map', function (data) {
    var g = ext.game = {};

    ext.port = window.location.port;
    ext.map = data.info.name || 'Untitled';
    ext.server = window.location.hostname.split('.')[0].split('-')[1];

    g.map = ext.map;
    g.port = ext.port;
    g.tiles = data.tiles;
    g.author = data.info.author || 'Unknown';
    g.server = ext.server;
    g.joined = Date.now();
    g.splats = data.splats;
    g.gameEndsAt = g.gameEndsAt || null;
  })

  // TODO: handle multiple splats?
  ext.listen('splat', function (splat) {
    ext.game.splats.push(splat)
  });

  // This is when the game will end.
  // This time is used later when trying to merge unmerged map data
  // If there are unmerged maps, and they are older than this time
  // then the game is over and it's safe to merge.
  ext.listen('time', function(data) {
    var g = ext.game = ext.game || {};
    g.gameEndsAt = new Date(Date.now() + data.time).getTime();
  })

  // Game has ended - usually because a team has scored
  // enough goals.
  // It is safe to merge - so we do it now
  ext.listen('end', function(){
    console.log('ended')
    ext.merge(ext.game);
    ext.merged = true;
  })

  ext.listen('save', save);  // force save
  ext.listen('beforeunload', save); // before leaving the page
  function save() {
    console.log('saving..')
    var g = ext.game;
    if(!g.server || !g.gameEndsAt) return;
    // set game id - ignore milliseconds
    // I'm trying to make a way to identify a game
    // I use the gameEndsAt, but I ignore the milliseconds because it's not exact..
    // Time is critical for identification
    g.id = [g.server, g.port, g.map, g.gameEndsAt].join(':').slice(0,-3);

    // I don't even want to read this...
    // ugh
    // I think im trying to go through all the unmerged data
    // look for games that can safely be merged and merge them
    // I'm also looking for the current game to see if I have old data
    // e.g. refreshing
    store.get('unmerged', function(res) {
      var saved = false;
      var unmerged = res.unmerged || [];
      unmerged.forEach(function(game, index){
        if(game.gameEndsAt < Date.now() && game.id !== g.id) {
          console.log('merging past game')
          ext.merge(game);
          unmerged.splice(index, 1);
        } else if(game.id === g.id && !ext.merged) {
          console.log('replacing old game')
          unmerged[index] = g;
          saved = true;
        }
      })

      // add to the unmerged stack if no old data is found
      if(!saved && !ext.merged)
        unmerged.push(g)

      // save all the unmerged data
      store.set({unmerged: unmerged}, function(){
        console.log('store updated');
      });
    });
  }

  // This is the function that's fucked up
  // Something in here is wrong
  // but the idea here is to merge all the splats for a map
  // I split it up by server, but that wasn't necessary
  // A splat has an x,y coord. If there is another splat with the
  // same coord, then just bump the count up.

  ext.merge = function(game) {
    var mapkey = [game.server, game.map].join(':');
    store.get(mapkey, function(map){
      if(!Object.keys(map).length) {
        console.log('Creating new map entry')
        map.name = game.name;
        map.author = game.author;
        map.splats = {};
        map.tiles = game.tiles;
        map.server = game.server;
        map.merges = 0;
      }

      // merge the splats
      game.splats.forEach(function(s){
        var coord = s.x+','+s.y;
        if(!map.splats[coord])
          map.splats[coord] = 0;
        map.splats[coord] += 1;
      });

      map.merges += 1;

      var d= {};
      d[mapkey] = map;
      store.set(d, function(){
        console.log('Merged data')
      });
    })
  }

  // clear local storage
  ext.listen('clear', function(){
    console.log('clearing...')
    store.clear();
  });

  // log the given key
  ext.listen('get', function(key) {
    store.get(key, function(res) {
      console.log(res);
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
    document.body.appendChild(script);
  }

  function removeScript() {
    this.parentNode.removeChild(this);
  }


  var scripts = ["js/splats.js"];
  scripts.forEach(injectScript);

})();