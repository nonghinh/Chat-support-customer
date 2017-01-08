var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mysql = require('mysql');
var bodyParser = require('body-parser');

var port = process.env.PORT || 3000;

var rooms = [];
var conn = mysql.createConnection({
	host: '127.0.0.1',
	user: 'root',
	password: '',
	database: 'chat'			
});
conn.connect(function(err){
  if(err){
    console.log('Error connecting to Db');
    return;
  }
  console.log('Connection established');
});
//khai bao
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.get('/', function(req, res){
	res.redirect('login');
});
app.get('/login', function(req, res){
	res.render('login',{title: 'Đăng nhập', err: 0});
});
app.post('/login', function(req, res){
	var email = req.body.email;
	conn.query('SELECT * FROM supporter WHERE email = ?', [email], function(err, rows){
		if(err) throw console.log("loimafiffffff");
		if(rows.length == 0){
			res.render('login',{title: 'Đăng nhập', err: 1});
		}
		else{
			res.redirect('/tu-van-khach-hang?spId='+rows[0].id+'&spEmail='+rows[0].email);
		}
	});
});
app.get('/tu-van-khach-hang', function(req, res){
	var id = (req.query.spId) ? req.query.spId : null ;
	var email = (req.query.spEmail) ? req.query.spEmail : null;
	res.render('support',{title: 'Tư vấn khách hàng', id: id, email: email});
});
app.get('/managechat', function(req, res){
	res.render('manage', {title: 'Manage chat'});
});

app.get('/supporter/show', function(req, res){
	conn.query('SELECT * FROM supporter', [], function(err, rows){
		if(err) throw err;
		res.render('supporter/show', {title: 'Show list supporter', data: rows});
	});
});
app.get('/supporter/add', function(req, res){
	res.render('supporter/add', {title: 'Add new supporter', err: null});
});
app.post('/supporter/add', function(req, res){
	var fullname = req.body.fullname;
	var gender = req.body.gender;
	var email = req.body.email;
	var phone = req.body.phone;
	var type = req.body.type;

	if(fullname && email && phone && type){

		conn.query('SELECT * FROM supporter WHERE email = ?',[email], function(err, rows){
			if(err) throw err;
			if(rows.length > 0){
				res.render('supporter/add', {title: 'Add new supporter', err: 'email'});
			}
			else{
				conn.query('SELECT * FROM supporter WHERE phone = ?',[phone], function(errp, phones){
					if(errp) throw errp;
					if(phones.length > 0){
						res.render('supporter/add', {title: 'Add new supporter', err: 'phone'});
					}
					else{
						conn.query('INSERT INTO supporter SET ?',{name: fullname, email: email, phone: phone, type: type, gender: gender}, function(erri, kq){
							if(erri) throw erri;
							console.log('Added a new supporter');
							res.redirect('/supporter/show');
						});
					}
				});
			}
		});

	}
	else{
		res.render('supporter/add', {title: 'Add new supporter', err: 'none'});
	}
});

app.get('/supporter/edit', function(req, res){
	var id = req.query.id;
	if(!id){
		res.redirect('/supporter/show');
	}
	conn.query('SELECT * FROM supporter WHERE id = ?',[id], function(err, rows){
		if(err) throw err;
		res.render('supporter/edit', {title: 'Edit supporter', err: null, data: rows[0]});
	});
});
app.post('/supporter/edit', function(req, res){

	var id = req.query.id;
	var fullname = req.body.fullname;
	var gender = req.body.gender;
	var email = req.body.email;
	var phone = req.body.phone;
	var type = req.body.type;
	if(fullname && email && phone && type){

		conn.query('SELECT * FROM supporter WHERE email = ? AND id <> ?',[email, id], function(err, rows){
			if(err) console.log('Loi 1');
			if(rows.length > 0){
				res.redirect('/supporter/edit');
			}
			else{
				conn.query('SELECT * FROM supporter WHERE phone = ? AND id <> ?',[phone, id], function(errp, phones){
					if(errp) throw console.log('Loi 2');
					if(phones.length > 0){
						res.redirect('/supporter/edit');
					}
					else{
						conn.query('UPDATE supporter SET name=?, gender=?, email=?, phone=?, type=?  WHERE id=?',[fullname, gender, email, phone, type, id], function(erri, result){
							if(erri) throw erri;
							console.log('Updated a new supporter');
							res.redirect('/supporter/show');
						});
					}
				});
			}
		});

	}
	else{
		res.render('supporter/edit', {title: 'Edit supporter', err: 'none'});
	}
});

