/**
 * Helps the programmer define authentication and server config once as
 * each class in sdk/ will need to know where to send http requests at the
 * very least
 */
export default class BaseConnection {
  /**
   * Creates the URL using the given values
   * @param domain
   * @param port
   * @param protocol
   */
  constructor(domain, port, protocol='http://') {
    this.domain = domain;
    this.port = port;
    this.baseUrl = `${protocol}${domain}:${port}`;
  }

  toString() {
    return this.baseUrl;
  }
}