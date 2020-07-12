const RSSCombiner = require('../lib/feed-combiner')

module.exports.getFeedFromUrls = async (urls, title, customNamespaces) => {
  var feedConfig = {
    title: title,
    size: 100,
    feeds: urls,
    pubDate: new Date(),
    custom_namespaces: customNamespaces
  }
  var feed = await RSSCombiner(feedConfig)
  return feed
}

module.exports.getYouTubeFeedUrlFromId = (id) => {
  const youTubeUrl = process.env.YOUTUBE_FEED_URL
  const idTypes = {
    UC: 'channel_id',
    PL: 'playlist_id'
  }
  return youTubeUrl + (idTypes[id.substring(0, 2)] || 'user') + '=' + id
}

module.exports.getFlickrFeedUrlFromId = (id) => {
  return process.env.FLICKR_FEED_URL + id
}

module.exports.getYouTubeFeedUrlArrayFromIds = (ids) => {
  return ids.map(id => this.getYouTubeFeedUrlFromId(id))
}

module.exports.getFeedFromYouTubeIds = async (ids) => {
  const urls = this.getYouTubeFeedUrlArrayFromIds(ids)
  const feed = await this.getFeedFromUrls(urls, 'YouTube libraries | Libraries at home', {
    yt: 'http://www.youtube.com/xml/schemas/2015',
    media: 'http://search.yahoo.com/mrss/'
  })
  return feed
}

module.exports.getFeedFromBlogUrls = async (urls) => {
  const feed = await this.getFeedFromUrls(urls, 'Library blogs | Libraries at home', {})
  return feed
}
