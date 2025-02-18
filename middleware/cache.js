import { get, put } from 'memory-cache'

/**
 * Caches a response for the specified duration
 * @param {int} duration
 * @returns {null}
 */
const cache = duration => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url
    const cachedBody = get(key)
    if (cachedBody) {
      res.send(cachedBody)
    } else {
      res.sendResponse = res.send
      res.send = body => {
        put(key, body, duration * 1000)
        res.sendResponse(body)
      }
      next()
    }
  }
}

export default cache