app.get('/supporter/delete', function(req, res){
	var id = req.query.id;
	conn.query('DELETE FROM supporter WHERE id = ?',[id], function(err, rows){
		if(err) throw err;
		res.redirect('/supporter/show');
	});
});
app.get('/customer/show', function(req, res){

	conn.query('SELECT * FROM customer',[], function(err, rows){
		if(err) throw err;
		res.render('customer/show', {title: 'Show customer', data: rows});
	});
});

app.get('/customer/delete', function(req, res){
	var id = req.query.id;
	conn.query('DELETE FROM customer WHERE id = ?',[id], function(err, rows){
		if(err) throw err;
		res.redirect('/customer/show');
	});
});

app.get('/customer/deleteall', function(req, res){
	conn.query('DELETE FROM customer ',[], function(err, rows){
		if(err) throw err;
		res.redirect('/customer/show');
	});
});
app.get('/chathistory', function(req, res){

	conn.query('SELECT * FROM supporter',[], function(err, rows){
		if(err) throw err;
		
		res.render('chathistory/index', {title: 'Lich su chat',data: rows});
	});
});

app.get('/chathistory/getCus', function(req, res){
	var spid = req.query.id;
	conn.query('SELECT DISTINCT customer_id FROM chathistory WHERE supporter_id = ?',[spid], function(err, rows){
		if(err) throw err;
		res.send(rows);
	});
});
app.get('/chathistory/getCusData', function(req, res){
	var id = req.query.id;
	conn.query('SELECT * FROM customer WHERE id = ?',[id], function(err, rows){
		if(err) throw err;
		res.send(rows[0]);
	});
});
app.get('/chathistory/getMsg', function(req, res){
	var spid = req.query.spid;
	var cusid = req.query.cusid;
	conn.query('SELECT * FROM chathistory WHERE customer_id = ? AND supporter_id = ?',[cusid, spid], function(err, rows){
		if(err) throw err;
		res.send(rows);
	});
});

app.get('/chathistory/deleteMsg', function(req, res){
	var spid = req.query.spid;
	var cusid = req.query.cusid;
	conn.query('DELETE FROM chathistory WHERE supporter_id = ? && customer_id = ?',[spid, cusid], function(err, rows){
		if(err) throw err;
		res.send('success');
	});
});

app.get('/chathistory/deleteall', function(req, res){
	conn.query('DELETE FROM chathistory ',[], function(err, rows){
		if(err) throw err;
		res.redirect('/chathistory');
	});
});
app.get('/rate/show', function(req, res){

	conn.query('SELECT * FROM rate',[], function(err, rows){
		if(err) throw err;
		res.render('rate/show', {title: 'Show list rate', data: rows});
	});
});

