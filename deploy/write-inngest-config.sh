#!/bin/sh
# Writes deploy/inngest.yaml from deploy/.env. Run from deploy/ after changing keys.
set -eu
. ./.env
umask 077
cat > inngest.yaml <<YAML
event-key:
  - ${INNGEST_EVENT_KEY}
signing-key: ${INNGEST_SIGNING_KEY}
postgres-uri: postgresql://fasterfixes:${POSTGRES_PASSWORD}@postgres:5432/inngest
sdk-url:
  - http://web:3000/api/inngest
YAML
# The inngest image runs as root, so a root-owned 600 file is readable inside it.
chmod 600 inngest.yaml
