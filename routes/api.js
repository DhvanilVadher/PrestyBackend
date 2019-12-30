var mongoose = require('mongoose');
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');

var router = express.Router();
var User = require("../models/user");
var Book = require("../models/book");
let mongoClient = require('mongodb').MongoClient;
const dburl = 'mongodb://localhost:27017';
const dbname = 'node-auth';
const collname = 'todolist';
let db = "abcd";
mongoClient.connect(dburl,function(err,client){
  if(!err){
    db = client.db('node-auth');
  }
});
let name = new mongoose.Schema({
  id : Number,
  name : String,
  address : String,
  type : String,
  cpp : Number,
  starttiminghrs : Number,
  starttimingmin : Number,
  endtiminghrs : Number,
  endtimingmin : Number
});
let transaction = new mongoose.Schema({
  UserName : String,
  hotelName : String,
  time : String,
  orderDetails : String,
  totalamount : Number
})
let Transaction =  mongoose.model("Transaction", transaction);

let item = new mongoose.Schema({
    name:String,
    category:String,
    description:String,
    price:Number,
    veg:Boolean
});

let menu = new mongoose.Schema({
    id : Number,
    iteams : [item]
});

let Menu = mongoose.model("Menu", menu);
let Hotel = mongoose.model("Hotel", name);
let Order = mongoose.model("Order",transaction);

router.post('/put_orders',(req,res) =>{
    let newTransaction = new Order(req.body);
    newTransaction.save().then(item =>{
      res.send('Transaction Saved');
    }).catch(err => {
      res.send(err);
    });
  }
)
router.post('/get_transaction',(req,res) =>{
  let Username = (String)(req.body.userName);
  console.log(Username);
  db.collection('transactions',function(err,collection){
    collection.find({UserName:Username}).project({_id:0}).toArray(function(err,data){
      res.json({Ts:data});
    })
  });
});
router.post('/set_transaction',(req,res) =>{
  console.log(req.body);
  let newTransaction = new Transaction(req.body);
  newTransaction.save().then(item =>{
    res.send('Transaction Saved');
  })
  .catch(err =>{
    res.send(err);
  })
});

router.post('/add_hotel',(req,res) =>{
  let newHotel = new Hotel(req.body);
  newHotel.save().then(item =>{
    res.send('Hotel Saved');
  })
  .catch(err =>{
    res.status(400).send(err);
  })
});

router.get('/get_hotels_all',(req,res) =>{
  db.collection('hotels',function(err,collection){
    collection.find({}).toArray(function(err,data){
      res.json({hotels:data});
    })
  });
});

// router.post('/get_menu_veg',(req,res) =>{
//   db.collection('menus',function(err,collection){
//     let idq = (Number)(req.body.id);
//     const i = true;
//     collection.find({id:idq}).project({_id:0, id:0, _v:0 }).toArray(function(err,data){
//       let obj = {};
//       console.log(data);
//       obj.Stuff = data;
//       res.json(obj);
//     })
//   });
// });


router.post('/get_menu',(req,res) =>{
  db.collection('menus',function(err,collection){
    let idq = (Number)(req.body.id);
    collection.find({id:idq}).project({_id:0, id:0, _v:0 }).toArray(function(err,data){
      let obj = {};
      console.log(data);
      obj.Stuff = data;
      res.json(obj);
    })
  });
});


router.post('/add_menu',(req,res) =>{
  let newMenu = new Menu(req.body);
  newMenu.save().then(item =>{
    res.send("aa");
  })
  .catch(err =>{
    res.status(400).send(err);
  })
});

router.post('/signup', function(req, res) {
  if (!req.body.username || !req.body.password) {
    res.json({success: false, msg: 'Please pass username and password.'});
  } else {
    var newUser = new User({
      username: req.body.username,
      password: req.body.password
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

router.post('/signin', function(req, res) {
  User.findOne({
    username: req.body.username
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
    } else {
      user.comparePassword(req.body.password, function (err, isMatch) {
        if (isMatch && !err) {
          var token = jwt.sign(user.toJSON(), config.secret, {
            expiresIn: 604800
          });
          res.json({success: true, token: 'JWT ' + token});
        } else {
          res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
        }
      });
    }
  });
});

router.get('/signout', passport.authenticate('jwt', { session: false}), function(req, res) {
  req.logout();
  res.json({success: true, msg: 'Sign out successfully.'});
});

router.post('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    console.log(req.body);
    var newBook = new Book({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher
    });

    newBook.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Save book failed.'});
      }
      res.json({success: true, msg: 'Successful created new book.'});
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});

router.get('/book', passport.authenticate('jwt', { session: false}), function(req, res) {
  var token = getToken(req.headers);
  if (token) {
    Book.find(function (err, books) {
      if (err) return next(err);
      res.json(books);
    });
  } else {
    return res.status(403).send({success: false, msg: 'Unauthorized.'});
  }
});
getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
