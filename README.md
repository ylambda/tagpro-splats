# tagpro-splats
Collect splat information while playing tagpro

### Useful console commands
To interact with the extension several commands are available through the developer console. This plugin uses the `lamb` namespace for all of it's commands.

#### lamb.get([key])
Use this to log the given key from local store. A `null` will list all.

#### lamb.info()
Use this to console.log all information about the extension at it's current state

#### lamb.export([map][, server])
Use this to export splat data to JSON. Giving an optional map and server will filter as appropriate

#### lamb.clear()
Clear the local storage

#### lamb.save()
Force save the current state of the extension. Not recommended.