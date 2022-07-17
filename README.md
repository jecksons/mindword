#Mindword

This project aim to provide a tool to adquire vocabulary in another language.


## Setting up the environment


## Available Scripts

In the project directory, you can run:

### Development
Create a .env file at root level, following this format:
```javascript
DB_PORT=<database_port>
DB_USER=<database_user>
DB_PASSWORD=<database_password>
DB_ROOT_PASSWORD=<root_password>
DB_HOST=<database_host>
DB_NAME=<database_name>
WEB_PORT=<api_port>
TOKEN_SECRET=<secret_token>
TOKEN_EXPIRE_TIME=<token_expiration_in_milliseconds>
REFRESH_TOKEN_EXPIRE_TIME=<refresh_token_expiration_in_milliseconds>
CLIENT_VERSION=<client_version_number>

REACT_APP_API_URL=<api_url>
REACT_APP_CLIENT_VERSION=<client_version_number>
PORT=<web_port>
```


#### Install
`yarn`

#### Start database services
`yarn db:start`

#### Start api
`yarn api`

#### Test api
`yarn test`

#### Start web application
`yarn web`

