//Global variables
var redis
var config = {}

//The configuration function
module.exports = function(redisToken, configExport) {
  //We need the Redis Token module in order for this to work
  if (!redisToken) {
    redis = require("redis.token")()
  } else {
    redis = redisToken
  }

  //We need to configure our module in order for it work properly
  if (!configExport) {
    config.header = "authorization"
    config.key = "grantType"
    config.returnError = true
  } else {
    config = configExport
  }

  //Return the middleware function we want to use..
  return module.exports.auth
}

//The authentication middleware function
module.exports.auth = function(permissions) {
  return function(req,res,next) {
    //Check if we have a token in the header...
    if (!req.headers[config.header]) {
      //If we don't have a token in the header send an error..
      if (config.returnError == true) {
        return res.status(403).send({
          "error": true,
          "status": 403,
          "message": "No "+config.header+" header supplied..."
        })
      } else {
        req.error = true
        req.errorType = "No "+config.header+" header supplied..."
        req.errorCode = 403
        return next()
      }
    } else {
      //If we do have a token in the header...
      redis.get(req.headers[config.header], function(err,response) {
        req.auth = response
        if (err) {
          if (config.returnError == true) {
            return res.status(500).send({
              "error": true,
              "status": 500,
              "message": "Redis error..."
            })
          } else {
            req.error = true
            req.errorType = "Redis error..."
            req.errorCode = 500
            return next()
          }
        } else {
          //Check permissions via grant type
          if (Array.isArray(permissions)) {
            var valid = false
            permissions.map(function(p) {
              if (p == response[config.key]) {
                valid = true
              } else {
                return false
              }
            })
            //The user is authorized
            if (valid === true) {
              return next()
            }
          } else {
            if (permissions === response[config.key]) {
              //The user is authorized...
              return next()
            }
          }

          //Elsewise throw an error that they aren't authorized...
          if (config.returnError == true) {
            return res.status(403).send({
              "error": true,
              "status": 403,
              "message": "Incorrect permissions supplied..."
            })
          } else {
            req.error = true
            req.errorType = "Incorrect permissions supplied..."
            req.errorCode = 403
            return next()
          }

        }
      })
    }

  }
}
