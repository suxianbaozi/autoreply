/**
 * 最牛逼的版本
 * v2.0
 * */



var Weibo = {};
Weibo.Assist = {};

function Queue(){
	this.list = [];
}
Queue.prototype = {
	get:function(){
		if(this.list[0]) {
			var cell =  this.list[0]
			this.list = this.list.splice(1,this.list.length);
			return cell;
		} else {
			return false;
		}
	},
	add:function(cell) {
		this.list.push(cell)
	},
	length:function(){
		return this.list.length;
	}
}

Weibo.Common = {
	userId:0,
	clientId:0,
	port:null,
	parseQuery:function(query) {
		var result = {};
		var qs = query.split('&');
		for(var i=0;i<qs.length;i++) {
			if(qs[i]) {
				data = qs[i].split('=');
				if(data[1]) {
					result[data[0]] = data[1];
				} else {
					result[data[0]] = '';
				}
			}
		}
		return result;
	},
	init:function(){
		try{
			//获取uid
			var scripts = document.getElementsByTagName('script');
	
			for(var i=0;i<scripts.length;i++) {
				if(scripts[i].innerHTML.indexOf('CONFIG')!=-1) {
					eval(scripts[i].innerHTML);
					break;
				}
			}
			this.userId = $CONFIG['uid'];
		} catch(e) {	
			alert('获取uid失败，请跳至主页');
			return;
		}
		if(!this.userId) {
			alert('获取uid失败，请跳至主页');
			return;
		}
		
		Weibo.Im.init(this.main.bind(this));
		this.port = chrome.extension.connect({name: "微博助手"});
		
		
		//状态版
		
		this.showStatus();
		this.checkMessage();
		this.sendThread();
		
		this.log('欢迎使用微博助手，相关信息将会在这儿显示...');
		this.log('你的uid:'+this.userId);
		this.log('祝你好运！');
		
		
		$("#close_pad").click(function(e) {
			
			var me = $(e.currentTarget);
			if(me.html()=='收起'){
				
				$("#status_pad").animate({
					left:-479
				});
				me.html('展开');
			} else {
				$("#status_pad").animate({
					left:0
				});
				me.html('收起');
			}
		});
	},
	showStatus:function(){
		$('<div style="position:fixed;left:-479px;bottom:0px;'
				+'border:1px solid black;'
				+'background-color:white;'
				+'width:500px;height:200px;"'
				+' id="status_pad"></div>').appendTo($(document.body));
		
		$("#status_pad").animate({
			left:0
		});
		
		$('<div id="pad_container" style="width:475px;float:left;"></div>').appendTo($("#status_pad"));
		
		$("<div id='pad_title' style='padding:5px;width:15px;float:left;'>状态板<br /><br /><br /><br />"
				+"<a id='close_pad'  href='javascript:;'>收起</a></div>").appendTo($("#status_pad"));
		
		$("#pad_title").css({
			'backgroundColor':'black',
			'color':'white',
			'fontSize':'12px',
			'padding':'2px;',
			'height':200
		});
		
		
		$('<div id="unfound_status" style="margin:20px;"><span id="unfound_num" '
				+' style="color:red;font-weight:bold;"'
				+' >0</span>条待手动回复&nbsp;&nbsp;'
				+'<input id="hand_reply_btn" style="width:60px; height:20px;" class="W_btn_b" type="button" value="立即回复" />'
				+'</div>').appendTo($("#pad_container"));
		$('<div id="console_pad" style="height:100px;overflow:auto;border:1px solid blue;margin:5px;"></div>').appendTo($("#pad_container"));
		$("#hand_reply_btn").unbind('click');
		$("#hand_reply_btn").click(this.handReply.bind(this));
	},
	handReply:function(e){
		var msg = this.unfoundQueue.pop();
		console.log(msg);
		if(msg) {
			var html = '<div id="reply_layer" style="'
			+'position:fixed;left:400px;top:100px; border:1px solid black;'
			+'background-color:white;padding:30px;'
			+'">'
			+'<div style="margin:10px;">'+msg.type+':'+msg.content+'</div>'
			+'<div style="margin:10px;">uid:'+msg.toUid+'</div>'
			+'<div style="margin:10px;"><textarea id="reply_hand_msg"></textarea></div>'
			+'<div>'
			+'<input id="reply_skip" style="width:60px; height:20px;margin:10px;" class="W_btn_b" type="button" value="跳过" />'
			+'<input id="reply_reply" style="width:60px; height:20px;margin:10px;" class="W_btn_b" type="button" value="回复" />'
			+'<input id="reply_cancel" style="width:60px; height:20px;margin:10px;" class="W_btn_b" type="button" value="取消" />'
			+'</div>'
			+'</div>'
			$("#reply_layer").remove();
			$(html).appendTo($(document.body));
			
			$("#reply_skip").click(function(){
				$("#reply_layer").remove();
				this.freshNum();
				this.handReply();
			}.bind(this));
			
			$("#reply_reply").click(function(){
				var message = $("#reply_hand_msg").val();
				if(message=='') {
					alert('不能为空！');
					return;
				}
				Weibo.Im.sendMessage(msg.toUid, message, function(){
					this.log(msg.type+':'+message+':'+',回复成功！');
					this.handReply();
				}.bind(this));
				$("#reply_layer").remove();
				this.freshNum();
				
			}.bind(this));
			$("#reply_cancel").click(function(){
				this.addUnfound(msg);
				$("#reply_layer").remove();
			}.bind(this));
		}
	},
	log:function(str){
		$('<p style="margin:5px;">'+str+'</p>').appendTo($("#console_pad"));
		$("#console_pad")[0].scrollTop += 30;
	},
	main:function(data) {
		var COMMENT = new Weibo.Assist.Comment();
		COMMENT.init();
		this.comment = COMMENT;
		var message = new Weibo.Assist.Message();
		message.setComment(COMMENT);
		message.init();
		var notesboard = new Weibo.Assist.Notesboard();
		notesboard.setComment(COMMENT);
		notesboard.init();
		
		var at =  new Weibo.Assist.AtMe();
		at.init();
		
		var like = new Weibo.Assist.Like();
		like.setComment(COMMENT);
		like.init();
		
		this.black = new Weibo.Assist.blackWords();
		this.black.init();
		
		
		this.white = new Weibo.Assist.whiteIds();
		this.white.init();
		
		//var hotComment = new Weibo.Assist.hotAutoComment();
		//this.addApp(hotComment);
	},
	addApp:function(app) {
		app.setOwns(this);
		app.init();
		var btn = app.getBtn();
		$("#left_container").append(btn);
	}
	,
	notification:function(title,message,icon) {
		icon = icon || "icon.png";
		this.port.postMessage({
			action: "noti",
			'message':message,
			'title':title,
			'icon':icon
		});
	},
	replyMessageQueue:new Queue(),
	messageQueue:new Queue(),
	checkMessage:function(){
		window.setInterval(function(){
			var msg = this.replyMessageQueue.get();
			if(msg) {
				this.getMessage(msg,function(txt,msg){
					for(var i=0;i<txt.length;i++) { 
						this.messageQueue.add({
							'toUid':msg.toUid,
							'content':msg.content,
							'reply':txt[i],
							'type':msg.type
						});
					}
				}.bind(this));
			}
		}.bind(this),2000);
	},
	sendThread:function(){
		var msg = this.messageQueue.get();
		if(!msg) {
			window.setTimeout(this.sendThread.bind(this),2000);
			return;
		} else {
			Weibo.Im.sendMessage(msg.toUid, msg.reply, function(){
				this.log(msg.type+':'+msg.content+',回复内容:'+msg.reply+',已回复！');
				this.sendThread();
			}.bind(this));
		}
	},
	unfoundQueue:[]
	,
	getMessage:function(msg,callback){
		$.ajax({
		  type: 'POST',
		  url: 'http://api.wood-spring.com/api.php',
		  data: {
			  'action':'get_message',
			  'message':msg.content,
			  'uid':this.userId
		  },
		  success: function(data){
			  console.log(data);
			  if(data.length!=0) {
				  callback(data,msg);
				  this.log(msg.type+':'+msg.content+'匹配回复：'+data);
			  } else {
				  this.log(msg.type+':'+msg.content+'没有找到回复，已添加至回复队列!');
				  this.addUnfound(msg);
			  }
		  }.bind(this),
		  dataType: 'json'
		});
	},
	addUnfound:function(msg) {
		this.unfoundQueue.push(msg);
		this.freshNum();
	},
	freshNum:function(){
		$("#unfound_num").html(this.unfoundQueue.length);
	}
}

