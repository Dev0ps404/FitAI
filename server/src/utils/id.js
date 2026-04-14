function isSameId(a, b) {
  if (!a || !b) {
    return false
  }

  return String(a) === String(b)
}

module.exports = {
  isSameId,
}
