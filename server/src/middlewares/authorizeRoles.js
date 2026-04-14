const ApiError = require('../utils/apiError')

function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new ApiError(401, 'Authentication required'))
      return
    }

    if (!roles.includes(req.user.role)) {
      next(new ApiError(403, 'You are not authorized for this action'))
      return
    }

    next()
  }
}

module.exports = authorizeRoles
