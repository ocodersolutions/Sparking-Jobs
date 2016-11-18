(function($, Models, Collections, Views) {
	$(document).ready(function() {
		Views.PrivateMessageModal = Views.Modal_Box.extend({
			el: 'div#modal_msg',
			events: {
				'submit form#private_msg_form': 'submit'
			},
			initialize: function(options) {
				Views.Modal_Box.prototype.initialize.apply(this, arguments);
				this.blockUi = new Views.BlockUi();
				this.$form = this.$el.find('form');
				this.initValidate();
			},
			open: function(data){
				var view = this;
				view.openModal();
				this.model = new Models.PrivateMessage();
				view.setup(data);
			},
			setup: function(data){
				var view = this;
				var to_user = data.to_user;
				view.$el.find('.avatar-profile').html(to_user.avatar);
				view.$el.find('.name-profile').html(to_user.user_name);
				view.$el.find('.position-profile').html(to_user.position);
				view.$el.find('.private_msg_user_link').attr('href', to_user.user_link);
				view.$el.find('input[name="to_user"]').val(to_user.ID);
				view.$el.find('input[name="from_user"]').val(data.from_user);
				view.$el.find('input[name="project_id"]').val(data.project_id);
				view.$el.find('input[name="bid_id"]').val(data.bid_id);
				view.$el.find('input[name="post_title"]').val(data.project_title);
				view.$el.find('input[name="project_name"]').val(data.project_title);
			},
			submit: function(e) {
				e.preventDefault();
				var view = this;
				this.initValidate();				
				if( view.$form.valid() ){
					view.setupModel();
					view.model.save('', '', {
						beforeSend: function () {
							view.blockUi.block(view.$form);
						},
						success: function (result, resp, jqXHR) {
							if( resp.success) {
								AE.pubsub.trigger( 'ae:notification', {
									msg: resp.msg,
									notice_type: 'success'
								} );
								view.blockUi.unblock();
								view.closeModal();
							}
							else{
								AE.pubsub.trigger( 'ae:notification', {
									msg: resp.msg,
									notice_type: 'error'
								} );
								view.blockUi.unblock();
							}
						}
					});
				}
				else{
					console.log('Your form data is invalid!');
					return false;
				}
			},
			initValidate: function(){
				var view = this;				
				view.form_validator = view.$form.validate({
					errorElement: "p",
					rules: {
						post_title: 'required',
						post_content: 'required'

					},
					highlight:function(element, errorClass, validClass){
						var $target = $(element );
						var $parent = $(element ).parent();
						$parent.addClass('has-error');
						$target.addClass('has-visited');						
					},
					unhighlight:function(element, errorClass, validClass){
						// position error label after generated textarea
						var $target = $(element );
						var $parent = $(element ).parent();
						$parent.removeClass('has-error');
						$target.removeClass('has-visited');
					}
				});				
			},
			setupModel: function(){
				var view = this;
				view.$el.find('input[type=text],input[type=hidden],textarea').each(function () {
					var $input = $(this);
					view.model.set($input.attr('name'), $input.val() );
				});
			}
		});
		Views.replyForm = Backbone.View.extend({
			el: '.ae-pr-msg-reply-form',
			events: {
				'submit form#private_msg_reply_form': 'submitReply',
				'keyup textarea.field-reply-msg' : 'textChange',
				'click .btn-reply-conversation' : 'clearStyle'
			},
			//tantan
			initialize: function(){
				this.$form = this.$el.find('form');
				this.initValidate();
				this.blockUi = new Views.BlockUi();
			},
			submitReply: function(e){
				e.preventDefault();
				var view = this;
				this.initValidate();
				this.model = new Models.PrivateMessage();
				if( view.$form.valid() ){
					view.setupModel();
					view.model.save('', '', {
						beforeSend: function () {
							view.blockUi.block($('.ae-pr-msg-reply-form'));
						},
						success: function (result, resp, jqXHR) {
							if( resp.success) {
								view.$el.find('textarea[name="post_title"]').val('');
								AE.pubsub.trigger('ae:reply:success', resp);
								view.blockUi.unblock();
							}
							else{
								AE.pubsub.trigger( 'ae:notification', {
									msg: resp.msg,
									notice_type: 'error'
								} );
								view.blockUi.unblock();
							}
						}
					});
				}
				else{
					console.log('Your form data is invalid!');
					return false;
				}
			},
			initValidate: function(){
				var view = this;
				view.form_validator = view.$form.validate({
					errorElement: "p",
					rules: {
						post_content: 'post_title'

					},
					highlight:function(element, errorClass, validClass){
						var $target = $(element );
						var $parent = $(element ).parent();
						$parent.addClass('has-error');
						$target.addClass('has-visited');
					},
					unhighlight:function(element, errorClass, validClass){
						// position error label after generated textarea
						var $target = $(element );
						var $parent = $(element ).parent();
						$parent.removeClass('has-error');
						$target.removeClass('has-visited');
					}
				});
			},
			setupModel: function(){
				var view = this;
				view.$el.find('input[type=text],input[type=hidden],textarea').each(function () {
					var $input = $(this);
					view.model.set($input.attr('name'), $input.val() );
				});
				view.model.set('post_content', view.$el.find('textarea[name="post_title"]').val());
			},
			textChange: function(event){
				event.preventDefault();
				var view = this;
				var $target = $(event.currentTarget);
				if($('body').hasClass('is-mobile') && $target.parents('.conversation-detail').length > 0 ){
					$target.parents('.conversation-detail').css({
						'padding-bottom' : $target.height() + 60 + 'px'
					});
				}
			},
			clearStyle: function(event){
				var $target = $(event.currentTarget);
				if($target.parents('.conversation-detail').length > 0 ){
					$target.parents('.conversation-detail').removeAttr("style");
					$target.parents('.conversation-detail').find('.field-reply-msg').removeAttr("style");
				}
			}
		});
		Views.PrivateMessagePage = Backbone.View.extend({
			el: 'body',
			events: {
				'click .btn-open-msg-modal': 'openPrivateMessageModal',
				'click .ae-private-message-conversation-show': 'showConversationList',
				'click .archive': 'archiveConversation',
				'click .btn-redirect-msg': 'redirectToConversationDetail'
			},
			initialize: function(){
				var view = this;
				this.blockUi = new Views.BlockUi();
				view.initConversationList();
				//view.initConversationDetail();
				AE.pubsub.on('ae:post:archiveSuccess', this.archiveSuccess, this);
				//AE.pubsub.on('ae:model:onShowDetail', this.showConversationReply, this);
				AE.pubsub.on('ae:model:onshow', this.showConversationReply, this);
				AE.pubsub.on('ae:model:onarchive_reply', this.archiveReply, this);
				new Views.replyForm();
				AE.pubsub.on('ae:reply:success', this.afterReply, this);

				$('textarea.field-reply-msg').trigger('autosize.destroy');

				$( "textarea" ).focus(function() {
					$('textarea').autosize();
				});
				if( $('.ae_private_conversation_redirect_data').length > 0){
					var data = JSON.parse($('.ae_private_conversation_redirect_data').html());
					model = new Models.PrivateMessage(data);
					console.log(model);
					view.showConversationReply(model);
				}
			},
			openPrivateMessageModal: function(e){
				e.preventDefault();
				var view = this;
				var $target = $(e.currentTarget);
				var data = '';
				if( $target.find('.privatemsg_data').length > 0){
					data =  JSON.parse($target.find('.privatemsg_data').html());
				}
				if (typeof view.privateMsgModal === 'undefined') {
					view.privateMsgModal = new Views.PrivateMessageModal();
				}
				view.privateMsgModal.open(data);
			},
			initConversationList: function(){
				if($('#ae-private-message-loop').length > 0){
					Models.PrivateMessage = Backbone.Model.extend({
						action: 'ae-sync-ae_private_message',
						initialize: function() {}
					});
					/**
					 * conversation collections
					 */
					Collections.Conversation = Backbone.Collection.extend({
						model: Models.PrivateMessage,
						action: 'ae-fetch-conversation',
						initialize: function() {
							this.paged = 1;
						}
					});
					ConversationItem = Views.PostItem.extend({
						tagName: 'li',
						className: 'item-conversation',
						template: _.template($('#ae-private-message-loop').html()),
						//events: {
						//	'click .ae-private-message-conversation-wrapper': 'showConversationDetail'
						//},
						onItemBeforeRender: function() {
							// before render view
						},
						onItemRendered: function() {
							// after render view
							var view = this;
							if(ae_plugin_globals.user_ID == this.model.get('post_author') ) {
								if (this.model.get('post_status') == 'unread' && !view.$el.hasClass('item-conversation-new')) {
									view.$el.addClass('item-conversation-new');
								}
							}
							if(ae_plugin_globals.user_ID == this.model.get('to_user') ) {
								if (this.model.get('conversation_status') == 'unread' && !view.$el.hasClass('item-conversation-new')) {
									view.$el.addClass('item-conversation-new');
								}
							}
						}
					});
					ListConversations = Views.ListPost.extend({
						tagName: 'ul',
						itemView: ConversationItem,
						itemClass: 'item-conversation'
					});
					if( $('.private-message-conversation-contents').length > 0 ) {
						if( $('.private-message-conversation-contents').find('.ae_private_conversation_data').length > 0 ){
							var ae_private_conversation_data = JSON.parse($('.private-message-conversation-contents').find('.ae_private_conversation_data').html());
							this.conversation_collection = new Collections.Conversation(ae_private_conversation_data);
						} else {
							this.conversation_collection = new Collections.Conversation();
						}
						this.list_conversation = new ListConversations({
							itemView: ConversationItem,
							collection: this.conversation_collection,
							el: $('.list-conversation')
						});
						this.list_conversation.render();
						this.blockcontrol = new Views.BlockControl({
							collection: this.conversation_collection,
							el: $('.private-message-conversation-contents'),
							onBeforeFetch: function(){
								if($('.no-message').length > 0 ){
									$('.no-message').remove();
								}
							},
							onAfterFetch: function(result, res){
								if( !res.success || result.length == 0){
									$('.list-conversation').html(ae_plugin_globals.no_message);
								}
								$.ajax({
									url: ae_globals.ajaxURL,
									type: 'get',
									data: {
										action: 'ae-private-message-get-unread'
									},
									beforeSend: function() {},
									success: function(res) {
										$('.msg-number').html(res.data);
									}
								});

							}
						});
					}
				}
			},
			initConversationDetail: function(data){
				var view = this;
				view.repliesData = data;
				prMsgReplyItem = Views.PostItem.extend({
					tagName: 'li',
					className: 'reply-msg question-msg',
					template: _.template($('#ae-private-message-reply-loop').html()),
					onItemBeforeRender: function() {
						// before render view
					},
					onItemRendered: function() {
						var view = this;
						if(this.model.get('post_author') == ae_plugin_globals.user_ID ){
							view.$el.find('.avatar-conversation').remove();
							view.$el.removeClass('question-msg');
							view.$el.addClass('answer-msg');
							view.$el.find('.archive-reply').show();
						}
					}
				});
				ListprMsgReplies = Views.ListPost.extend({
					tagName: 'ul',
					itemView: prMsgReplyItem,
					itemClass: 'reply-msg'
				});
				Collections.Replies = Backbone.Collection.extend({
					model: Models.PrivateMessage,
					action: 'ae-fetch-conversation',
					initialize: function() {
						this.paged = 1;
					}
				});
				if( $('.private-message-reply-contents').length > 0 ) {
					view.replies_collection = new Collections.Replies();
					if( ae_plugin_globals.is_mobile ) {
						view.replies_collection.comparator = function (model) {
							return model.get("ID"); // Note the minus!
						};
					}
					view.list_replies = new ListprMsgReplies({
						itemView: prMsgReplyItem,
						collection: this.replies_collection,
						el: $('.ae-pr-msg-reply-list')
					});
					view.list_replies.render();
					view.reblockcontrol = new Views.BlockControl({
						collection: this.replies_collection,
						//initialize: function(){
						//	this.on("after:loadMore", this.onAfterFetch);
						//},
						el: $('.private-message-reply-contents'),
						onBeforeFetch: function(){
							$('.ae-pr-msg-reply-list').html('');
							//if($('.no-message').length > 0 ){
							//	$('.no-message').remove();
							//}
						},
						onAfterFetch: function(result, res){
							if( ae_plugin_globals.is_mobile ) {
								this.collection.sort();
								view.list_replies.render();
							}
							view.showConversationDetail();
						},
						onAfterLoadMore: function(result, res){
							if( ae_plugin_globals.is_mobile ) {
								this.collection.sort();
								view.list_replies.render();
							}
						}
					});
					$target = $('#tab_private_msg');
					view.fetchReply($target);
				}
			},
			showConversationReply: function (model) {
				var view = this;
				view.setupGeneralInfo(model);
				view.loadReplyList(model);
				//view.showConversationDetail();

			},
			archiveSuccess: function(result, res, xhr){
				$target = $('.private-message-conversation-contents');
				this.blockcontrol.fetch($target);
				if( res.success ) {
					AE.pubsub.trigger('ae:notification', {
						msg: res.msg,
						notice_type: 'success'
					});
				}
				else{
					AE.pubsub.trigger('ae:notification', {
						msg: res.msg,
						notice_type: 'error'
					});
				}
			},
			showConversationList: function(){
				$('.private-message-reply-contents').fadeOut(500);
				$('.private-message-conversation-contents').fadeIn(500);
				$target = $('.private-message-conversation-contents');
				this.blockcontrol.fetch($target);
			},
			showConversationDetail: function(){
				$('.private-message-conversation-contents').fadeOut(800);
				$('.private-message-reply-contents').fadeIn(300);
			},
			setupGeneralInfo: function(model){
				var view = this;
				$('input[name="post_parent"]').val(model.get('ID'));
				$('.ae-pr-msg-project-name').html(model.get('project_name'));
				$('.ae-pr-msg-conversation-author-name').html(model.get('conversation_author_name'));
				$('.ae-pr-msg-conversation-sub').html(model.get('post_title'));
				if( model.get('post_author') == ae_plugin_globals.user_ID ) {
					model.set('post_status', 'publish');
				}
				else{
					model.set('conversation_status', 'publish');
				}
				model.set('sync_type', 'conversation');
				this.model = model;
				view.saveModel(model);
			},
			loadReplyList: function(model){
				var view = this;
				view.initConversationDetail(model);
			},
			afterReply: function(resp){
				var view = this;
				view.reblockcontrol.page= 1;
				view.fetchReply();
			},
			saveModel: function(model){
				var view = this;
				model.save('', '', {
					beforeSend: function () {

					},
					success: function (result, resp, jqXHR) {
					}
				});
			},
			archiveConversation: function(){
				var view = this;
				if (confirm(ae_globals.confirm_message)) {
					// archive a model
					this.model.set('archive', 1);
					this.model.save('archive', '1', {
						beforeSend: function() {
							view.blockUi.block($('.private-message-reply-contents'));
						},
						success: function(result, res, xhr) {
							view.blockUi.unblock();
							view.showConversationList();
						}
					});
				}
			},
			archiveReply: function(model){
				var view = this;
				//view.model = model;
				//if (confirm(ae_globals.confirm_message)) {
					// archive a model
					model.set('sync_type', 'reply');
					model.set('archive', 1);
					model.save('archive', '1', {
						beforeSend: function() {
							view.blockUi.block($('.private-message-reply-contents'));
						},
						success: function(result, res, xhr) {
							view.blockUi.unblock();
							view.fetchReply();
						}
					});
				//}
			},
			fetchReply: function( $target  ){
				var view = this;
				if( typeof $target === 'undefined' ) {
					$target = $('.private-message-reply-contents');
				}
				view.reblockcontrol.query = {
					post_parent: view.repliesData.get('ID'),
					fetch_type: 'replies',
					paginate: 'load_more'
				};
				view.reblockcontrol.fetch($target)
			},
			redirectToConversationDetail: function(event){
				event.preventDefault();
				window.location.href = ae_plugin_globals.private_message_link+ '?pr_msg_c_id='+$(event.currentTarget).attr('data-conversation')+'#tab_private_msg';
			},
			IsJsonString: function(str) {
				try {
					JSON.parse(str);
				} catch (e) {
					return false;
				}
				return true;
			}

		}) ;
		new Views.PrivateMessagePage();
		// Select style
		var class_chosen = $(".filter-conversation");
		$(".filter-conversation").each(function(){
			var data_chosen_width = $(this).attr('data-chosen-width'),
				data_chosen_disable_search = $(this).attr('data-chosen-disable-search'),
				max_selected_options = $(this).attr('data-max-select')
				;
			$(this).chosen({inherit_select_classes: true, width: data_chosen_width, disable_search: data_chosen_disable_search, max_selected_options : max_selected_options });
		});
		$('.trigger-messages').click(function(e){
			setTimeout(function(){
				$('a[href="' + window.location.hash + '"]').trigger('click');
			},500);
		});

	});
})(jQuery, window.AE.Models, window.AE.Collections, window.AE.Views);
