const messageTypes = Object.freeze({
  info: 'info',
  error: 'error',
});

function asJson(message, type=messageTypes.info) {
  let json = {message: message};
  if (type) json.type = type;
  return json;
}

function asJsonString(message, type=messageTypes.info) {
  return JSON.stringify(asJson(message, type));
}

/**
 * Formats data in a new object that follows the jsend standard for a
 * response of status success
 * @param data
 * @returns {{status: string, data: *}}
 */
function dataToJsendSuccess(data) {
  return {status: 'success', data: data};
}

/**
 * Takes info from an error and returns an object with that info that follows
 * the standards defined by json for response of status fail
 * @param error {Error}
 * @returns {{status: string, data: *}}
 */
function errorToJsendFail(error) {
  return {status: 'fail', data: error.message};
}

/**
 * Takes info from an error and returns an object with that info that follows
 * the standards defined by json for response of status error
 * @param error {Error}
 * @returns {{status: string, code: *, message: *}}
 */
function errorToJsendError(error) {
  return {
    status: 'error',
    code: error.code,
    message: error.message,
  };
}

module.exports = {
  asJson, asJsonString, messageTypes, errorToJsendFail, errorToJsendError,
  dataToJsendSuccess,
};