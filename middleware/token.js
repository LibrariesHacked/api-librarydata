import { verifyToken } from '../helpers/authenticate.js'

/**
 * Add any claims and token to the request object
 * @param {object} req The request object
 * @param {object} res The response object
 * @param {object} next Function to pass the request to the next stage
 */
export const accessToken = async (req, res, next) => {
  const bearerHeader = req.headers.authorization

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    req.claims = await verifyToken(bearerToken)
  }
  next()
}

/**
 * Ensure a valid token and add any claims and token to the request object
 * @param {object} req The request object
 * @param {object} res The response object
 * @param {object} next Function to pass the request to the next stage
 */
export const verifyAccessToken = async (req, res, next) => {
  const bearerHeader = req.headers.authorization

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    const claims = await verifyToken(bearerToken)
    if (claims) {
      req.token = bearerToken
      req.claims = claims
      next()
    } else {
      res.sendStatus(401)
    }
  } else {
    res.sendStatus(401)
  }
}
