var express = require('express');
var router = express.Router();
var mongodb = require('./conn.js');

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
var logSchema=new schema({
	username:String,
	content:String,
	op_time:String,
	result:String,
	ip:String
});

var adminModel=mongodb.model('admin',adminSchema,'admin');
var logModel=mongodb.model('log',logSchema,'log');

//检测登陆的用户名和密码是否正确
router.post('/checklogin.html',function(req,res){
	var username=req.body.username;
	var pwd=req.body.password;

	adminModel.find({'username':username,'password':pwd},function(err,data){
		if(data.length){
			res.cookie('login_user',username);
			res.send('1'); //有数据时，表示验证成功 ，返回 1
		}else{
			res.send('0'); //没有数据，表示验证失败，返回 0
		}
	});

});

//在服务器端提供一个页面用于检测用户是否已经登陆
router.get('/chk_logined.html',function(req,res){
	if(req.cookies.login_user){
		res.send(''); //已登陆返回空
	}else{
		res.send('alert("前方高能，请登陆以后再操作");location.href="/admin/pages/login.html";');
	}
});

//退出登陆
router.get('/logout.html',function(req,res){
	res.clearCookie('login_user');
	res.send('<script>alert("退出成功，欢迎下次再来！");location.href="/admin/pages/login.html";</script>');
});

//显示所有管理员数据
/*
router.get('/showadmin.html',function(req,res){
	adminModel.find({},function(err,data){
		res.send(data);
	});
});
*/
//按分页显示管理员数据
router.get('/showadmin.html',function(req,res){
	//分页的三大条件
	//条件一： 【设置】每页显示的条数
	var pagesize=2;
	//条件二： 【获取】 当前在第几页上
	var page=req.query.page;
	//条件三： 【计算】得到总页数   ， 总页数= 向上取整(总条数/每页显示的条数)
	
	adminModel.find({},function(err,data){
		var pagecount=Math.ceil(data.length/pagesize); //条件三已得到
		
		/*
		 * 从哪个地方开始读取数据？
		 * 第一页： 0   page=1
		 * 第二页： 2   page=2
		 * 第三页： 4   page=3
		 * 第四页： 6   page=4
		 * 公式： start= (page-1) * pagesize
		 */
		//通过 条件一 和 条件二 计算出从哪个位置开始读取数据
		var start= (page-1) * pagesize;
		adminModel.find({},function(err,data){
			//data[data.length]={'pagecount':pagecount};
			data.push({'pagecount':pagecount});
			res.send(data);
		}).limit(pagesize).skip(start);
	});
	
	/*
	adminModel.find({},function(err,data){
		res.send(data);
	});
	*/
});

//保存新增管理员的数据
router.post('/admin_new.html',function(req,res){
	//用模板类创建一个实体 data
	var data=new adminModel();
	//给实体添加属性和值
	data.username=req.body.username;
	data.password=req.body.password;
	data.truename=req.body.truename;
	data.role=req.body.role;
	data.department=req.body.department;
	data.sort=parseInt(req.body.sort);
	data.flag=req.body.flag;
	//调用save()方法将实体（属性和属性值）保存到数据库中，实现新增用户的功能。
	data.save(function(err){
		if(err){
			res.send(err); //新增失败则返回错误提示
		}else{
			//res.send('1'); //新增成功则返回 1
			var log=new logModel();
			log.username=req.cookies.login_user;
			log.content='新增管理员：'+req.body.username;
			var d=new Date();
			log.op_time=d.toLocaleString();
			log.result='成功';
			log.ip=req.ip;
			log.save(function(err){
				res.send('1');
			});
		}
	});
});

//删除管理员数据..
router.post("/del.html",function(req,res){
	//巨大的坑：当传输数组数据时，浏览器会自动加中括号，怎么获取到值呢？
	//调用属性有两种方式：对象方式和数组方式 ； 因为自动加了中括号，所以不能再以对象的调用方式，只能使用数组调用方式
	var ids=req.body['ids[]'];
	//用$in子句，通过查询给定的集合中是否存在数据，如果存在则取出，不存在 就不管
	adminModel.find({"_id":{$in:ids}},function(err,data){
		for(var i in data){
			data[i].remove();
		}
		res.send('1');
	});
});

//获取一条管理员数据
router.get("/get_admin.html",function(req,res){
	var id=req.query.id;
	adminModel.findById(id,function(err,data){
		res.send(data);
	});
});

//保存用户修改后的管理员信息
router.post('/admin_update.html',function(req,res){
	var id=req.body.id;
	adminModel.findById(id,function(err,data){
		data.username=req.body.username;
		data.password=req.body.password;
		data.truename=req.body.truename;
		data.role=req.body.role;
		data.department=req.body.department;
		data.flag=req.body.flag;
		data.sort=parseInt(req.body.sort);
		data.save(function(err){
			if(err){
				res.send('0');
			}else{
				res.send('1');
			}
		});
	});
});

router.post('/admin_search.html',function(req,res){
	var username=req.body.username;
	var department=req.body.department;
	var role=req.body.role;
	
	var obj={}; //定义一个空对象用于构造查询条件【重点】
	if(department!=='全部'){ //当部门不是全部时，表示已经选中了一个部门，这时必须要设置条件
		obj.department=department;
	}
	
	if(role!=='全部'){ //当角色不是全部时，表示已经选中了一个角色，这时必须要设置条件
		obj.role=role;
	}
	
	if(username!==''){
		//obj.username=username;  //目前是精确查询
		obj.username=new RegExp(username); //【难点】使用正则表达式进行模糊搜索
	}
	
	//console.log(username,department,role);
	adminModel.find(obj,function(err,data){
		res.send(data);
	});
});





module.exports = router;
