/**
 * 最牛逼的版本
 * */

var Weibo = {};
Weibo.Assist = {};


Weibo.Common = {
	userId:0,
	clientId:0,
	port:null,
	init:function(){
		var url = location.href;
		url  = url.split("?");
		url = (/(\d+)/.exec(url));
		this.userId = url[0];
		Weibo.Im.init(this.main.bind(this));
		this.port = chrome.extension.connect({name: "微博助手"});
	},
	main:function(data) {
		var COMMENT = new Weibo.Assist.Comment();
		COMMENT.init();
		var message = new Weibo.Assist.Message();
		message.setComment(COMMENT);
		message.init();
		var notesboard = new Weibo.Assist.Notesboard();
		notesboard.setComment(COMMENT);
		notesboard.init();
	},
	notification:function(title,message,icon) {
		icon = icon || "icon.png";
		this.port.postMessage({
			action: "noti",
			'message':message,
			'title':title,
			'icon':icon
		});
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
		console.log(data);
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
		console.log(data);
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
			'top':200,
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
		//var containerHtml = $('<p class="icon_promotion">ID:'+this.userId+'</p>');
		//$("#left_container").append(containerHtml);
		
		
		var keywordBtn = $('<p><input id="my_keywords" style="width:80px; height:30px;" class="W_btn_b" type="button" value="我的关键词" /></p>')
		$("#left_container").append(keywordBtn);
		
		
		var defaultKeywordBtn = $('<p><input id="my_default_keywords" style="width:80px; height:30px;" class="W_btn_b" type="button" value="默认关键词" /></p>')
		$("#left_container").append(defaultKeywordBtn);
		
		
		$("#left_container p").css(
		{
			'margin-top':5,
			'text-align':'center'
		}		
		);
		$("#my_keywords").toggle(this.showKeyList.bind(this),function(){
			$("#keyList").animate({
				'left':-200
			});
			return;
		});
		$("#my_default_keywords").click(this.showDefaultKey.bind(this));
		this.loadKeyList();
		this.loadDefault();
		window.setInterval(this.getComment.bind(this),4000)
	},
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
		html += '<div style="margin-top:10px;">默认回复:<br /><br />';
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
			'width':170,
			'height':'auto',
			'zIndex':99
		})
		
		
		$('<ul id="key_list_container" style="padding:5px;padding-bottom:10px;"></ul>').appendTo(keyBox);
		
		
		keyBox.animate({
			'left':150
		});
		
		this.toBody(keyBox);
		
		for(var k in this.keyList) {
			this.keyViewAdd(this.keyList[k].key,this.keyList[k].text,this.keyList[k].keyId);
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
				this.keyDataAdd(data[i].key,data[i].text,data[i].id);
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
	}
	,
	getComment:function(){
		STK = {};
		STK.pageletM = {};
		STK.pageletM.view = function(list){
			this.getData(list);
		}.bind(this)
		$.get(
			'http://www.weibo.com/comment/inbox?wvr=1',
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
	getMessage:function(comment){
		var replyText = this.defaultKey;
		
		var items = [];
		$("#key_list_container li").each(function(index,item){
			items.push(item);
		}.bind(this));
		
		for(var i=0;i<items.length;i++) {
			item = items[i];
			if(comment.toUpperCase().indexOf($(item).attr('key').toUpperCase())!='-1') {
				replyText = this.keyList[$(item).attr('key')].text;
				break;
			}
		}
		
		return replyText;
	},
	createBox:function(replyDetails){
		var tempList = [];
		for(var i =0;i<replyDetails.length;i++) {
			var det = replyDetails[i];
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
					
					
					
					var box = $("<div class='pop_box' id='pop_box_"+det.cid+"'></div>");
					box.css({
						'padding':10,
						'width':180,
						'height':180,
						'backgroundColor':'black',
						'opacity':0.8,
						'border-radius':5,
						'color':'white',
						'margin':10,
						'float':'left'
					});
					var c = '';
					for(var k in det) {
						c += '<p style="margin-top:5px;">'+k+':'+det[k]+'</p>';
					}
					c += '<p class="status" style="color:green;margin-top:5px;"></p>';
					
					box.html(c);
					
					$("#box_container").append(box);
					
					$("#pop_box_"+det.cid+" .status").html('自动回复中...');
					var replyText = this.getMessage(det.comment);
					Weibo.Im.sendMessage(det['ouid'], replyText,function(data) {
						Weibo.Common.notification('新的评论',"“"+det['comment']+'”;已自动回复,内容:“'+replyText+'”','comment.png');
						$("#pop_box_"+det.cid+" .status").html('回复成功');
						window.setTimeout(function(){
							$("#box_container .pop_box").hide()
						},3000);
					}.bind(this));
				}
			} 
		}.bind(this),'json')
	}
	
}


