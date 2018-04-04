class BackendException {
  constructor(message, errorCode) {
    this.message = message || "no message given";
    this.errorCode = errorCode || 0;
  }
}

const exceptions = { BackendException };
module.exports = exceptions;