FROM docker.elastic.co/logstash/logstash:8.18.0

USER root

# Install MySQL Connector/J
# Pin a stable version; can be changed if needed.
ARG MYSQL_CONNECTOR_VERSION=8.4.0
RUN mkdir -p /usr/share/logstash/vendor/jar/jdbc \
  && (curl -fsSL -o /usr/share/logstash/vendor/jar/jdbc/mysql-connector-j.jar \
      https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/${MYSQL_CONNECTOR_VERSION}/mysql-connector-j-${MYSQL_CONNECTOR_VERSION}.jar \
    || wget -qO /usr/share/logstash/vendor/jar/jdbc/mysql-connector-j.jar \
      https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/${MYSQL_CONNECTOR_VERSION}/mysql-connector-j-${MYSQL_CONNECTOR_VERSION}.jar)

RUN chown -R logstash:root /usr/share/logstash/vendor

USER logstash
