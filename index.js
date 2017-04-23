'use strict';

var dns = require('dns');
var os = require('os');

function online() {
  var interfaces = os.networkInterfaces();
  for (var interf in interfaces) {
    var addresses = interfaces[interf];
    for (var i = 0; i < addresses.length; i++) {
      if (!(addresses[i].internal)) {
        return true;
      }
    }
  }
  return false;
}

function lookup(hostname, options, callback) {
  if (typeof options !== 'function' && options !== null && (options.hints & dns.ADDRCONFIG)) {
    options.hints &= ~dns.ADDRCONFIG;
  } 
  return dns._originalLookup(hostname, options, callback);
}

function always() {
  dns._originalLookup = dns.lookup;
  dns.lookup = lookup;
}  

function ifOffline() {
  dns._originalLookup = dns.lookup;
  dns.lookup = function(hostname, options,callback) {
    if (online()) {
      return dns._originalLookup(hostname, options, callback);
    } else {
      return lookup(hostname, options, callback);
    }
  };
}  

function ifOfflineAtStartUp() {
  if (!online()) {
    dns._lookupAllowingADDRCONFIG = dns.lookup;
    dns.lookup = lookup;
  }
}

module.exports = {
  always,
  ifOffline,
  ifOfflineAtStartUp
};