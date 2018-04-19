const util = require('./general');

module.exports = {
  /**
   * An error occurred bc of bad request
   * @param response
   * @param error {Error}
   * @returns {*}
   */
  requestError(response, error) {
    return response.status(400).jsend.fail(util.errorToJsendFail(error))
  },

  /**
   * An error occurred bc of server thrown error
   * @param response
   * @param error {Error}
   * @returns {*}
   */
  serverError(response, error) {
    return response.status(500).jsend.error(util.errorToJsendError(error));
  },

  /**
   * Request was processed successfully, modify and return the appropriate
   * response with relevant data
   * @param response
   * @param data
   * @returns {*}
   */
  success(response, data) {
    return response.status(200).jsend.success(util.dataToJsendSuccess(data));
  }
};