Weibo.Im = {
	msgIndex:1,
	clientId:0,
	msg:{},
	channel:'',
	server:'',
	init:function(callback){
		$.get('http://nas.im.api.weibo.com/im/webim.jsp',{
			v:'1.1',
			returntype:'json',
			uid:Weibo.Common.userId,
			callback:'Weibo.Im._init'
		},function(data) {
			eval(data);
			callback();
		},'text');
	},
	_init:function(data) {
		this.channel = data.channel;
		this.server = data.server;
	}
	,
	imRequest:function(callName,message) {
		$.get(this.server+'im',{
			jsonp:callName,
			message:message,
			t:new Date().getTime()
		},
		function(data) {
			eval(data);
		},'text');
	},
	sendSuccess:function(){
		
	},
	sended:function(data) {
		console.log('发送成功');
		this.sendSuccess(data);
	},
	_sendMessage:function(){
		var message = '[{"channel":"/im/req","data":{"uid":"';
		message += this.msg['uid'];
		message += '","seq":"'+this.msg['uid']+'","msg":"';
		message += this.msg['text']+'","cmd":"msg"},';
		message += '"id":'+(this.msgIndex++)+',"clientId":"'+this.clientId+'"}]';
		this.imRequest('Weibo.Im.sended',message);
	}
	,
	sendMessage:function(uid,text,callback) {
		this.msg['uid'] = uid;
		this.msg['text'] = text;
		this.sendSuccess = callback;
		this.handleShake();
	},
	subscribe:function(data){
		this._sendMessage();
	},
	connected:function(data) {
		console.log('连接成功...');
		console.log('注册上线...');
		this.imRequest(
			'Weibo.Im.subscribe',
			'[{"channel":"/meta/subscribe",\
			"subscription":"'+this.channel+'",\
			"id":'+(this.msgIndex++)+',\
			"clientId":"'+this.clientId+'"},\
			{"channel":"/im/req",\
			"data":{"online":"1","limit":"2000","seq":"min","cmd":"roster"},\
			"id":'+(this.msgIndex++)+',"clientId":"'+this.clientId+'"}]')
	},
	connect:function(callName){
		this.imRequest(
			callName,
			'[{"channel":"/meta/connect",\
			"connectionType":"callback-polling","id":'+(this.msgIndex++)+',\
			"clientId":"'+this.clientId+'"}]'
		)
	}
	,
	handleShakeSuccess:function(data) {
		console.log('握手成功...');
		console.log(data);
		var d = data[0];
		this.clientId = Weibo.Common.clientId = d.clientId;
		console.log('连接...');
		//connect
		this.connect('Weibo.Im.connected');
	},
	handleShake:function(){
		console.log('握手...');
		this.imRequest(
			'Weibo.Im.handleShakeSuccess',
			'[{"version":"1.0",\
			"minimumVersion":"0.9",\
			"channel":"/meta/handshake",\
			"supportedConnectionTypes":{"0":"callback-polling"},\
			"id":'+(this.msgIndex++)+'}]'
		)
	}
}


