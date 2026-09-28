FROM debian:bookworm-slim

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends icecast2 gettext-base ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY icecast.xml.template /etc/icecast2/icecast.xml.template
COPY entrypoint.sh /usr/local/bin/stannet-icecast-entrypoint
RUN chmod 0755 /usr/local/bin/stannet-icecast-entrypoint

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/stannet-icecast-entrypoint"]