app.get('/rate/delete', function(req, res){
	var id = req.query.id;
	conn.query('DELETE FROM rate WHERE id = ?',[id], function(err, rows){
		if(err) throw err;
		res.redirect('/rate/show');
	});
});
app.get('/rate/deleteall', function(req, res){
	conn.query('DELETE FROM rate ',[], function(err, rows){
		if(err) throw err;
		res.redirect('/rate/show');
	});
});
app.get('/rate/getRateInfo', function(req, res){
	var cusid = req.query.cusid;
	var supid = req.query.supid;
	conn.query('SELECT * FROM customer WHERE id = ?',[cusid], function(err, cus){
		if(err) throw err;
		conn.query('SELECT * FROM supporter WHERE id = ?', [supid], function(err, sup){
			if(err) throw err;
			res.send('<td>'+cus[0].name+'</td><td>'+sup[0].name+'</td>');
		});
	})
});
//=================== CHAT PROCESS =====================
//khoi tao server
server.listen(port, function(){
	console.log('Server running at http://localhost:%d ....', port);
});
// bat dau knoi
io.on('connection', function(socket){
	//Begin connect
	console.log('Client connected.');
	//Them DL
	socket.on('adduser', function(data){
		//Them du lieu vao bang customer
		var dataUser = {email: data.email, name: data.username, phone: data.phone};
		conn.query('SELECT * FROM customer WHERE email = ? OR phone = ?',[data.email, data.phone], function(err, rows, fields){
			if(err) throw 'loiiiifg';
			if(rows.length == 0){
				conn.query('INSERT INTO customer SET ?', dataUser, function(errs, res){
					if(errs) throw 'hhhhhhth';
					console.log('Inserted');
					socket.emit('userinfo', res.insertId, data.type_sp, data.msg);
				});
			}
			else{
				socket.emit('userinfo', rows[0].id, data.type_sp, data.msg);
			}
		});
		var type = (data.type_sp == 1) ? 'Tư vấn mua hàng' : 'Hỗ trợ kỹ thuật';
		var roomname = data.username+' - '+type;
		rooms.push(roomname);
		socket.join(roomname);
		socket.room = roomname;
		socket.emit('updatechat', data.msg, roomname, data.username);
		socket.broadcast.emit('updaterooms', rooms);
	});

	socket.on('reqNameSp', function(id){
		conn.query('SELECT * FROM supporter WHERE id = ? ',[id], function(err, rows){
			if(err) throw err;
			socket.emit('resNameSp', rows[0].name);
		});
	});
	socket.on('getrooms', function(data){
		socket.emit('listrooms', rooms);
	})


	socket.on('userid', function(data){
		conn.query('SELECT MAX(session) as lastsession FROM chathistory',[], function(err, his){
			if(err) throw err;
			var currSession = 1;
			if(his.length > 0 && his[0].lastsession != null){
				currSession = parseInt(his[0].lastsession) + 1;
			}
			//var msg = {chater_id: data.id, type: data.type_sp, message: data.msg, session: currSession};
			//addMessage(msg);
			socket.emit('currSession', currSession);
		});
		console.log('new message added');
	});	
	
	socket.on('switchRoom', function(newroom, curr, spName, spId){
		if(curr != null){
			socket.leave(curr);
			// sent message to OLD room
			socket.broadcast.to(curr).emit('forOldRoom', spName+' - Hỗ trợ viên đã rời phòng, kết thúc hỗ trợ');
		}
		
		// join new room, received as function parameter
		socket.join(newroom);
		
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('forNewRoom', spName+' đã sẵn sàn hỗ trợ bạn.', spName, spId);
		socket.emit('updaterooms2', rooms, newroom);
	});
	socket.on('clientMsg', function(msg, name, cusId, spId, sesChat){
		console.log(sesChat);
		for (var i = 0; i < msg.length; i++) {
			var dt = {supporter_id: spId, customer_id: cusId,type: 1, message: msg[i], session: sesChat};
			addMessage(dt);
		}
		socket.broadcast.to(socket.room).emit('clientMsg', msg, name, cusId, sesChat);
	});	
	socket.on('sendchat', function(msg, name, id, type, prId, ses){
		var data = {};
		if(type == 1){
			data = {
				customer_id: id,
				supporter_id: prId,
				type: type,
				message: msg,
				session: ses
			};
		}
		else{
			data = {
				customer_id: prId,
				supporter_id: id,
				type: type,
				message: msg,
				session: ses
			};
		}
		conn.query('INSERT INTO chathistory SET ? ', data, function(err, res){
			if(err) throw err;
			console.log('Inserted to chat history');
		});	

		socket.broadcast.to(socket.room).emit('message', msg, name);
		console.log('Send chat '+socket.room);
	});

	socket.on('endChat', function(room){
		socket.broadcast.to(room).emit('endchatclient', 'Khách hàng đã rời phòng chat');
		delete rooms[rooms.indexOf(room)];
		socket.broadcast.emit('updaterooms', rooms);
	});

	socket.on('rate', function(level, id){
		socket.broadcast.to(socket.room).emit('getSpId', level, id);
		
	});
	socket.on('spId', function(level, id, spid){
		conn.query('INSERT INTO rate SET ? ', {level: level, customer_id: id, supporter_id: spid}, function(err, res){
			if(err) throw err;
			console.log('Inserted to rate table');
		});
	})
	socket.on('removeRoom', function(room){
		delete rooms[rooms.indexOf(room)];
		socket.emit('updaterooms', rooms);
	});
	socket.on('disconnect', function(){
		socket.leave(socket.room);
		socket.broadcast.to(socket.room).emit('endchatclient', 'Khách hàng đã rời phòng chat', socket.room);
		socket.broadcast.to(socket.room).emit('forOldRoom', 'Hỗ trợ viên đã rời phòng, kết thúc hỗ trợ');
		socket.broadcast.to(socket.room).emit('forNewRoom', 'Hỗ trợ viên đã rời phòng, kết thúc hỗ trợ');
		socket.broadcast.emit('outroom', 'Out room');
		console.log('Client disconnected');
	});
});

function addMessage(data){
	conn.query('INSERT INTO chathistory SET ?', data, function(err, res){
		if(err) throw err
		console.log(' a message has Inserted');
	});
}

function getHistoryMsg(id, type){
	var data = [];
	conn.query('SELECT * FROM lichsuchat WHERE Chater_ID = ? AND Type = ?',[id, type], function(err, rows){
		if(err) throw err;
		if(rows.length > 0){
			for(var i = 0; i < rows.length; i++){
				data.push(rows[i]);
				console.log(rows[i]);
			}
		}
	});

	return data;
}