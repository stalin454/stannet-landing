#!/bin/sh
set -eu

: "${ICECAST_SOURCE_PASSWORD:?ICECAST_SOURCE_PASSWORD is required}"
: "${ICECAST_RELAY_PASSWORD:?ICECAST_RELAY_PASSWORD is required}"
: "${ICECAST_ADMIN_PASSWORD:?ICECAST_ADMIN_PASSWORD is required}"
: "${ICECAST_ADMIN_USER:=admin}"
: "${ICECAST_HOSTNAME:=radio.stannet.space}"

envsubst < /etc/icecast2/icecast.xml.template > /etc/icecast2/icecast.xml
exec icecast2 -c /etc/icecast2/icecast.xml
