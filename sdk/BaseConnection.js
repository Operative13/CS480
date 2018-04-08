
class BaseConnection {
  constructor(domain, port, protocol='http://') {
    this.domain = domain;
    this.port = port;
    this.baseUrl = `${protocol}${domain}:${port}`;
  }

}

module.exports = BaseConnection;