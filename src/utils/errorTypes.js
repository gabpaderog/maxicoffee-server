import ApiError from "./apiError.js";

class BadRequestError extends ApiError{
  constructor(message="Bad Request"){
    super(400, message)
  }
}
class UnauthorizeError extends ApiError{
  constructor(message="Unauthorized"){
    super(401, message)
  }
}
class ForbiddenError extends ApiError{
  constructor(message="Forbidden"){
    super(403, message)
  }
}
class NotFoundError extends ApiError{
  constructor(message="Not Found"){
    super(404, message)
  }
}
class InternalServerError extends ApiError{
  constructor(message="Internal Server Error"){
    super(500, message)
  }
}

export {
  BadRequestError,
  UnauthorizeError,
  ForbiddenError,
  NotFoundError,
  InternalServerError
}