Weibo.Assist.Comment = function() {
	this.userId = 0;
	this.hasReply = {};
	this.keyList = {};
	this.defaultKey = '';
}
Weibo.Assist.Comment.prototype = {
	'init':function(){
		var div = $("<div></div>");
		$(document.body).append(div);
		$(div).html('<div id="left_container"></div>');
		$(div).attr('class','gn_topmenulist');
		
		$(div).css({
			'position':'fixed',
			'width':100,
			'height':'auto',
			'left':-120,
			'bottom':212,
			'zIndex':999,
			'padding':5
		});
		$(div).animate({
			'left':4
		});
		this.userId = Weibo.Common.userId;
		$('<div id="box_container"></div>').appendTo($(document.body));
		$("#box_container").css({
			'position':'fixed',
			'top':100,
			'left':200,
			'width':980,
			'height':'auto'
		});
		
		var keywordBtn = $('<p><input id="my_keywords" style="width:80px; height:30px;" class="W_btn_b" type="button" value="我的关键词" /></p>')
		$("#left_container").append(keywordBtn);
		
		
		var defaultKeywordBtn = $('<p><input id="my_default_keywords" style="width:80px; height:30px;" class="W_btn_b" type="button" value="赞回复内容" /></p>')
		$("#left_container").append(defaultKeywordBtn);
		
		$('<p><input id="black_words" style="width:80px; '
				+'height:30px;" class="W_btn_b" type="button" value="黑名单" /></p>').appendTo($("#left_container"));
				
		
		$('<p><input id="white_ids" style="width:80px; '
				+'height:30px;" class="W_btn_b" type="button" value="白名单" /></p>').appendTo($("#left_container"));
		
		
		$("#left_container p").css(
		{
			'margin-top':5,
			'text-align':'center'
		}		
		);
		$("#my_keywords").toggle(this.showKeyList.bind(this),function(){
			$("#keyList").animate({
				'left':-300
			});
			return;
		});
		$("#my_default_keywords").click(this.showDefaultKey.bind(this));
		
		
		
		
		var commentOpenBtn = '<p style="margin-top:10px;'
							+'padding-top:10px;'
							+'border-top:1px solid black;">'
							+'&nbsp;&nbsp;&nbsp;&nbsp;评论:'
							+'<input id="comment_box"  class="open" type="checkbox" />'
							+'</p>'
							+'<br />';
							
							
		$("#left_container").append($(commentOpenBtn));
		
		var messageOpenBtn = '<p>&nbsp;&nbsp;&nbsp;&nbsp;私信:'
							+'<input id="message_box"  class="open" type="checkbox" />'
							+'</p><br />';
		
		$("#left_container").append(messageOpenBtn);
		
		var notesOpenBtn = '<p>未关注:'
						+'<input id="notes_box"  class="open" type="checkbox" />'
						+'</p><br />';
		$("#left_container").append(notesOpenBtn);
		
		
		var atOpenBtn = '<p>@我的:'
			+'<input id="at_box"  class="open" type="checkbox" />'
			+'</p><br />';
		$("#left_container").append(atOpenBtn);
		
		
		var likeOpenBtn = '<p>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;赞:'
			+'<input id="like_box"  class="open" type="checkbox" />'
			+'</p><br />';
		$("#left_container").append(likeOpenBtn);
		
		
		$("#left_container .open").css({
			marginLeft:10
		});
		$("#comment_box").click(this.commentLoop.bind(this));
		
		
		
		
		this.loadKeyList();
		this.loadDefault();
		//this.timeHandle = window.setInterval(this.getComment.bind(this),4000)
	},
	commentLoop:function(e){
		if($(e.currentTarget)[0].checked){
			this.timeHandle = window.setInterval(this.getComment.bind(this),4000)
		} else {
			window.clearInterval(this.timeHandle);
		}
	}
	,
	loadDefault:function() {
		
		$.getJSON('http://api.wood-spring.com/api.php?action=get_default',{
			'uid':this.userId
		},function(data) {
			if(!data.error) {
				this.defaultKey = data.text;
			} else {
				this.defaultKey = '听起来不错噢！';
			}
		}.bind(this))
		
	}
	,
	showDefaultKey:function(e) {
		
		var html =  '<div id="default_key_pop" style="padding:10px;" class="gn_topmenulist">';
		html += '<div style="margin-top:10px;">赞回复:<br /><br />';
		html += '<textarea id="defaultText" class="W_input" style="height:50px;width:220px;"></textarea>'
		html += '</div>';
		html += '<div style="margin-top:10px;text-align:right;">';
		html += '<input type=button id="do_default_key" class="W_btn_a" value="保存" style="height:20px;width:40px;" />'
		html += '&nbsp;&nbsp;';
		html += '<input type=button id="do_close_key"  class="W_btn_a" value="取消" style="height:20px;width:40px;" />'
		html += '</div>'
		html += '</div>';
		
		this.toBody($(html))
		$("#defaultText").val(this.defaultKey);
		$("#default_key_pop").css({
			left:-300,
			top:200,
			width:300,
			position:'fixed',
			height:0,
			height:130
		});
		$("#default_key_pop").animate({
			left:150
		});
		
		$("#do_default_key").unbind('click');
		$("#do_default_key").click(function(e) {
			this.defaultKey = $("#defaultText").val();
			
			$.post('http://api.wood-spring.com/api.php?action=set_default',{
				'text':this.defaultKey,
				'uid':this.userId
			},function(data) {
				
			},'json');
			
			$("#default_key_pop").remove();
		}.bind(this));
		
		$("#do_close_key").unbind('click');
		$("#do_close_key").click(function(e) {
			$("#default_key_pop").remove();
		});
	}
	,
	showKeyList:function(e){
		
		
		
		
		if($("#keyList")[0]) {
			$("#keyList").animate({
				'left':150
			});
			return;
		}
		
		
		var keyBox = $('<div id="keyList" class="gn_topmenulist"></div>');
		var action = $('<div class="action"></div>');
		keyBox.append(action);
		
		var addBtn = $('<input type="button" class="W_btn_a" value="+" />');
		action.append(addBtn);
		addBtn.css({
			'width':20,
			'height':20,
			'margin-left':5
		});
		addBtn.unbind('click');
		addBtn.click(this.addKey.bind(this));
		
		keyBox.css({
			'position':'fixed',
			'top':100,
			'width':300,
			'height':'auto',
			'zIndex':99
		})
		
		
		$('<ul id="key_list_container" style="padding:5px;padding-bottom:10px;  height:300px;overflow:auto;"></ul>').appendTo(keyBox);
		
		
		keyBox.animate({
			'left':150
		});
		
		this.toBody(keyBox);
		
		var keySortList = [];
		
		var re = [];
		for(var k in this.keyList) {
			
			if(!keySortList[this.keyList[k].rank]) {
			
				keySortList[this.keyList[k].rank] = this.keyList[k];
			} else {
				re.push(this.keyList[k]);
			}
		}
		
		for(var i=0;i<re.length;i++) {
			keySortList.push(re[i]);
		}
		
		for(var i=0;i<keySortList.length;i++) {
			if(!keySortList[i]) {
				continue;
			}
			this.keyViewAdd(keySortList[i].key,
					keySortList[i].text,
					keySortList[i].keyId);
		}
		
		
		$("#key_list_container").dragsort({ dragEnd:this.adjustSort.bind(this)});
		
	},
	adjustSort:function() {
		var items = [];
		$("#key_list_container li").each(function(index,item) {
			this.keyList[$(item).attr('key')]['rank'] = index;
		}.bind(this));
		this.syncRank();
	},
	syncRank:function(){
		var data = {};
		for(var k in this.keyList) {
			data[this.keyList[k].keyId] = this.keyList[k].rank;
		}
		$.post('http://api.wood-spring.com/api.php?action=sync_rank',{
			'list':data
		},function(data){
			
		});
	},
	loadKeyList:function() {
		$.getJSON("http://api.wood-spring.com/api.php?action=get_key_list",{
			'uid':this.userId
		},function(data) {
			for(var i=0;i<data.length;i++) {
				this.keyDataAdd(data[i].key,data[i].text,data[i].id,data[i].rank);
			}
		}.bind(this))
	}
	,
	addKey:function(e) {
		var html =  '<div id="add_key_pop" style="padding:10px;" class="gn_topmenulist">';
		html += '<div>';
		html += '<input placeholder="输入你的关键词..." type="text" id="keyWord" class="W_input">';
		html += '</div>'
		html += '<div style="margin-top:10px;">';
		html += '<textarea id="keyText" placeholder="输入该关键词的回复内容..." class="W_input" style="height:50px;width:220px; padding:5px;"></textarea>'
		html += '</div>';
		html += '<div style="margin-top:10px;text-align:right;">';
		html += '<input type=button id="do_add_key" class="W_btn_a" value="添加" style="height:20px;width:40px;" />'
		html += '&nbsp;&nbsp;';
		html += '<input type=button id="do_cancel_key"  class="W_btn_a" value="取消" style="height:20px;width:40px;" />'
		html += '</div>'
		
		html += '</div>';
		
		this.toBody($(html))
		
		$("#add_key_pop").css({
			left:-300,
			top:100,
			width:300,
			position:'fixed',
			height:0,
			height:130
		});
		$("#add_key_pop").animate({
			left:350
		});
		
		$("#do_add_key").unbind('click');
		$("#do_add_key").click(this.doAddKey.bind(this));
		
		$("#do_cancel_key").unbind('click');
		$("#do_cancel_key").click(function(e) {
			$("#add_key_pop").remove();
		});
	},
	doAddKey:function(e) {
		var keyWord  = $("#keyWord").val();
		var keyText = $("#keyText").val();
		
		$.post("http://api.wood-spring.com/api.php?action=add_key",{
			'key':keyWord,
			'text':keyText,
			'uid':this.userId,
			'rank':$("#key_list_container li").length
		},function(data) {
			this.keyDataAdd(keyWord,keyText,data.key_id,$("#key_list_container li").length);
			this.keyViewAdd(keyWord,keyText,data.key_id);
		}.bind(this),'json');
		$("#add_key_pop").remove();
	},
	keyDataAdd:function(key,text,keyId,rank) {
		this.keyList[key] = {'key':key,'text':text,'keyId':keyId,'rank':rank};
	}
	,
	keyViewAdd:function(key,text,keyId) {
		if(!(key && text)) {
			return;
		}
		$("#line_"+keyId).remove();
		
		var lineHtml = "<li style='height:20px; margin-top:5px;' key='"+key+"' key_id='"+keyId+"' id='line_"+keyId+"'>";
		lineHtml += "<input class='W_btn_a del' type='button' value='-' style='height:20px;width:20px;' />&nbsp;&nbsp;";
		lineHtml += "<input type='button' class='W_btn_b key_word_btn' style='line-height:20px;text-align:center;width:100px;height:20px;' value='"+key+"' />&nbsp;";
		lineHtml += "<img style='line-height:20px;vertical-align:bottom; margin-left:5px;' height=20 src='"+chrome.extension.getURL('drag.png')+"' /></li>";
		
		var keyLine = $(lineHtml);
		keyLine.appendTo($("#key_list_container"));
		keyLine.find(".del").unbind('click');
		keyLine.find(".del").click(this.delKey.bind(this));
		
		keyLine.find(".key_word_btn").unbind('click');
		keyLine.find(".key_word_btn").click(this.showText.bind(this));
	},
	showText:function(e) {
		var key = $(e.currentTarget).val();
		textData = this.keyList[key];
		alert(textData.text);
	}
	,
	delKey:function(e){
		$(e.currentTarget).parent().remove();
		var key = $(e.currentTarget).parent().attr('key');
		var keyId = $(e.currentTarget).parent().attr('key_id');
		delete this.keyList[key];
		$.getJSON('http://api.wood-spring.com/api.php?action=del_key',{
			'key_id':keyId
		},function(data) {
			
		});
	}
	,
	toBody:function(obj) {
		$(document.body).append(obj);
	},
	page:1,
	getComment:function(page){
		page = page || 1;
		STK = {};
		STK.pageletM = {};
		STK.pageletM.view = function(list){
			this.getData(list);
		}.bind(this)
		$.get(
			'http://www.weibo.com/comment/inbox?wvr=1&page='+page,
			{
				t:new Date().getTime()
			},
			function(rs){
				data = rs.split("<script>");
				for(var i=0;i<data.length;i++) {
				
					if(data[i].indexOf('"pid":"pl_content_commentList"')!='-1'){
						eval(data[i].split('</script>')[0]);
					}
				}
			}.bind(this)
		)
	},
	getData:function(list) {
		html =  list.html;
		var dom = $(html);
		var detail = dom.find("p span a");
		replys = [];
		detail.each(function(index,item) {
			if($(item).attr('action-type')=="replycomment") {
				replys.push(item);
			}
		});

		var replyDetails = [];

		for(var i=0;i<replys.length;i++) {

			var content = $(replys[i]).parent().parent().parent().find(".detail")[0];

			var detail = $(replys[i]).attr('action-data');
			detail = detail.split('&');

			det = {}
			det['comment'] = $(content).text();
			for(var j=0;j<detail.length;j++) {
				var keyValue = detail[j].split("=");
				det[keyValue[0]] = keyValue[1];
			}
			replyDetails.push(det);
		}
		this.createBox(replyDetails);
		
	},
	createBox:function(replyDetails){
		var tempList = [];
		for(var i =0;i<replyDetails.length;i++) {
			var det = replyDetails[i];
			if(Weibo.Common.black.checkBlack(det.comment) && (!Weibo.Common.white.checkWhite(det.ouid))){
				Weibo.Common.log('<span style="color:red;">删除评论:'+det.comment+'</span>');
				$.post('http://weibo.com/aj/comment/del?_wv=5&__rnd='+new Date().getTime(),{
					is_block:0,
					cid:det.cid,
					_t:0
				})
				continue;
			}
			if(!this.hasReply[det.cid]) {
				this.hasReply[det.cid] = 1;
				tempList.push(det);
			} 
		}
		if(tempList.length<=0) {
			return;
		}
		$.post("http://api.wood-spring.com/api.php?action=check_comment",{
			'list':tempList
		},function(data){
			if(data.length>0) {
				for(var i=0;i<data.length;i++){
					var det = data[i];
					var msg = {
						'content':det.comment,
						'toUid':det['ouid'],
						'type':'评论'
					}
					Weibo.Common.log('新的评论:'+msg.content);
					Weibo.Common.replyMessageQueue.add(msg);
				}
			}
			if(tempList.length && (data.length==tempList.length)) {
				this.page++;
				this.getComment(this.page);
			} else {
				this.page = 1;
			}
		}.bind(this),'json')
	}
	
}


