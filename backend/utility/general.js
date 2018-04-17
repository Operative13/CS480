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

module.exports = { asJson, asJsonString, messageTypes };