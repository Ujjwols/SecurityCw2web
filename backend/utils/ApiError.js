// defining the custom error class by extending the buili-in error class in node js

class ApiError extends Error {
  /**
   * Constructor to initialize the custom error properties
   * @param {number} statusCode
   * @param {string} [message="Something went wrong"]
   * @param {Array} [errors=[]]
   * @param {string} [stack=""]
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.errors = errors;
    this.success = false;

    // Handle the stack trace (custom or generated)
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;

// notes
/**
 * this.data = null
 * even thoughd data tis not passed as parameter in the original ApiError constructor setting this.data = null reserves a property in the class**/

/**
 * this.success = false
 * this ensures that any instance of ApiERror always has success set to false, making ti easire to check for errores in ApiErrors
 */
/**
 * stack
 * making ite easier to see where the error orignated
 */
