var socket = io.connect('http://localhost:3000');
var chat = $('#chatText');
var listMsg = $('#mgsChat');
var listRooms = $('#listRooms');
if(typeof(localStorage.spId) !== "undefined"){
	socket.emit('reqNameSp', localStorage.spId);
}

$('#logoutSp').click(function(event) {
	localStorage.removeItem('spId');
	localStorage.removeItem('spName');
	localStorage.removeItem('supporter');
	localStorage.removeItem('sessionChat');
	location.reload();
});

chat.keyup(function(event) {
	if(event.keyCode == 13){
		if($(this).val() !="" && $(this).val() !="\n"){
			var html = '<div class="item me">';
					html += '<div class="msg-item">'+$(this).val()+'</div>';
					html += '</div>';
			listMsg.append(html);
			autoScroll();
			socket.emit('sendchat', $(this).val(), localStorage.spName, localStorage.spId, 2, localStorage.cusId, localStorage.sessionChat);
		}
		$(this).val('');
	}
});
socket.on('message', function(msg, name){
	var avatar = getCharName(name);
	var html = '<div class="item">';
		html += '<span class="clientImg" data-toggle="tooltip" data-placement="top" title="'+name+'">'+avatar+'</span><div class="msg-item">'+msg+'</div>';
		html += '</div>';
	listMsg.append(html);
	autoScroll();
});
socket.on('getSpId', function(level, cusId){
	socket.emit('spId', level, cusId, localStorage.spId);
});
socket.emit('getrooms', true);
socket.on('listrooms', function(rooms) {
	getRooms(rooms);
});
socket.on('updaterooms', function(rooms){
	listRooms.empty();
	getRooms(rooms);
});
socket.on('updaterooms2', function(rooms, curr_room){
	listRooms.empty();
	getRooms(rooms, curr_room);
});
socket.on('clientMsg', function(msg, cusname,cusId, sesChat){
	localStorage.sessionChat = sesChat;
	localStorage.cusId = cusId;
	for (var i = 0; i < msg.length; i++) {
		var avatar = getCharName(cusname);
		var html = '<div class="item">';
			html += '<span class="clientImg" data-toggle="tooltip" data-placement="top" title="'+cusname+'">'+avatar+'</span><div class="msg-item">'+msg+'</div>';
			html += '</div>';
		listMsg.append(html);
	}
	$('#chatSP .customername').html(' <em style="color: #d1d1d1; font-weight: 200;">với</em> '+cusname);
	autoScroll();
});

socket.on('endchatclient', function(msg, room){
	listMsg.append('<div class="headerMsg">'+msg+'</div>');
	localStorage.removeItem('cusId');
	socket.emit('removeRoom', room);
	autoScroll();
});
socket.on('resNameSp', function(name){
	localStorage.spName = name;
});

/*===== MANAGE =======*/
	$('#listSup').on('click', '.sp-item', function(event) {
		event.preventDefault();
		var id = $(this).attr('data-id');
		var namesp = $(this).html();
		var url = 'http://localhost:3000/chathistory/getCus';

		$.get(url, {id: id}, function(res){
			if(res != []){
				$('#listCus').empty();
				for(var i = 0; i < res.length; i++){
					var subUrl = 'http://localhost:3000/chathistory/getCusData';
					$.get(subUrl, {id: res[i].customer_id}, function(cusData){
						$('#listCus').append('<a href="javascript:void(0)" data-cus-id="'+cusData.id+'" data-cus-name="'+cusData.name+'" data-sp-id="'+id+'" data-sp-name="'+namesp+'" title="" class="list-group-item cus-item">'+cusData.name+'</a>')
					});
				}
			}
			if(res.length == 0){
				$('#listCus').append('<p class="list-group-item">Không có tương tác nào</p>');
			}
		});
	});

	$('#listCus').on('click', '.cus-item', function(event) {
		event.preventDefault();
		var spid = $(this).attr('data-sp-id');
		var cusid = $(this).attr('data-cus-id');
		var namecus = $(this).attr('data-cus-name');
		var namesp = $(this).attr('data-sp-name');

		$('#delete-history').attr('data-sp-id', spid);
		$('#delete-history').attr('data-cus-id', cusid);
		var url = 'http://localhost:3000/chathistory/getMsg';
		$.get(url, {spid: spid, cusid: cusid}, function(data){
			console.log(data);
			$('#listMsg2').empty();
			for (var i = 0; i < data.length; i++) {
				if(data[i].type == 1){
					$('#listMsg2').append('<a class="list-group-item"><strong class="name-cus">'+namecus+':</strong> '+data[i].message+'<span class="pull-right time-history">'+data[i].datetime+'</span></a>');
				}
				else{
					$('#listMsg2').append('<a class="list-group-item"><strong class="name-sp">'+namesp+':</strong> '+data[i].message+'</a>');
				}
				
			}
		});
	});

	//Xoa lich su
	$('#delete-history').click(function(event) {
		var spid = $(this).attr('data-sp-id');
		var cusid = $(this).attr('data-cus-id');
		var url = 'http://localhost:3000/chathistory/deleteMsg';
		$.get(url, {spid: spid, cusid: cusid}, function(res){
			if(res == 'success'){
				$('#listMsg2').empty();
				alert('Đã xóa xong!');
			}
		});
	});
/*===== END MANAGE =======*/

function autoScroll(){
	if(listMsg.height() > 295){
		$('.group-message').scrollTop(listMsg[0].scrollHeight);
	}
}
function getRooms(rooms, curr_room = null){
	if(rooms.length > 0){
		$.each(rooms ,function(index, el) {
			if(el == null){
				//listRooms.append('<div class="list-group-item">Không có phòng chat nào</div>');
			}
			else if(el == curr_room){
				listRooms.append('<a href="javascript:void(0)" class="list-group-item active">'+el+'</a>');
			}
			else{
				if(curr_room == null){
					listRooms.append('<a href="javascript:void(0)" class="list-group-item" onclick="switchRoom(\''+ el +'\', '+curr_room+')">'+el+'</a>');
				}
				else
					listRooms.append('<a href="javascript:void(0)" class="list-group-item" onclick="switchRoom(\''+ el +'\', \''+curr_room+'\')">'+el+'</a>');
			}
		});
	}
}
function switchRoom(room, cur = null){
	socket.emit('switchRoom', room, cur, localStorage.spName, localStorage.spId);
}
function getCaret(el) { 
    if (el.selectionStart) { 
        return el.selectionStart; 
    } else if (document.selection) { 
        el.focus();
        var r = document.selection.createRange(); 
        if (r == null) { 
            return 0;
        }
        var re = el.createTextRange(), rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return rc.text.length;
    }  
    return 0; 
}

function getCharName(name){
    var split = name.split(" ");
    var sub = split[split.length - 1].substring(0,1);
    return sub;
}