/**
 * Helper functions to extract data from a response to follow a standard
 */
module.exports = {

  /**
   * Follows jsend std and retrieve the data from the success response
   * @param jsonResponse {Object} a response from a request that's been
   *  converted to an object
   * @returns {*} whatever the data was in the response; likely to be
   *  some type of json serializeable object
   */
  getDataFromSuccess(jsonResponse) {
    return jsonResponse['data'];
  },

  /**
   * Follows jsend std and treats status of fail or error the same
   * @param jsonResponse {Object} a response from a request that's been
   *  converted to an object
   * @returns {Error}
   */
  getErrorFromFailOrError(jsonResponse) {
    let error = new Error(jsonResponse['message'] || jsonResponse['data']);
    error.code = jsonResponse['code'];
    return error;
  }
};