//私信
Weibo.Assist.Message = function(){
	
}

Weibo.Assist.Message.prototype = {
	init:function(){
		//this.loopHandle = window.setInterval(this.getMessage.bind(this),4000);
		$("#message_box").click(this.messageLoop.bind(this));
	},
	messageLoop:function(e) {
		if($(e.currentTarget)[0].checked){
			this.loopHandle = window.setInterval(this.getMessage.bind(this),4000)
		} else {
			window.clearInterval(this.loopHandle);
		}
	}
	,
	setComment:function(c) {
		this.comment = c;
	},
	page:1,
	initData:function(data){
		var msgList = data.html;
		var dom=  $(msgList);
		var msgListDom = dom.find(".WB_msg_type")
		var newNum = 0;
		for(var i=0;i<msgListDom.length;i++) {
			var uid = $(msgListDom[i]).attr('uid');
			var content = $(msgListDom[i]).find(".msg_detail").html();
			var newMsg =   $(msgListDom[i]).find(".W_new_count").html();
			newMsg = parseInt(newMsg);
			if(newMsg>0) {
				newNum++;
				Weibo.Common.replyMessageQueue.add({
					'toUid':uid,
					'content':content,
					'type':'私信'
				});
				//已读
				
				$.post('http://www.weibo.com/aj/message/clearunread?_wv=5',{
					uids:uid
				},function(data){
					
				});
			}
		}
		if(msgListDom.length && (newNum==msgListDom.length)) {//这一页全是新的，那就继续第二页
			Weibo.Common.log('私信第一页全是新的，自动去第二页!');
			this.page++;
			this.getMessage(this.page);
		} else {
			this.page = 1;
		}
	},
	getReply:function(content){
		var content =  this.comment.getMessage(content);
		
		var t = new Date();
		var time = t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
		return content;
	},
	getMessage:function(page){
		page = page || 1;
		var STK = {};
		STK.pageletM = {};
		STK.pageletM.view = this.initData.bind(this);
		var messageUrl = 'http://www.weibo.com/messages?page='+page;
		$.get(messageUrl,{
			't':new Date().getTime()
		},function(data) {
			data = data.split("<script>");
			for(var i=0;i<data.length;i++) {
				if(data[i].indexOf('"pid":"pl_content_messageList"')!='-1'){
					eval(data[i].split('</script>')[0]);
				}
			}
		}.bind(this));
	}
}

