var socket = io.connect('http://localhost:3000');
var $chatHeader = $('.chat-header');
var $chatContent = $('#chat-content');
var $fChat = $('#formChat');
var $chat = $('#chat');
var $rate = $('#rate-box');

var listMsg = $('#list-message');
var type_sp = $('#type_sp');
var username = $('#username');
var email = $('#email');
var phone = $('#phone');
var firstMsg = $('#firstMsg');
var msg = $('#message');
var customer = null;
var customerId = 0;
// if (typeof(Storage) !== "undefined") {
//   	if( typeof(localStorage.email) != "undefined"){
//   		socket.emit('getmessage');
// 	  	$fChat.hide();
// 	    $chat.show();
// 	}
// } else {
//     // Sorry! No Web Storage support..
// }

	$chatHeader.click(function(event) {
		$chatContent.slideToggle();
	});

	$fChat.validate({
		rules: {
			type_sp: {
				required: true,
			},
			username: {
				required: true,
			},
			email: {
				required: true,
				email: true,
			},
			phone:{
				required: true,
				minlength: 10,
				maxlength: 11,
			},
			firstMsg: {
				required: true,
			}
		},
		messages: {
			type_sp: {
				required: 'Vui long chon nhan vien de tu van',
			},
			username: {
				required: "Vui long nhap ho ten ban",
			},
			email: {
				required: "Vui long nhap vao email cua ban",
				email: "Email khong dung dinh dang",
			},
			phone:{
				required: "Vui long nhap so dien thoai cua ban",
				minlength: 'Sai so',
				maxlength: 'Sai so'
			},
			firstMsg: {
				required: 'Vui long nhap cau hoi',
			}
		}
	});
	socket.on('message', function(msg, name){
		var avatar = getCharName(name);
		var html = '<div class="item">';
			html += '<span class="serverImg" data-toggle="tooltip" data-placement="top" title="'+name+'">'+avatar+'</span><div class="msg-item">'+msg+'</div>';
			html += '</div>';
		listMsg.append(html);
		if(listMsg.height() > 250){
			$('.group-message').scrollTop(listMsg[0].scrollHeight);
		}
	});

	socket.on('currSession', function(ses){
		localStorage.sessionChat = ses;
		console.log('AA: '+ses);
	});

	$("#btn-info").click(function () {
        if ($fChat.valid()){
        	var data = {
        		type_sp: type_sp.val(),
     	  		username: username.val(),
        		email: email.val(),
        		phone: phone.val(),
        		msg: firstMsg.val()
        	};
        	//localStorage.email = email.val();
        	socket.emit('adduser', data);
        	$fChat.hide();
        	$chat.show();
        }
    });
    //Xu lý khi danh gia
	$('#btnRate').click(function(event) {
		if($('#fRate input[type="radio"][name="level"]:checked').length > 0){
			var level = $('#fRate').find('input[type="radio"][name="level"]:checked').val();
			socket.emit('rate', level, customerId);
			alert('Cảm ơn quý khách đã quan tâm.');
			$rate.hide();
			$fChat.show();
			$chatContent.slideUp();
		}
		else{
			$('#fRate .error').html('Vui lòng đánh giá cho chúng tôi');
		}
	});
    msg.keydown(function(event) {
    	if(event.keyCode == 13){
    		if($(this).val() !="" && $(this).val() !="\n"){
    			socket.emit('sendchat', $(this).val(), customer, customerId, 1, localStorage.supporterId, localStorage.sessionChat);
				var html = '<div class="item me">';
					html += '<div class="msg-item">'+$(this).val()+'</div>';
					html += '</div>';
				listMsg.append(html);
				if(listMsg.height() > 250){
					$('.group-message').scrollTop(listMsg[0].scrollHeight);
				}
			}
    		$(this).val('');
    	}

    });

socket.on('updatechat', function(msg, room, name){
	var html = '<div class="item me">';
		html += '<div class="msg-item">'+msg+'</div>';
		html += '</div>';
	listMsg.append(html);
	$('#roomname').val(room);
	customer = name;
});

socket.on('userinfo', function(id, type_sp, msg){
	$('#userid').val(id);
	customerId = id;
	var data = {id: id, type_sp: type_sp, msg: msg};
	socket.emit('userid', data);
});

socket.on('forNewRoom', function(msg, spName, spId){
	//$('#box-chat .heading-chat').html('Chat với '+spName);
	localStorage.supporterId =spId;
	listMsg.append('<div class="headerMsg">'+msg+'</div>');
	var cMsg = [];
	var msgLength = $('#list-message .msg-item').length;
	for(var i = 0; i < msgLength; i++){
		cMsg.push($('#list-message .msg-item:nth('+i+')').html())
	}
	socket.emit('clientMsg', cMsg, customer, customerId, spId, localStorage.sessionChat);
});

socket.on('forOldRoom', function(msg){
	listMsg.append('<div class="headerMsg">'+msg+'</div>');
});

socket.on('chathistory', function(data){
	listMsg.append('<li class="msg-item me">'+$(this).val()+'</span></li>');
	$('#chat .panel-body').scrollTop()
});

socket.on('outroom', function(msg){
	localStorage.removeItem('email');
});
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

function endChat(){
	localStorage.removeItem('email');
	localStorage.removeItem('sessionChat');
	$chat.hide();
	$rate.show();
	var room = $('#roomname').val();
	socket.emit('endChat', room);
}
function getCharName(name){
    var split = name.split(" ");
    var sub = split[split.length - 1].substring(0,1);
    return sub;
}