//私信
Weibo.Assist.Message = function(){
	
}

Weibo.Assist.Message.prototype = {
	init:function(){
		window.setInterval(this.getMessage.bind(this),4000);
	},
	setComment:function(c) {
		this.comment = c;
	},
	initData:function(data){
		var msgList = data.html;
		var dom=  $(msgList);
		var msgListDom = dom.find(".WB_msg_type")
		for(var i=0;i<msgListDom.length;i++) {
			var uid = $(msgListDom[i]).attr('uid');
			var content = $(msgListDom[i]).find(".msg_detail").html();
			var newMsg =   $(msgListDom[i]).find(".W_new_count").html();
			newMsg = parseInt(newMsg);
			if(newMsg>0) {
				var message = this.getReply(content);
				this.autoReply(uid,message,content);
			}
		}
	},
	getReply:function(content){
		var content =  this.comment.getMessage(content);
		var t = new Date();
		var time = t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
		return content;
	}
	,
	autoReply:function(uid,message,content){
		
		
		
		var layer = $('<div id="message_pop_'+uid+'"><div class="content"></div><div class="status"></div></div>');
		$("#box_container").append(layer);
		$("#message_pop_"+uid).css({
			'padding':10,
			'position':'fixed',
			'left':200,
			'top':200,
			'width':200,
			'height':'auto',
			'opacity':0.8,
			'border-radius':5,
			'color':'white',
			'backgroundColor':'black'
		});
		
		layer.find('.content').html('uid:'+uid+'<br />'+'message:'+content);
		layer.find('.status').html('自动回复...');
		//让该信息无效
		$.get('http://weibo.com/message/history?uid='+uid,{
			't':new Date().getTime()
		},function(data) {
			Weibo.Im.sendMessage(uid,message,function(){
				Weibo.Common.notification('新的私信',"“"+content+'”;已自动回复,内容:“'+message+'”','message.png');
				layer.find('.status').html('回复成功！');
				window.setTimeout(function(){layer.remove();},4000);
			}.bind(this));
		}.bind(this));
	},
	getMessage:function(){
		
		var STK = {};
		STK.pageletM = {};
		STK.pageletM.view = this.initData.bind(this);
		
		var messageUrl = 'http://www.weibo.com/messages?leftnav=1&wvr=5';
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
		window.setInterval(this.getNotes.bind(this),4000);
	},
	setComment:function(c) {
		this.comment = c;
	},
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
			
			
			if(!this.noteList[mid]) {
				var d = {
						'mid':mid,
						'uid':uid,
						'uname':dsData['userName'],
						'content':content
					}
				forCheck.push(d);
				this.noteList[mid] = d;
			}
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
						this.reply(data[k]);
					}
				}.bind(this),
				'json'
			);
		}
		
	},
	getReply:function(content){
		var content =  this.comment.getMessage(content);
		var t = new Date();
		var time = t.getHours()+':'+t.getMinutes()+':'+t.getSeconds();
		return content ;
	},
	reply:function(d) {
		$.post(
			'http://www.weibo.com/aj/message/add?_wv=5&__rnd='+new Date().getTime(),
			{
			'text':this.getReply(d.content),
			'screen_name':d.uname,
			'id':0,
			'fids':'',
			'touid':0,
			'style_id':2,
			'location':'',
			'module':'msglayout',
			'_t':0
			},function(data) {
				if(data.code=='100000') {
					Weibo.Common.notification('新未关注私信',"“"+d.content+'”;已自动回复,内容:“'+this.getReply(d.content)+'”','note.png');
				} else {
					Weibo.Common.notification('新未关注私信',"“"+d.content+'”;已自动回复,内容:“'+this.getReply(d.content)+'”'+'失败！'+data.msg,'note.png');
				}
			}.bind(this),'json'
		);
		
	}
	,
	getNotes:function(){
		var STK = {};
		STK.pageletM = {};
		STK.pageletM.view = this.initData.bind(this);
		
		var messageUrl = 'http://www.weibo.com/notesboard?leftnav=1&wvr=5';
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


Weibo.Common.init();
