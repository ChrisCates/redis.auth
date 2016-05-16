![redis.auth](./redis-auth-banner.png)
[![Build Status](https://travis-ci.org/ChrisCates/redis.auth.svg?branch=master)](https://travis-ci.org/ChrisCates/redis.auth)
[![Coverage Status](https://coveralls.io/repos/github/ChrisCates/redis.auth/badge.svg?branch=master)](https://coveralls.io/github/ChrisCates/redis.auth?branch=master)
![Codeship](https://codeship.com/projects/e9ba3640-ecd4-0133-dc4a-56fc93ede3cf/status?branch=master)
[![Build status](https://ci.appveyor.com/api/projects/status/fjbdiqdarn2wyjm7?svg=true)](https://ci.appveyor.com/project/ChrisCates/redis-auth)

[![NPM](https://nodei.co/npm/redis.auth.png)](https://nodei.co/npm/redis.auth/)

# redis.auth
## A non prescriptive Redis Authentication module for Express
### By Chris Cates :star:

### Installation

```
npm install redis.auth --save
```

### Configuration

Note that it requires redis.token npm module to work properly

``` javascript
var redis = require("redis.token")()
var auth = require("redis.auth")(redis, {
  //Check for which Express header use when authenticating the client
  "header": "authorization",
  //The key in the redis session storage you want to check for
  "key": "grantType",
  //If return error is true it sends a 403 or 500 status based on the error
  //Turn this off if you want to do your own error checking
  "returnError": true
})
```

### Example Express middleware
``` javascript
var express = require("express")
var app = express()

var auth = require("redis.auth")()

//Example single user permission
app.get("/user", auth("user"), function(req,res) {
  //req.auth = stored Redis.Token Object
  return res.status(200).send("Only users can access this...")
})

//Example multi user permission
app.get("/user", auth(["user", "admin"]), function(req,res) {
  //req.auth = stored Redis.Token Object
  return res.status(200).send("Admins and users can access this...")
})

/*
** Assuming the following is in the redis token
** { grantType: user }
** And the header has a valid Redis token...
*/
```

### Example status returns:
#### With returnError = true

``` javascript
return res.status(403).send({
  "error": true,
  "status": 403,
  "message": "No "+config.header+" header supplied..."
})
```

#### With returnError = false

``` javascript
//Sets these variables in req so you can check for them on your own
req.error = true
req.errorType = "No "+config.header+" header supplied..."
req.errorCode = 403
return next()
```

#### Questions, email hello@chriscates.ca