Weibo.Assist.Notesboard = function(){
	this.noteList = {};
}


Weibo.Assist.Notesboard.prototype = {
	init:function(){
		//this.loopHandle = window.setInterval(this.getNotes.bind(this),4000);
		$("#notes_box").click(this.messageLoop.bind(this));
	},
	messageLoop:function(e) {
		if($(e.currentTarget)[0].checked){
			this.loopHandle = window.setInterval(this.getNotes.bind(this),4000)
		} else {
			window.clearInterval(this.loopHandle);
		}
	},
	setComment:function(c) {
		this.comment = c;
	},
	page:1,
	initData:function(data) {
		html = data.html;
		var dom = $(html);
		var boxList = dom.find(".msg_dialogue_list");
		var forCheck = [];
		for(var i=0;i<boxList.length;i++) {
			var mid = $(boxList[i]).attr('mid');
			var uid = $(boxList[i]).attr('uid');
			
			var reply = $(boxList[i]).find('.msg_ctrl a');
			var d = reply.attr('action-data');
			var content = $(boxList[i]).find('.msg_dia_txt').text();
			
			ds = d.split('&');
			dsData = {};
			for(var j=0;j<ds.length;j++) {
				var data = ds[j].split('=');
				dsData[data[0]] = data[1];
			}
			var d = {
					'mid':mid,
					'uid':uid,
					'uname':dsData['userName'],
					'content':content
				}
			forCheck.push(d);
		}
		if(forCheck.length>0) {
			$.post(
				'http://api.wood-spring.com/api.php?action=check_notes',
				{
					'user_id':this.comment.userId,
					'list':forCheck
				},
				function(data) {
					for(var k=0;k<data.length;k++) {
						Weibo.Common.replyMessageQueue.add({
							'toUid':data[k].uid,
							'content':data[k].content,
							'type':'未关注私信'
						});
					}
					if(forCheck.lengt && (data.length==forCheck.length)) { //全部是新的，自动下一页
						this.page++;
						Weibo.Common.log('未关注全是新的，自动进入下一页');
						this.getNotes(this.page);
					} else {
						this.page = 1;
					}
				}.bind(this),
				'json'
			);
		}
	},
	getNotes:function(page){
		page = page || 1
		var STK = {};
		STK.pageletM = {};
		STK.pageletM.view = this.initData.bind(this);
		
		var messageUrl = 'http://www.weibo.com/notesboard?leftnav=1&wvr=5'+'&page='+page;
		$.get(messageUrl,{
			't':new Date().getTime()
		},function(data) {
			data = data.split("<script>");
			for(var i=0;i<data.length;i++) {
				if(data[i].indexOf('"pid":"pl_content_notebox"')!='-1'){
					eval(data[i].split('</script>')[0]);
				}
			}
		}.bind(this));
	},
	
}



