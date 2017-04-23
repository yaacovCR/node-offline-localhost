# node-offline-localhost

## Description

A small package that enables use of the "localhost" host name on Node.js even when offline. This functionality is currently not available on some Node.js platforms as detailed below. This package provides an easy-to-use work-around.

## Usage

Include one of the following code snippets at the beginning of your application startup portion:
```javascript
// enable offline localhost across the board (carries potential performance penalty when online)
require('node-offline-localhost').always();

// enable offline localhost if offline (still requires offline check with every call to net.connect)
require('node-offline-localhost').ifOffline();

// enable offline localhost if offline at startup
require('node-offline-localhost').ifOfflineAtStartUp();

// enable offline localhost in development
if (process.env.NODE_ENV === 'development') {
  require('node-offline-localhost').always();
}
```

## Rationale

Currently, use of the `localhost` host name on Node.js is unreliable; when offline, `localhost` will not always resolve to `127.0.0.1` or `::1`, for example, on various versions of Windows.

This behavior appears to stem from platform specific implementations of the `getaddrinfo` function, or, more specifically, the [`AI_ADDRCONFIG` flag passed by `net.connect`](https://github.com/nodejs/node/blob/master/lib/net.js#L1012) to [`dns.connect`](https://github.com/nodejs/node/blob/master/lib/dns.js#L121). The `AI_ADDRCONFIG` flag can be used to make the `getaddrinfo` function more performant by excluding IPv4 or IPv6 addresses from the list returned by the function if the local system has no IPv4 or IPv6 addresses configured, respectively. This functionality, as specified by [RFC 3493](https://www.ietf.org/rfc/rfc3493.txt) has the possibly unintentional side effect of disabling the `getaddrinfo` function entirely if the local system has no IP addresses whatsoever configured, i.e. if the system is offline. This renders all `localhost` addresses nonfunctional when the local system is offline.

* An active Node.js [issue](https://github.com/nodejs/node/issues/11320) describes exactly this occurrence in Windows and requests a fix for the Windows version of Node.js. A prior version of this [issue](https://github.com/nodejs/node-v0.x-archive/issues/25489) suggests full disabling of the `AI_ADDRCONFIG` flag, an approach adopted by the Chromium team [on Windows](https://chromium.googlesource.com/chromium/src/net/+/e80513ca05b7aae855297e09748c76686bdad9ab/dns/host_resolver_proc.cc#156) to deal with this same issue. Inter alia, the Chromium selectively disables AI_ADDRCONFIG [for Linux](https://chromium.googlesource.com/chromium/src/net/+/e80513ca05b7aae855297e09748c76686bdad9ab/dns/host_resolver_proc.cc#184) if the browser is determined to be offline.
* The Fedora project [discusses](https://fedoraproject.org/wiki/QA/Networking/NameResolution/ADDRCONFIG) the problems engendered by `AI_ADDRCONFIG` in depth and the paucity of good solutions. Essentially, attempting to determine whether `getaddrinfo` should return only IPv4 or IPv6 addresses is not best accomplished by the existence of a non-loopback address because of a plethora of edge cases poorly-defined by RFC 3493.
* Meanwhile, issues/StackOverflow questions abound for multiple Node.js projects, including [Mongoose](http://stackoverflow.com/questions/29178484/mongoose-cant-connect-without-internet), [MongoDB](http://stackoverflow.com/questions/29178484/mongoose-cant-connect-without-internet), [karma](https://github.com/karma-runner/karma/issues/2050), [karma-growl-reporter](https://github.com/karma-runner/karma-growl-reporter/issues/20), [node-inspector](https://github.com/node-inspector/node-inspector/issues/645), particularly with regard to Windows. Windows applications themselves, it should be mentioned, such as `ping.exe`, for example, do allow use of `localhost` while offline.
* The Node.js fix of least harm would appear to adopt the Chromium team's approach on Linux, where if no remote interface is configured, `AI_ADDRCONFIG` is disabled. This, however, may potentially break any package that relies on the letter of RFC 3493. A silly example would be a package that uses failure of dns.connect for `localhost` to essentially test to see whether the local system is offline.
* This package attempts to provide users with the opportunity to purposefully disable `AI_ADDRCONFIG` for all packages within their application until such time as RFC 3493 is iterated/use of `AI_ADDRCONFIG` by Node.js is altered.