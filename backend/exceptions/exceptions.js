class BaseException extends Error {

}

class BackendException extends BaseException {

}

class RequestRejectedException extends BaseException {

}

function errorToJson(error) {
  return {
    type: "error",
    message: error.message,
    code: error.code,
    stack: error.stack,
  };
}

module.exports = { BackendException, RequestRejectedException, errorToJson };
