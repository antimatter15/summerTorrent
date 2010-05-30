A Bittorrent client written in JavaScript on top of node.js

*Status:* SummerTorrent doesn't actually work yet. And I've stopped active development. Feel free to fork it or strip mine it for ideas.

*What I learned:*

* Incremental development in JavaScript / node.js is pretty nice!
* Eclipse is a pretty good Javascript IDE. It's very helpful to catch syntax errors.
* The node.js continuation passing style is not too hard to use for writing Bittorrent clients.
* The node network library is immature compared to the go network library. For example, no UDP support and no automatic redirect handling.

*Why I stopped development:*

* I got busy.
* I got bored.
* I got burned out.
* The next step is to implement the high level bit torrent logic, and that wasn't exciting to do a second time. A better approach
  would be to port the Python BitTorrent client code, but that is also a big job and not that interesting to me.

*Introduction*

SummerTorrent is intended to be a full-fledged command-line-based client, similar
to http://github.com/jackpal/Taipei-Torrent.

This is in contrast to http://github.com/WizKid/node-bittorrent ,
which is currently more of a bitTorrent seeder than a full bitTorrent client.


*Implemented features:*

+ Parse .torrent files.
+ Scan disk to compute good/bad pieces for data files.
+ Request peer list from tracker.
+ Parse tracker response.
+ Connect to peers.
+ Initial peer header exchange.
+ Create directories for multi-file torrents.

*TODO:*

- UPNP open a port for listening for peers.
- socks proxy support.
- Handle redirects from trackers.
- Listen for peers.
- Handle peer requests.
- Decide which pieces to request.
- Exchange data with peers.
- Use Buffers instead of binary strings.
