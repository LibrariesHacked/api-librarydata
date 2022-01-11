const pool = require('../helpers/database')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const Email = require('email-templates')

/**
 * Verifies that a JWT is valid and returns the claims or null if it isn't
 * @param {string} token A JSON web token
 * @returns {object|null} A claims object
 */
module.exports.verifyToken = async (token) => {
  let domain = null
  try {
    const decoded = jwt.verify(token, process.env.AUTHSECRET)
    domain = decoded.sub
  } catch (e) {
    return null
  }
  const claims = await this.getDomainClaims(domain)
  return claims
}

/**
 * Gets the user domain from a token
 * @param {string} token
 * @returns {string} Email domain
 */
module.exports.getTokenDomain = async (token) => {
  let domain = null
  try {
    const decoded = jwt.verify(token, process.env.AUTHSECRET)
    domain = decoded.sub
  } catch (e) {
    return null
  }
  return domain
}

/**
 * Gets the claims associated with an email address domain
 * @param {string} domain A top level domain
 * @returns {object} A claims object
 */
module.exports.getDomainClaims = async (domain) => {
  let claims = { admin: false, codes: [] }
  try {
    const query = 'select * from authentication where domain = $1 limit 1'
    const { rows } = await pool.query(query, [domain])
    if (rows.length > 0) claims = { admin: rows[0].admin, codes: rows[0].authority_codes }
  } catch (e) { }
  return claims
}

/**
 * Sends an email with a login link
 * @param {string} email An email address
 * @param {object} claims A claims object
 * @param {string} website A web address domain
 */
module.exports.sendMagicLink = async (email, claims, website) => {
  const domain = email.split('@').pop()
  const token = jwt.sign(claims, process.env.AUTHSECRET, { audience: [website], expiresIn: '30d', issuer: 'api.librarydata.uk', subject: domain })

  const mailConfig = {
    host: process.env.SMTPSERVER,
    port: process.env.SMTPPORT,
    auth: {
      user: process.env.SMTPUSERNAME,
      pass: process.env.SMTPPASSWORD
    }
  }

  const transporter = nodemailer.createTransport(mailConfig)

  const emailTemplate = new Email({
    message: {
      from: process.env.EMAILFROM
    },
    send: true,
    transport: transporter
  })

  try {
    emailTemplate
      .send({
        template: website + '-login',
        message: {
          to: email
        },
        locals: {
          website: website,
          token: token
        }
      })
  } catch (e) { 
    return false
  }

  return true
}

/**
 * Verify that a claim has access to a service code
 * @param {string} serviceCode
 * @param {object} claims
 * @returns {boolean} Access
 */
module.exports.verifyServiceCodeAccess = async (serviceCode, claims) => {
  return (claims.codes.indexOf(serviceCode) === -1 && claims.admin === false)
}
