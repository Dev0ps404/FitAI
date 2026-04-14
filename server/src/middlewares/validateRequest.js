const { ZodError } = require('zod')
const ApiError = require('../utils/apiError')

function mapZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }))
}

function validateRequest(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.validatedBody = schemas.body.parse(req.body)
      }

      if (schemas.params) {
        req.validatedParams = schemas.params.parse(req.params)
      }

      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query)
      }

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ApiError(400, 'Validation failed', {
            errors: mapZodIssues(error.issues),
          }),
        )
        return
      }

      next(error)
    }
  }
}

module.exports = validateRequest