Weibo.Assist.app = function(){
	this.owns = null;
	this.setOwns = function(own){
		this.owns = own;
	}
}




Weibo.Assist.AtMe = function(){
	this.name = '热微博评论';
}.extend(Weibo.Assist.app);

addPrototype(Weibo.Assist.AtMe,{
	init:function(){
		$("#at_box").click(this.messageLoop.bind(this));
	},
	run:function(){
		
	},
	messageLoop:function(e) {
		if($(e.currentTarget)[0].checked){
			this.loopHandle = window.setInterval(function(){
				this.getContent(1);
			}.bind(this),4000)
		} else {
			window.clearInterval(this.loopHandle);
		}
	},
	getContent:function(page){
		$.getJSON('http://weibo.com/aj/at/mblog/list?page='+page+'&count=100',{
			t:new Date().getTime()
		},function(data) {
			var items = [];
			var dom = $('<div>'+data.data+'</div>');
			
			dom.find(".WB_feed_type").each(function(index,item){
				var ouid = Weibo.Common.parseQuery($(item).attr('tbinfo'));
				ouid = ouid['ouid'];
				items.push({
					'mid':$(item).attr('mid'),
					'text':$(item).find('.WB_text').eq(0).text().split("//@")[0],
					'ouid':ouid
				});
			})
			if(items.length==0) {
				return;
			}
			
			//将这些玩意同步到数据库
			$.post('http://api.wood-spring.com/api.php?action=check_at',{
				uid:Weibo.Common.userId,
				data:items
			},function(data) {
				for(var i=0;i<data.length;i++) {
					Weibo.Common.replyMessageQueue.add({
						'content':data[i].text,
						'toUid':data[i].ouid,
						'type':'@我的'
					});
				}
				if(items.length && (data.length==items.length)) {//两个相等，说明全部返回，那么取第二页
					this.getContent(++page);
				}
			}.bind(this),'json');
		}.bind(this))
	}
})


