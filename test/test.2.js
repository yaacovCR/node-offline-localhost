var o = require ('..').ifOffline();

var dns = require ('dns');

dns.lookup('localhost', { hints: dns.ADDRCONFIG }, function(err, address, family) {
  if (err) console.log(err);
  else {
    console.log(address);
    console.log(family);
  }
});