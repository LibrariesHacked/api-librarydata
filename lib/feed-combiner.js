'use strict';

const { PassThrough } = require('stream');
var _ = require('lodash');
var Q = require('q');
var FeedParser = require('feedparser');
var request = require('request');
var RSS = require('rss');

function getEntries(feedConfig, url) {
  var deferred = Q.defer();
  var fp = new FeedParser();

  var userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36';
  var successfulFetchCallback = feedConfig.successfulFetchCallback || function (stream) { };

  var req = request(url, { uri: url, timeout: 60000 });

  req.setMaxListeners(200);
  req.setHeader('user-agent', userAgent);
  req.setHeader('accept', 'text/html,application/xhtml+xml');

  req.on('error', function (err) {
    deferred.resolve(null);
  });

  req.on('response', function (res) {
    let pass = new PassThrough;
    if (res.statusCode !== 200) {
      var err = new Error('Bad response %d', res.statusCode);
      deferred.resolve(null);
    }
    let output = "";
    pass.on('data', data => output += data)
    pass.on('end', () => successfulFetchCallback({ url: url, stream: output }))

    req.pipe(pass).pipe(fp);
  });

  fp.on('error', function (err) {
    deferred.resolve([]);
  });

  var items = [];
  fp.on('readable', function () {
    var stream = fp;
    var item;

    while ((item = stream.read())) {
      item.meta = fp.meta;
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
  if ('pubdate' in entry && !!entry.pubdate) return entry.pubdate;
  if ('a10:updated' in entry && !!entry['a10:updated']) return entry['a10:updated']["#"];
  if ('atom:updated' in entry && !!entry['atom:updated']) return entry['atom:updated']["#"];
  return undefined;
}

function createFeed(feedConfig, entries) {
  var newFeed = new RSS(feedConfig);

  for (var i = 0; i < entries.length; i++) {
    let thisEntry = entries[i];
    if (thisEntry === null) continue;

    let custom_elements = [];

    let keys = Object.keys(thisEntry);

    keys.forEach(key => {
      let ns = key.split(':');
      if (ns.length == 2 && ns[0] != 'media' && feedConfig.custom_namespaces !== undefined && ns[0] in feedConfig.custom_namespaces) {
        var element = {};
        if (typeof (thisEntry[key]["#"]) === "string") {
          element[key] = thisEntry[key]["#"];
        }
        custom_elements.push(element);
      }
    });

    if (thisEntry['media:group']) {
      custom_elements.push({
        'media:group': [
          { 'media:title': thisEntry['media:group']['media:title']['#'] },
          {
            'media:content': {
              _attr: {
                'url': thisEntry['media:group']['media:content']['@']['url'],
                'type': thisEntry['media:group']['media:content']['@']['type'],
                'width': thisEntry['media:group']['media:content']['@']['width'],
                'height': thisEntry['media:group']['media:content']['@']['height'],
              }
            }
          },
          {
            'media:thumbnail': {
              _attr: {
                'url': thisEntry['media:group']['media:thumbnail']['@']['url'],
                'width': thisEntry['media:group']['media:thumbnail']['@']['width'],
                'height': thisEntry['media:group']['media:thumbnail']['@']['height'],
              }
            }
          },
          { 'media:description': thisEntry['media:group']['media:description']['#'] },
          {
            'media:community': [
              {
                'media:starrating': {
                  _attr: {
                    'count': thisEntry['media:group']['media:community']['media:starrating']['@']['count'],
                    'average': thisEntry['media:group']['media:community']['media:starrating']['@']['average'],
                    'min': thisEntry['media:group']['media:community']['media:starrating']['@']['min'],
                    'max': thisEntry['media:group']['media:community']['media:starrating']['@']['max'],
                  }
                }
              },
            ]
          },
        ]
      });
    }

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

function combine(feedConfig) {
  var deferred = {};
  var err = null;
  deferred = Q.defer();

  if (!feedConfig.feeds || feedConfig.feeds.length === 0 || !feedConfig.size) {
    err = new Error('Feeds and size are required feedConfig values');
  }

  if (!!feedConfig.successfulFetchCallback == true && typeof (feedConfig.successfulFetchCallback) !== 'function') {
    err = new Error('successfulFetchCallback must be a function');
  }

  if (err == null) {
    if (!feedConfig.generator) {
      feedConfig.generator = 'Libraries at home feed combiner';
    }

    if (!feedConfig.link) {
      feedConfig.link = 'https://www.librariesathome.co.uk/';
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