Weibo.Assist.Like = function(){
	this.name = '赞我的';
}

Weibo.Assist.Like.prototype = {
	init:function(){
		$("#like_box").click(this.messageLoop.bind(this));
	},
	messageLoop:function(e) {
		if($(e.currentTarget)[0].checked){
			this.loopHandle = window.setInterval(function(){
				this.getLikeList(1);
			}.bind(this),4000)
		} else {
			window.clearInterval(this.loopHandle);
		}
	},
	setComment:function(c){
		this.comment = c;
	},
	getLikeList:function(page){
		page = page || 1;
		$.get('http://weibo.com/like/inbox?leftnav=1&wvr=5&page='+page,{
			
		},
		function(data){
			data = data.split("<script>");
			var STK = {};
			STK.pageletM = {};
			STK.pageletM.view = function(content){
				var html = content.html;
				var dataList = [];
				$(html).find('.WB_feed_type').each(function(index,item) {
					var mid = $(item).attr('mid');
					//获取uid
					var uInfo = $(item).find('.face img').attr('usercard');
					uInfo = Weibo.Common.parseQuery(uInfo);
					var uid = uInfo['id'];
					var cell = {
						'mid':mid,
						'uid':uid
					}
					dataList.push(cell);
				});
				
				$.post('http://api.wood-spring.com/api.php?action=check_like',{
					'data':dataList,
					'uid':Weibo.Common.userId
				},function(data){
					for(var i=0;i<data.length;i++) {
						if(!data[i].replied) {
							Weibo.Common.messageQueue.add({
								'toUid':data[i].uid,
								'content':'赞',
								'reply':this.comment.defaultKey,
								'type':'赞'
							});
						}
					}
					if(dataList.length && (data.length==dataList.length)) {
						this.getLikeList(++page);
					}
				}.bind(this),'json');
			}.bind(this)
			for(var i=0;i<data.length;i++) {
				if(data[i].indexOf('"pid":"pl_content_likeList"')!='-1'){
					eval(data[i].split('</script>')[0]);
				}
			}
		}.bind(this),'text');
	}
}

