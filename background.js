chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
		if(msg.action=='noti') {
			
			msg.message = msg.message.replace(/[\n\t ]/g,"");
			
			var notification = webkitNotifications.createNotification(
			  msg.icon,  // 图标URL，可以是相对路径
			  msg.title,  // 通知标题
			  msg.message  // 通知正文文本
			);
			// 然后显示通知。
			notification.show();
		}
	});
});