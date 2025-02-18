'use strict'

import { PassThrough } from 'stream'
import { map, flatten, sortBy, take } from 'lodash'
import { defer, all } from 'q'
import FeedParser from 'feedparser'
import request from 'request'
import RSS from 'rss'

function getEntries (feedConfig, url) {
  const deferred = defer()
  const fp = new FeedParser()

  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36'
  const successfulFetchCallback =
    feedConfig.successfulFetchCallback || function (stream) {}

  const req = request(url, { uri: url, timeout: 60000 })

  req.setMaxListeners(200)
  req.setHeader('user-agent', userAgent)
  req.setHeader('accept', 'text/html,application/xhtml+xml')

  req.on('error', function () {
    deferred.resolve(null)
  })

  req.on('response', function (res) {
    const pass = new PassThrough()
    if (res.statusCode !== 200) {
      deferred.resolve(null)
    }
    let output = ''
    pass.on('data', data => {
      output += data
    })
    pass.on('end', () => successfulFetchCallback({ url, stream: output }))

    req.pipe(pass).pipe(fp)
  })

  fp.on('error', function () {
    deferred.resolve([])
  })

  const items = []
  fp.on('readable', function () {
    const stream = fp
    let item

    while ((item = stream.read())) {
      item.meta = fp.meta
      items.push(item)
    }
  })

  fp.on('end', function () {
    deferred.resolve(items)
  })

  return deferred.promise
}

function sortEntries (entry) {
  if (entry) {
    const pubdate = parsePubDate(entry)
    const date = new Date(pubdate)
    const time = date.getTime()
    return time * -1
  } else {
    return null
  }
}

function parsePubDate (entry) {
  if ('pubdate' in entry && !!entry.pubdate) return entry.pubdate
  if ('a10:updated' in entry && !!entry['a10:updated']) { return entry['a10:updated']['#'] }
  if ('atom:updated' in entry && !!entry['atom:updated']) { return entry['atom:updated']['#'] }
  return undefined
}

function createFeed (feedConfig, entries) {
  const newFeed = new RSS(feedConfig)

  for (let i = 0; i < entries.length; i++) {
    const thisEntry = entries[i]
    if (thisEntry === null) continue

    const customElements = []

    const keys = Object.keys(thisEntry)

    keys.forEach(key => {
      const ns = key.split(':')
      if (
        ns.length === 2 &&
        ns[0] !== 'media' &&
        feedConfig.custom_namespaces !== undefined &&
        ns[0] in feedConfig.custom_namespaces
      ) {
        const element = {}
        if (typeof thisEntry[key]['#'] === 'string') {
          element[key] = thisEntry[key]['#']
        }
        customElements.push(element)
      }
    })

    if (thisEntry['media:group']) {
      customElements.push({
        'media:group': [
          { 'media:title': thisEntry['media:group']['media:title']['#'] },
          {
            'media:content': {
              _attr: {
                url: thisEntry['media:group']['media:content']['@'].url,
                type: thisEntry['media:group']['media:content']['@'].type,
                width: thisEntry['media:group']['media:content']['@'].width,
                height: thisEntry['media:group']['media:content']['@'].height
              }
            }
          },
          {
            'media:thumbnail': {
              _attr: {
                url: thisEntry['media:group']['media:thumbnail']['@'].url,
                width: thisEntry['media:group']['media:thumbnail']['@'].width,
                height: thisEntry['media:group']['media:thumbnail']['@'].height
              }
            }
          },
          {
            'media:description':
              thisEntry['media:group']['media:description']['#']
          },
          {
            'media:community': [
              {
                'media:starrating': {
                  _attr: {
                    count:
                      thisEntry['media:group']['media:community'][
                        'media:starrating'
                      ]['@'].count,
                    average:
                      thisEntry['media:group']['media:community'][
                        'media:starrating'
                      ]['@'].average,
                    min: thisEntry['media:group']['media:community'][
                      'media:starrating'
                    ]['@'].min,
                    max: thisEntry['media:group']['media:community'][
                      'media:starrating'
                    ]['@'].max
                  }
                }
              }
            ]
          }
        ]
      })
    }

    const item = {
      title: thisEntry.title,
      description: thisEntry.title,
      url: thisEntry.link,
      guid: thisEntry.guid,
      categories: thisEntry.categories,
      author: thisEntry.author || thisEntry.meta.author || thisEntry.meta.title,
      date: parsePubDate(thisEntry),
      custom_elements: customElements
    }

    newFeed.item(item)
  }
  return newFeed
}

function combine (feedConfig) {
  let deferred = {}
  let err = null
  deferred = defer()

  if (!feedConfig.feeds || feedConfig.feeds.length === 0 || !feedConfig.size) {
    err = new Error('Feeds and size are required feedConfig values')
  }

  if (
    !!feedConfig.successfulFetchCallback === true &&
    typeof feedConfig.successfulFetchCallback !== 'function'
  ) {
    err = new Error('successfulFetchCallback must be a function')
  }

  if (err == null) {
    if (!feedConfig.generator) {
      feedConfig.generator = 'Libraries at home feed combiner'
    }

    if (!feedConfig.link) {
      feedConfig.link = 'https://www.librariesathome.co.uk/'
    }

    // Strip properties 'feeds' and 'size' from config to be passed to `rss` module
    const strippedConfig = {}
    for (const k in feedConfig) {
      if (k !== 'feeds' && k !== 'size') strippedConfig[k] = feedConfig[k]
    }

    all(
      map(feedConfig.feeds, function (feed) {
        return getEntries(feedConfig, feed)
      })
    )
      .then(flatten)
      .then(function (entries) {
        return sortBy(entries, sortEntries)
      })
      .then(function (entries) {
        return take(entries, feedConfig.size)
      })
      .then(function (entries) {
        return createFeed(strippedConfig, entries)
      })
      .then(function (createdFeed) {
        deferred.resolve(createdFeed)
      })
  } else {
    deferred.reject(err)
  }

  return deferred.promise
}

export default combine
