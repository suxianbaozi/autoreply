var Weibo = {};
Weibo.Assist = {};



var PORT = chrome.extension.connect({name: "微博助手"});

PORT.onMessage.addListener(function(msg) {
});



Weibo.Common = {
	'userId':0,
	'notification':function(title,message,icon) {
		icon = icon || "icon.png";
		PORT.postMessage({
			action: "noti",
			'message':message,
			'title':title,
			'icon':icon
			});
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
		var url = location.href;
		url  = url.split("?");
		url = (/(\d+)/.exec(url));
		this.userId = url[0];
		Weibo.Common.userId = this.userId;
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
		
		$.getJSON('http://qiu.guwenzi.org/api.php?action=get_default',{
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
		html += '<div style="margin-top:10px;">';
		html += '默认回复<textarea id="defaultText" class="W_input" style="height:50px;width:180px;"></textarea>'
		html += '</div>';
		html += '<div style="margin-top:10px;text-align:right;">';
		html += '<input type=button id="do_default_key" class="W_btn_a" value="保存" style="height:30px;width:40px;" />'
		html += '&nbsp;&nbsp;';
		html += '<input type=button id="do_close_key"  class="W_btn_a" value="取消" style="height:30px;width:40px;" />'
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
			left:200
		});
		
		$("#do_default_key").unbind('click');
		$("#do_default_key").click(function(e) {
			this.defaultKey = $("#defaultText").val();
			
			$.post('http://qiu.guwenzi.org/api.php?action=set_default',{
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
			'top':200,
			'width':180,
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
		$("#key_list_container").dragsort();
		
	},
	loadKeyList:function() {
		$.getJSON("http://qiu.guwenzi.org/api.php?action=get_key_list",{
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
		html += '&nbsp;&nbsp;&nbsp;&nbsp;关键词<input type="text" id="keyWord" class="W_input">';
		html += '</div>'
		html += '<div style="margin-top:10px;">';
		html += '回复内容<textarea id="keyText" class="W_input" style="height:50px;width:180px;"></textarea>'
		html += '</div>';
		html += '<div style="margin-top:10px;text-align:right;">';
		html += '<input type=button id="do_add_key" class="W_btn_a" value="添加" style="height:30px;width:40px;" />'
		html += '&nbsp;&nbsp;';
		html += '<input type=button id="do_cancel_key"  class="W_btn_a" value="取消" style="height:30px;width:40px;" />'
		html += '</div>'
		
		html += '</div>';
		
		this.toBody($(html))
		
		$("#add_key_pop").css({
			left:-300,
			top:200,
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
		
		$.post("http://qiu.guwenzi.org/api.php?action=add_key",{
			'key':keyWord,
			'text':keyText,
			'uid':this.userId
		},function(data) {
			this.keyDataAdd(keyWord,keyText,data.key_id);
			this.keyViewAdd(keyWord,keyText,data.key_id);
		}.bind(this),'json');
		$("#add_key_pop").remove();
	},
	keyDataAdd:function(key,text,keyId) {
		this.keyList[key] = {'key':key,'text':text,'keyId':keyId};
	}
	,
	keyViewAdd:function(key,text,keyId) {
		if(!(key && text)) {
			return;
		}
		$("#line_"+keyId).remove();
		var keyLine = $("<li key='"+key+"' key_id='"+keyId+"' id='line_"+keyId+"'><input class='W_btn_a del' type='button' value='-' style='height:20px;width:20px;' />&nbsp;&nbsp;<input type='button' class='W_btn_b key_word_btn' style='text-align:center;margin-top:5px;width:100px;height:20px;' value='"+key+"' />&nbsp;<span>拖</span></li>");
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
		$.getJSON('http://qiu.guwenzi.org/api.php?action=del_key',{
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
		for(var k in this.keyList) {
			if(comment.toUpperCase().indexOf(k.toUpperCase())!='-1') {
				replyText = this.keyList[k].text;
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
		
		$.post("http://qiu.guwenzi.org/api.php?action=check_comment",{
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
					
					
					$.post("http://www.weibo.com/aj/comment/add?_wv=5&__rnd="+new Date().getTime(),
						{
							act:'reply',
							mid:det['mid'],
							cid:det['cid'],
							uid:det['status_owner_user'],
							forward:0,
							isroot:0,
							content:'@'+det['content']+' '+replyText,
							ouid:det['ouid'],
							ispower:det['ispower'],
							status_owner_user:det['status_owner_user'],
							_t:0,
							repeatNode:'javascript:;',
							location:'commbox',
						},function(data) {
							
							Weibo.Common.notification('新的评论',"“"+det['comment']+'”;已自动回复,内容:“'+'@'+det['content']+' '+replyText+'”','comment.png');
							$("#pop_box_"+det.cid+" .status").html('回复成功');
							window.setTimeout(function(){
								$("#box_container .pop_box").hide()
							},3000);
						}
					);
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
		return content +' ('+ time+'发)';
	}
	,
	autoReply:function(uid,message,content){
		
		
		
		var layer = $('<div id="message_pop_'+uid+'"><div class="content"></div><div class="status"></div></div>');
		$(document.body).append(layer);
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
			$.post(
				'http://weibo.com/aj/message/add?_wv=5&__rnd='+new Date().getTime(),
				{
					'text':message,
					'uid':uid,
					'fids':'',
					'style_id':1,
					'location':'msgdialog',
					'module':'msgissue',
					'_t':0,
				},
				function(){
					Weibo.Common.notification('新的私信',"“"+content+'”;已自动回复,内容:“'+message+'”','message.png');
					layer.find('.status').html('回复成功！');
					window.setTimeout(function(){layer.remove();},4000);
				}.bind(this)
			);
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
				'http://qiu.guwenzi.org/api.php?action=check_notes',
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
		return content +' ('+ time+'发)';
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
				Weibo.Common.notification('新未关注私信',"“"+d.content+'”;已自动回复,内容:“'+this.getReply(d.content)+'”','note.png');
			}.bind(this)
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


function main() { 
	var COMMENT = new Weibo.Assist.Comment();
	COMMENT.init();
	var message = new Weibo.Assist.Message();
	message.setComment(COMMENT);
	message.init();
	
	var notesboard = new Weibo.Assist.Notesboard();
	notesboard.setComment(COMMENT);
	notesboard.init();
}
main();
	
	
	
//uiu


//window.setInterval(getData,2000);
