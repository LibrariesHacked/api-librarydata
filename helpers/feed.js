const RSSCombiner = require('../lib/feed-combiner')

/**
 * Gets a combined feed from multiple feed URLs
 * @param {Array} urls An array of URLs
 * @param {string} title A title for the feed
 * @param {Array} customNamespaces An array of namespaces
 * @returns {Object} A combined feed
 */
module.exports.getFeedFromUrls = async (urls, title, customNamespaces) => {
  const feedConfig = {
    title: title,
    size: 100,
    feeds: urls,
    pubDate: new Date(),
    custom_namespaces: customNamespaces
  }
  const feed = await RSSCombiner(feedConfig)
  return feed
}

/**
 * Gets the full URL of a feed from a YouTube channel/playlist/user ID
 * @param {string} id ID of the YouTube channel/playlist/user
 * @returns {string} A feed URL
 */
module.exports.getYouTubeFeedUrlFromId = (id) => {
  const youTubeUrl = process.env.YOUTUBE_FEED_URL
  const idTypes = {
    UC: 'channel_id',
    PL: 'playlist_id'
  }
  return youTubeUrl + (idTypes[id.substring(0, 2)] || 'user') + '=' + id
}

/**
 * Gets the full URL of a feed from a Flickr user ID
 * @param {string} id ID of the Flickr user
 * @returns {string} A feed URL
 */
module.exports.getFlickrFeedUrlFromId = (id) => {
  return process.env.FLICKR_FEED_URL + id
}

/**
 * Gets an array of feed URLs from a set of YouTube channel/playlist/user IDs
 * @param {Array} ids An array of YouTube IDs
 * @returns {Array} A set of feed URLs
 */
module.exports.getYouTubeFeedUrlArrayFromIds = (ids) => {
  return ids.map(id => this.getYouTubeFeedUrlFromId(id))
}

/**
 * Gets a combined feed from multiple YouTube channel/playlist/user IDs
 * @param {Array} ids An array of YouTube IDs
 * @returns {object} A combined feed
 */
module.exports.getFeedFromYouTubeIds = async (ids) => {
  const urls = this.getYouTubeFeedUrlArrayFromIds(ids)
  const feed = await this.getFeedFromUrls(urls, 'YouTube libraries | Libraries at home', {
    yt: 'http://www.youtube.com/xml/schemas/2015',
    media: 'http://search.yahoo.com/mrss/'
  })
  return feed
}

/**
 * Gets a combined feed from multiple Blog feed URLs
 * @param {*} urls A set of Blog feed URLs
 * @returns {object} A combined feed
 */
module.exports.getFeedFromBlogUrls = async (urls) => {
  const feed = await this.getFeedFromUrls(urls, 'Library blogs | Libraries at home', {})
  return feed
}
