class BaseException extends Error {

}

class BackendException extends BaseException {

}

class RequestRejectedException extends BaseException {

}

/**
 * @deprecated in favor of jsend standard
 * @param error an exception object that inherits from Error or
 *  has message, code, and stack attributes
 * @returns {{type: string, message: string, code, stack}}
 */
function errorToJson(error) {
  return {
    type: "error",
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
}

module.exports = { BackendException, RequestRejectedException, errorToJson };
