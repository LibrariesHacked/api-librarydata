const RSSCombiner = require('../lib/feed-combiner');

module.exports.getYouTubeFeedUrlFromId = (id) => {
  const youtube_url = process.env.YOUTUBE_FEED_URL;
  const id_types = {
    'UC': 'channel_id',
    'PL': 'playlist_id'
  };
  return youtube_url + (id_types[id.substring(0, 2)] || 'user') + '=' + id;
}

module.exports.getYouTubeFeedUrlArrayFromIds = (ids) => {
  return ids.map(id => this.getYouTubeFeedUrlFromId(id));
}

module.exports.getFeedFromUrls = async (urls, title) => {
  var feedConfig = {
    title: title,
    size: 100,
    feeds: urls,
    pubDate: new Date(),
    softFail: true
  };
  var feed = await RSSCombiner(feedConfig);
  return feed;
}

module.exports.getFeedFromYouTubeIds = async (ids) => {
  const urls = this.getYouTubeFeedUrlArrayFromIds(ids);
  const feed = await this.getFeedFromUrls(urls, 'YouTube libraries | Libraries at home');
  return feed;
}