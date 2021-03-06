coinventory-rest-api
====================

REST API in Node.js, using [TypeORM](https://github.com/typeorm/typeorm) and/or [Sequelize](https://github.com/sequelize/sequelize) and/or [Waterline](https://github.com/balderdashy/waterline) on [restify](https://github.com/restify/node-restify) with [TypeScript](https://github.com/Microsoft/TypeScript).


## Install prerequisites

### Node

  0. node & npm (tested with node v10.15.3 & npm v6.9.0)
  1. Run: `npm install -g typings typescript bunyan`
  2. `cd` to directory you've cloned this repo into
  3. Run: `typings install`
  4. Run: `npm install`

### External

  - Database, e.g.: Postgres. Set `RDBMS_URI` env var accordingly, e.g.: `postgres://username:password@hostname/database_name`. Modify [config.ts](https://github.com/SamuelMarks/coinventory-rest-api/blob/master/config.ts) to use a different database.
  - Redis. Set `REDIS_URL` env var accordingly; otherwise defaults are used.
  - Set: `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` env vars


## Docker

Alternatively there is a `Dockerfile` and `docker-compose.yml`, so rather than installing dependencies (other than [Docker](https://docs.docker.com/install/#supported-platforms)), you can run:

### Docker Compose

    docker-compose up

### Kubernetes
If you'd rather use Kubernetes to Docker Compose, then:
<TODO>

### Docker

If you don't want to use Docker Compose, then assuming you have Redis and Postgresql running independently of Docker, or exposed in Docker through ports, you can then run:

    docker run -e RDBMS_URI="$RDBMS_URI" \
               -e REDIS_HOST="$REDIS_HOST" \
               -e DEFAULT_ADMIN_EMAIL=foo \
               -e DEFAULT_ADMIN_PASSWORD=bar \
               -p 3000:3000 \
               --name "${PWD##*/}" \
               "${PWD##*/}"

Where `RDBMS_URI` and `REDIS_HOST` environment variables are set correctly for your system.

## Compile+run app

    tsc
    node main.js

## Misc

### Cleanup compiled output

When `*.js` isn't present in `.gitignore`, clean out compiled js with this GNU findutils & Bash solution:

    find -name '*.js.map' -type f -exec bash -c 'rm "${1}" "${1%????}"' bash {} \;

To delete all `*.js` outside of `node_modules`, use:

    find \( -name node_modules -prune \) -o -name '*.js' -type f -exec rm {} \;

More complicated solution handling "foo.ts" & "foo.js" without "foo.js.map" coming at some point.
