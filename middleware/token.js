const authHelper = require('../helpers/authenticate')

module.exports.accessToken = async (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    req.claims = await authHelper.verify(bearerToken)
  }
  next();
}

module.exports.verifyToken = async (req, res, next) => {
  const bearerHeader = req.headers['authorization'];

  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    req.claims = await authHelper.verify(bearerToken)
    next();
  } else {
    res.sendStatus(403);
  }
}
