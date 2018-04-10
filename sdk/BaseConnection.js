class BaseConnection {
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

module.exports = BaseConnection;