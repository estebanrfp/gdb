# GenosSRV — GenosDB Fallback Server (one-click deploy)
# The artifact ships in this repo's dist: zero dependencies, pure P2P worker.
FROM oven/bun:alpine
COPY dist/genossrv.min.js /srv/genossrv.min.js
WORKDIR /srv
VOLUME /srv/data
ENV GDB_DB_PATH=/srv/data/data.sqlite
ENTRYPOINT ["bun", "genossrv.min.js"]
