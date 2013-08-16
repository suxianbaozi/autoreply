function WeiboAssist () {
	this.userId = 0;
}
WeiboAssist.prototype = {
	'init':function(){
		var div = $("<div></div>");
		$(document.body).append(div);
		$(div).html('<h1 style="font-size:12px;padding:2px;">微博助手v1.0</h1><hr></hr><div id="left_container"></div>');
		$(div).attr('class','gn_topmenulist');
		
		$(div).css({
			'position':'fixed',
			'width':120,
			'height':300,
			'left':-120,
			'top':200
		});
		$(div).animate({
			'left':0
		});
		var url = location.href;
		url  = url.split("?");
		url = (/(\d+)/.exec(url));
		this.userId = url[0];
		
		$('<div id="box_container"></div>').appendTo($(document.body));
		$("#box_container").css({
			'position':'fixed',
			'top':100,
			'left':200,
			'width':980,
			'height':'auto'
		});
		var containerHtml = '<p>ID:'+this.userId+'</p>';
		$("#left_container").html(containerHtml);
		this.getComment();
	},
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
	createBox:function(replyDetails){
		
		$.post("http://qiu.guwenzi.org/api.php?action=check_comment",{
			'list':replyDetails
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
					
					$("#pop_box_"+det.cid+" .status").html('开始自动回复....');
					$.post("http://www.weibo.com/aj/comment/add?_wv=5&__rnd="+new Date().getTime(),
						{
							act:'reply',
							mid:det['mid'],
							cid:det['cid'],
							uid:det['status_owner_user'],
							forward:0,
							isroot:0,
							content:'SB '+det.content+', what do you want to say ?'+new Date().getTime(),
							ouid:det['ouid'],
							ispower:det['ispower'],
							status_owner_user:det['status_owner_user'],
							_t:0,
							repeatNode:'javascript:;',
							location:'commbox',
						},function(data) {
							$("#pop_box_"+det.cid+" .status").html('自动回复成功！');
							window.setTimeout(function(){
								$("#pop_box_"+det.cid).hide()
							},3000);
						}
					);
				}
			} 
			
			window.setTimeout(this.getComment.bind(this),3000);
			
		}.bind(this),'json')
	}
	
}

$(function(){
	var assist = new WeiboAssist();
	assist.init();
})
//uiu


//window.setInterval(getData,2000);
