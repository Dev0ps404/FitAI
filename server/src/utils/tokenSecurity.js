const crypto = require('node:crypto')

function createTokenHash(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

function createRandomToken(byteLength = 48) {
  return crypto.randomBytes(byteLength).toString('base64url')
}

module.exports = {
  createTokenHash,
  createRandomToken,
}
