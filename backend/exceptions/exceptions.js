class BaseException {
  constructor(message, errorCode) {
    this.message = message || "no message given";
    this.errorCode = errorCode || 0;
  }
}

class BackendException extends BaseException {

}

class RequestRejectedException extends BaseException {

}

const exceptions = { BackendException, RequestRejectedException };
module.exports = exceptions;