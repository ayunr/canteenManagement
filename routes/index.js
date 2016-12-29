var express = require('express');
var mongodb = require('./conn.js');
var router = express.Router();

//关于 mongoose的使用： http://www.cnblogs.com/zhongweiv/p/mongoose.html
var schema=mongodb.Schema;
var adminSchema=new schema({
	username:String,
	password:String,
	truename:String,
	role:String,
	department:String,
	sort:Number,
	flag:String
});

//var adminModel=mongodb.model('admin',adminSchema,'admin');


//接收数据的三种方式
router.get('/show/:id',function(req,res){
	var username=req.params.id;
	res.send(username);
});


module.exports = router;
