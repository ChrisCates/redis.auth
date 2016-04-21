//Uncache the auth module
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};
//Require dependencies
var redis = require("redis.token")()
var auth = require("./index.js")(redis)
require.uncache("./index.js")
var request = require("supertest")
//Initialize express
var express = require("express")
var app = express()
//Create API calls
app.post("/new", function(req,res) {
  redis.generate(
    {
    "user": "bob",
    "grantType": "user"
    },
    function(err, token) {
      if (err) return res.status(500).send(err)
      return res.status(200).send(token)
    }
  )
})

app.post("/new2", function(req,res) {
  redis.generate(
    {
    "user": "bob",
    "grantType": "admin"
    },
    function(err, token) {
      if (err) return res.status(500).send(err)
      return res.status(200).send(token)
    }
  )
})

app.get("/auth", auth("user"), function(req,res) {
  return res.status(200).send("Authorized :)")
})

app.get("/auth_multi", auth(["user", "admin"]), function(req,res) {
  return res.status(200).send("Authorized :)")
})

app.get("/auth_admin", auth("admin"), function(req,res) {
  return res.status(200).send("Authorized :)")
})

app.get("/free", function(req,res) {
  return res.status(200).send("This point is free...")
})

var token = ""
var token2

//UNIT TEST
describe('Redis Auth', function() {

  describe("With returnErrors = true", function() {
    it('Make sure server is working', function (done) {

      request(app)
        .get("/free")
        .expect(200, "This point is free...", done)

    })

    it('Generate a token', function (done) {

      request(app)
        .post("/new")
        .expect(200)
        .end(function(err,res) {
          if (err) throw err
          token = res.body.token
          done()
        })

    })

    it('Generate a token for admin', function (done) {

      request(app)
        .post("/new2")
        .expect(200)
        .end(function(err,res) {
          if (err) throw err
          token2 = res.body.token
          done()
        })

    })

    it('Authenticate with middleware', function (done) {

      request(app)
        .get("/auth")
        .set("Authorization", token)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware - multi user', function (done) {

      request(app)
        .get("/auth_multi")
        .set("Authorization", token)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware for admin', function (done) {

      request(app)
        .get("/auth_admin")
        .set("Authorization", token2)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware for admin - multi user', function (done) {

      request(app)
        .get("/auth_multi")
        .set("Authorization", token2)
        .expect(200, "Authorized :)", done)

    })

    it('Should return a 403 - No header supplied', function (done) {

      request(app)
        .get("/auth")
        .expect(403, done)

    })

    it('Should return a 403 - Incorrect grant type', function (done) {

      request(app)
        .get("/auth_admin")
        .set("Authorization", token)
        .expect(403, done)

    })

  })

  describe("With returnErrors = false", function() {

    var auth2 = require("./index.js")(redis, {
      "header": "authorization",
      "key": "grantType",
      "returnErrors": false
    })

    app.get("/auth2", auth2("user"), function(req,res) {
      if (req.errorCode == 403) return res.status(req.errorCode).send("Unauthorized...")
      return res.status(200).send("Authorized :)")
    })

    app.get("/auth2_multi", auth2(["user", "admin"]), function(req,res) {
      if (req.errorCode == 403) return res.status(req.errorCode).send("Unauthorized...")
      return res.status(200).send("Authorized :)")
    })

    app.get("/auth2_admin", auth2("admin"), function(req,res) {
      if (req.errorCode == 403) return res.status(req.errorCode).send("Unauthorized...")
      return res.status(200).send("Authorized :)")
    })

    it('Authenticate with middleware', function (done) {

      request(app)
        .get("/auth2")
        .set("Authorization", token)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware - multi user', function (done) {

      request(app)
        .get("/auth2_multi")
        .set("Authorization", token)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware for admin', function (done) {

      request(app)
        .get("/auth2_admin")
        .set("Authorization", token2)
        .expect(200, "Authorized :)", done)

    })

    it('Authenticate with middleware for admin - multi user', function (done) {

      request(app)
        .get("/auth2_multi")
        .set("Authorization", token2)
        .expect(200, "Authorized :)", done)

    })

    it('Should return a 403 - No header supplied', function (done) {

      request(app)
        .get("/auth2")
        .expect(403, done)

    })

    it('Should return a 403 - Incorrect grant type', function (done) {

      request(app)
        .get("/auth2_admin")
        .set("Authorization", token)
        .expect(403, done)

    })

  })

})
