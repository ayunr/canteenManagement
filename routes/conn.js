var mongodb = require('mongoose');
mongodb.connect("mongodb://127.0.0.1:27017/itsource",function(err){
	if(!err){
		console.log('数据库已连接...');
	}
});

module.exports = mongodb;