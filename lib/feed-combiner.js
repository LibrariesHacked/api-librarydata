'use strict';

const { PassThrough } = require('stream');
var _ = require('lodash');
var Q = require('q');
var FeedParser = require('feedparser');
var request = require('request');
var RSS = require('rss');

function getEntries(feedConfig, url) {
  var softFail = feedConfig.softFail || false;
  var deferred = Q.defer();
  var fp = new FeedParser();

  var userAgent = feedConfig.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36';
  var timeout = feedConfig.timeout || 10000;
  var successfulFetchCallback = feedConfig.successfulFetchCallback || function (stream) { };

  var req = request(url, {
    uri: url,
    timeout: timeout
  });

  req.setMaxListeners(200);
  req.setHeader('user-agent', userAgent);
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', function (err) {
    if (softFail) {
      deferred.resolve(null);
    } else {
      deferred.reject(err);
    }
  });
  req.on('response', function (res) {
    let pass = new PassThrough;
    if (res.statusCode !== 200) {
      var err = new Error('Bad response %d', res.statusCode);
      if (softFail) {
        deferred.resolve(null);
      } else {
        deferred.reject(err);
      }
    }
    let output = "";
    pass.on('data', data => output += data)
    pass.on('end', () => successfulFetchCallback({ url: url, stream: output }))

    req.pipe(pass).pipe(fp);
  });

  fp.on('error', function (err) {
    if (!softFail) {
      deferred.reject(err);
    } else {
      deferred.resolve([]);
    }
  });

  var items = [];
  fp.on('readable', function () {
    var stream = fp;
    var item;

    while ((item = stream.read())) {
      item.meta = fp.meta; // attach the feed data to every item.
      items.push(item);
    }
  });
  fp.on('end', function () {
    deferred.resolve(items);
  });

  return deferred.promise;
}

function sortEntries(entry) {
  if (entry) {
    var pubdate = parsePubDate(entry);
    var date = new Date(pubdate);
    var time = date.getTime();
    return time * -1;
  } else {
    return null;
  }
}

function parsePubDate(entry) {
  if ('pubdate' in entry && !!entry.pubdate) {
    return entry.pubdate;
  }
  if ('a10:updated' in entry && !!entry['a10:updated']) {
    return entry['a10:updated']["#"];
  }
  if ('atom:updated' in entry && !!entry['atom:updated']) {
    return entry['atom:updated']["#"];
  }

  return undefined;
}

function createFeed(feedConfig, entries) {
  var newFeed = new RSS(feedConfig);
  for (var i = 0; i < entries.length; i++) {
    var thisEntry = entries[i];
    if (thisEntry === null) continue;

    var custom_elements = [];
    var custom_entries = Object.keys(thisEntry).map(function (tag) {
      var ns = tag.split(':');
      if (ns.length == 2 && feedConfig.custom_namespaces !== undefined) {
        if (ns[0] in feedConfig.custom_namespaces) {
          var element = {};
          element[tag] = {};

          if (thisEntry["@"]) {
            element[tag]['_attr'] = thisEntry["@"];
          }

          if (tag in thisEntry && typeof (thisEntry[tag]["#"]) === "string") {
            element[tag]['_cdata'] = thisEntry[tag]["#"];
          }
          custom_elements.push(element);
        }
      }
    });

    var item = {
      title: thisEntry.title,
      description: thisEntry.title,
      url: thisEntry.link,
      guid: thisEntry.guid,
      categories: thisEntry.categories,
      author: thisEntry.author || thisEntry.meta.author || thisEntry.meta.title,
      date: parsePubDate(thisEntry),
      custom_elements: custom_elements
    };

    newFeed.item(item);
  }
  return newFeed;
}

function combine(feedConfig, callback) {
  var deferred = {};
  var err = null;
  if (callback) {
    deferred.resolve = function (feed) { callback(null, feed); }
    deferred.reject = function (err) { callback(err, null); }
  } else {
    deferred = Q.defer();
  }

  if (!feedConfig.feeds || feedConfig.feeds.length === 0 || !feedConfig.size) {
    err = new Error('Feeds and size are required feedConfig values');
  }

  if (!!feedConfig.successfulFetchCallback == true && typeof (feedConfig.successfulFetchCallback) !== 'function') {
    err = new Error('successfulFetchCallback must be a function');
  }

  if (err == null) {
    if (!feedConfig.generator) {
      feedConfig.generator = 'rss-combiner-ns for Node';
    }

    if (!feedConfig.link) {
      feedConfig.link = 'https://www.npmjs.com/package/rss-combiner-ns';
    }

    // Strip properties 'feeds' and 'size' from config to be passed to `rss` module
    var strippedConfig = {};
    for (var k in feedConfig) {
      if (k !== 'feeds' && k !== 'size') strippedConfig[k] = feedConfig[k];
    }

    Q
      .all(_.map(feedConfig.feeds, function (feed) {
        return getEntries(feedConfig, feed);
      }))
      .then(_.flatten)
      .then(function (entries) { return _.sortBy(entries, sortEntries) })
      .then(function (entries) { return _.take(entries, feedConfig.size) })
      .then(function (entries) { return createFeed(strippedConfig, entries) })
      .then(function (createdFeed) { deferred.resolve(createdFeed) });

  } else {
    deferred.reject(err);
  }

  return deferred.promise;
}

module.exports = combine;