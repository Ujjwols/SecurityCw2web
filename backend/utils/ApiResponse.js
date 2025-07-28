// how data response is handled and what we get in response from th api
// ApiResponse class to standardize API responses
class ApiResponse {
  /**
   * Constructor to initialize the response structure
   * @param {number} statusCode
   * @param {any} data
   * @param {string} [message="Success"]
   *
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 300;
  }
}

// Export the ApiResponse class for use in other files
module.exports = ApiResponse;