Weibo.Assist.blackWords = function(){
	this.blackWords = '';
}
Weibo.Assist.blackWords.prototype = {
	
	init:function(){
		$("#black_words").toggle(function(e){
			$('<div id="black_words_edit"></div>').appendTo($(document.body));
			$("#black_words_edit").css({
				'position':'fixed',
				'border':'1px solid black',
				'width':400,
				'height':'auto',
				'left':200,
				'top':100,
				'backgroundColor':'white',
				'padding':5
			});
			$('<p style="padding:10px 10 10px 0;color:red;font-weight:bold;">逗号(,)隔开，注意是英文逗号！</p>').appendTo($("#black_words_edit"))
			$('<textarea style="width:380px;height:150px;margin:10px;" id="black_words_text"></textarea>').appendTo($("#black_words_edit"));
			$('<p style="text-align:right;"><input id="black_words_save" style="width:40px;height:20px;" type="button" value="确定" class="W_btn_b" /></p>').appendTo($("#black_words_edit"));
			
			$("#black_words_save").unbind('click');
			$("#black_words_save").click(function(e){
				this.blackWords = $("#black_words_text").val();
				$("#black_words").click();
				
				
				$.post('http://api.wood-spring.com/api.php?action=save_black',{
					uid:Weibo.Common.userId,
					content:this.blackWords
				},function(data) {
					
				});
			}.bind(this));
			console.log(this);
			$("#black_words_text").val(this.blackWords);
			
		}.bind(this),function(e){
			$("#black_words_edit").remove();
		}.bind(this));
		
		$.getJSON('http://api.wood-spring.com/api.php?action=get_black',{
			uid:Weibo.Common.userId
		},function(data) {
			this.blackWords = data.text;
		}.bind(this));
		
	},
	checkBlack:function(message){
		if(this.blackWords) {
			var wordsList = this.blackWords.split(',');
			for(var i=0;i<wordsList.length;i++) {
				if(wordsList[i] && message.indexOf(wordsList[i])!='-1') {
					return true;
				}
			}
		}
		return false;
	}
}

Weibo.Assist.whiteIds = function(){
	
}
Weibo.Assist.whiteIds.prototype = {
	init:function(){
		$("#white_ids").toggle(function(e){
			$('<div id="white_ids_edit"></div>').appendTo($(document.body));
			$("#white_ids_edit").css({
				'position':'fixed',
				'border':'1px solid black',
				'width':400,
				'height':'auto',
				'left':200,
				'top':100,
				'backgroundColor':'white',
				'padding':5
			});
			$('<p style="padding:10px 10 10px 0;color:red;font-weight:bold;">小号id 逗号(,)隔开，注意是英文逗号！</p>').appendTo($("#white_ids_edit"))
			$('<textarea style="width:380px;height:150px;margin:10px;" id="white_ids_text"></textarea>').appendTo($("#white_ids_edit"));
			$('<p style="text-align:right;"><input id="white_ids_save" style="width:40px;height:20px;" type="button" value="确定" class="W_btn_b" /></p>').appendTo($("#white_ids_edit"));
			
			$("#white_ids_save").unbind('click');
			$("#white_ids_save").click(function(e){
				this.whiteIds = $("#white_ids_text").val();
				$("#white_ids").click();
				$.post('http://api.wood-spring.com/api.php?action=save_white',{
					uid:Weibo.Common.userId,
					content:this.whiteIds
				},function(data) {
					
				});
			}.bind(this));
			$("#white_ids_text").val(this.whiteIds);
		}.bind(this),function(e) {
			$("#white_ids_edit").remove();
		}.bind(this));
		
		$.getJSON('http://api.wood-spring.com/api.php?action=get_white',{
			uid:Weibo.Common.userId
		},function(data) {
			this.whiteIds = data.text;
		}.bind(this));
		
	},
	checkWhite:function(uid){
		if(this.whiteIds) {
			var wordsList = this.whiteIds.split(',');
			for(var i=0;i<wordsList.length;i++) {
				if(wordsList[i] && uid==wordsList[i]) {
					return true;
				}
			}
		}
		return false;
	}
}

Weibo.Common.init();
