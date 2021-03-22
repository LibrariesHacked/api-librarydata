const pool = require('../helpers/database')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const Email = require('email-templates')

module.exports.getDomainClaims = async (domain) => {
  let claims = { admin: false, codes: [] }
  try {
    const query = 'select * from authentication where domain = $1 limit 1'
    const { rows } = await pool.query(query, [domain])
    if (rows.length > 0) claims = { admin: rows[0].admin, codes: rows[0].authority_codes }
  } catch (e) {
    console.log(e)
  }
  return claims
}

module.exports.sendMagicLink = async (email, claims, website) => {
  const domain = email.split('@').pop()
  const token = jwt.sign(claims, process.env.AUTHSECRET, { audience: [website], expiresIn: '30d', issuer: 'https://www.librarydata.uk', subject: domain })

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
        template: 'authenticate',
        message: {
          to: email
        },
        locals: {
          website: website,
          token: token
        }
      })
  } catch (e) { }
}
