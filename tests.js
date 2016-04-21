//Require dependencies
var redis = require("redis.token")()
var auth = require("./index.js")(redis)
var request = require("supertest")

var express = require("express")
var app = express()

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

app.get("/auth", auth("user"), function(req,res) {
  return res.status(200).send("Authorized :)")
})

app.get("/free", function(req,res) {
  return res.status(200).send("This point is free...")
})

var token = ""

describe('Redis Auth', function() {

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

  it('Authenticate with middleware', function (done) {

    request(app)
      .get("/auth")
      .set("Authorization", token)
      .expect(200, "Authorized :)", done)

  })

})
