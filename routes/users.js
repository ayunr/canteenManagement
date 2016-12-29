var express = require('express');
var router = express.Router();
var mongodb = require('mongoose');

mongodb.connect("mongodb://127.0.0.1:27017/itsource",function(err){
	if(!err){
		console.log('数据库已连接...');
	}
});

var schema=mongodb.Schema;
var adminSchema=new schema({
	username:String,
	password:String
});


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
