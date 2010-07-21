A Bittorrent client written in JavaScript on top of node.js

I think it works. It can download a small file and the md5sum of the output will match. However, I haven't tested it in a real world scenario (eg. Ubuntu iso) successfully (The last time I tried was before I added piece verification, which was probably the reason it didn't work before).

So hopefully. This is a working client. Though I have no idea if peers connecting to you works. Or if it can traverse proxies, or do any awesome stuff