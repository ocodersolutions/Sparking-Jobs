(function($, Models, Collections, Views) {
	Views.freCreditSubmitProject = Views.Modal_Box.extend({
		el: '#fre_credit_modal',
		events: {
			'submit form#submit_fre_credit_form': 'submitFreCreditPayment'
		},
		initialize: function(){
			Views.Modal_Box.prototype.initialize.apply(this, arguments);
			_.bindAll(this, 'setupData');
			this.blockUi = new Views.BlockUi();
			AE.pubsub.on('ae:submitPost:extendGateway', this.setupData);
			this.$form = this.$el.find('form#submit_fre_credit_form');
			//this.initValidate();
		},
		setupData: function(data){
			var view = this;
			if (data.paymentType == 'frecredit') {
				this.openModal();
				view.data = data;
				var plans = JSON.parse($('#package_plans').html()),
					packages = [];
				_.each(plans, function (element) {
					if (element.sku == data.packageID) {
						packages = element;
					}
				});
				var align = parseInt(fre_credit_globals.currency.align);
				if(align) {
					var price       =   fre_credit_globals.currency.icon + packages.et_price;
				}else {
					var price       =   packages.et_price + fre_credit_globals.currency.icon;
				}
				this.$el.find('span.plan_name').html( packages.post_title + ' (' + price +')');
				this.$el.find('span.plan_desc').html( packages.post_content );
			}
		},
		submitFreCreditPayment: function(event){
			event.preventDefault();
			var view = this;
			var $form = $(event.currentTarget);
			if( view.$form.valid() ) {
				this.blockUi.block($form);
				view.data.secureCode = $form.find('#fre_credit_secure_code').val();
				$.ajax({
					url: ae_globals.ajaxURL,
					type: 'post',
					data: view.data,
					beforeSend: function () {
					},
					success: function (res) {
						if (res.success) {
							view.closeModal();
							window.location = res.data.url;
						}
						else {
							AE.pubsub.trigger('ae:notification', {
								msg: res.msg,
								notice_type: 'error'
							});
						}
						view.blockUi.unblock();
					}
				});
			}
			return false;
		},
		initValidate: function(){
			var view = this;
			view.form_validator = view.$form.validate({
				errorElement: "p",
				rules: {
					fre_credit_secure_code: 'required'

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

	});
	/**
	 * model withdraw
	 */
	Models.Withdraw = Backbone.Model.extend({
		action: 'fre-withdraw-sync',
		initialize: function() {}
	});
	Views.Modal_Withdraw = Views.Modal_Box.extend({
		events: {
			'change input[name="amount"]': 'changeValue',
			'submit form#fre_credit_withdraw_form': 'sendWithdrawRequest'
		},

		/**
		 * init view setup Block Ui and Model User
		 */
		initialize: function () {
			AE.Views.Modal_Box.prototype.initialize.call();
			this.model = new Models.Withdraw();
			this.$form = this.$el.find('form#fre_credit_withdraw_form');
			setTimeout(function(){
				$('form#fre_credit_withdraw_form select option:nth-child(1)').prop('selected', true);
			},1000);
			this.data = {};
			this.blockUi = new Views.BlockUi();
		},
		onOpen: function(){
			var view = this;
			view.openModal();
			view.setupFields();
		},
		setupFields: function(){
			var view = this;
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'get',
				data: {
					action: 'fre-credit-get-balance-info'
				},
				beforeSend: function() {},
				success: function(res) {
					view.data = res;
					view.$el.find('.fre_credit_total').html(res.total_text);
					view.$el.find('.fre_credit_available').html(res.available_text);
					view.$el.find('.fre_credit_freezable').html(res.freezable_text);
					view.$el.find('.fre_credit_min_withdraw').html(res.min_withdraw_text);
					view.$el.find('input[name="amount"]').attr('max', Number(res.available.balance));
					view.$el.find('input[name="amount"]').attr('min', Number(res.min_withdraw));
				}
			});
			view.$form.find('input, textarea, select').each(function() {
				$(this).val('');
			});
		},
		sendWithdrawRequest: function(e){
			e.preventDefault();
			var view = this;
			$target = $(e.currentTarget);
			view.initValidate();
			/**
			 * scan all fields in form and set the value to model user
			 */
			$target.find('input, textarea, select').each(function() {
				view.model.set($(this).attr('name'), $(this).val());
			})
			if( view.$form.valid() ){
				view.model.save('', '', {
					beforeSend: function () {
						view.blockUi.block($target);
					},
					success: function (result, resp, jqXHR) {
						if( resp.success ) {
							AE.pubsub.trigger('ae:notification', {
								msg: resp.msg,
								notice_type: 'success'
							});
							view.data = resp.data;
							AE.pubsub.trigger('sendWithdrawRequest:success', resp.data);
							view.closeModal();
						}
						else{
							AE.pubsub.trigger('ae:notification', {
								msg: resp.msg,
								notice_type: 'error'
							});
						}
						view.blockUi.unblock();
					}
				});
			}
		},
		initValidate: function(){
			var view = this;
			view.form_validator = view.$form.validate({
				errorElement: "p",
				rules: {
					amount: {
						required: true,
						number: true,
						max: Number(view.data.available.balance)
					},
					payment_info: 'required',
					secureCode: 'required'


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
		changeValue: function(e){
			var view = this;
			$target = $(e.currentTarget);
			var amount = Number($target.val());
			var available = Number(view.data.available.balance) - amount;
			available = view.around(available);
			var freezable = Number(view.data.freezable.balance) + amount;
			freezable = view.around(freezable);
			var align = parseInt(fre_credit_globals.currency.align);
			if(align) {
				var available       =   fre_credit_globals.currency.icon + available;
				var freezable       =   fre_credit_globals.currency.icon + freezable;
			}else {
				var available       =   available + fre_credit_globals.currency.icon;
				var freezable       =   freezable + fre_credit_globals.currency.icon;
			}
			view.$el.find('.fre_credit_available').html(available);
			view.$el.find('.fre_credit_freezable').html(freezable);
		},
		around: function(x){
			var n = parseFloat(x);
			x = Math.round(n * 100)/100;
			return x;
		}
	});
	Views.Modal_Edit_EmailCredit = Views.Modal_Box.extend({
		events: {
			'submit form#fre_credit_edit_paypal_form': 'sendRequest'
		},
		/**
		 * init view setup Block Ui and Model User
		 */
		initialize: function () {
			var view = this;
			this.user = AE.App.user;
			AE.Views.Modal_Box.prototype.initialize.call();			
			this.profile = new Models.Profile();
			this.$form = this.$el.find('form#fre_credit_edit_paypal_form');
			this.blockUi = new Views.BlockUi();
			view.initValidate();
		},
		onOpen: function(){
			var view = this;
			view.openModal();
			view.setupFields();
		},	
		setupFields: function(){
			var view = this;
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'get',
				data: {
					action: 'fre-credit-get-profile-info'
				},
				beforeSend: function() {},
				success: function(res) {
					var data = res.data;
					if(res.success){
						view.$el.find('#email_paypal').val(data.email_paypal);
					}
				}
			});
			view.$form.find('input, textarea, select').each(function() {
				$(this).val('');
			});
		},
		initValidate: function(){
			var view = this;
			view.form_validator = view.$form.validate({
				rules: {
					email_paypal: {
						required: true,
						email : true
					},
					secure_code: 'required'
				}
			});
		},
		sendRequest : function(e){
			var view = this;
			$target = $(e.currentTarget);
			e.preventDefault();
			view.initValidate();
			
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'get',
				data: {
					action: 'fre-credit-update-email-paypal',
					paypal : $target.find('#email_paypal').val(),
					secure_core : $target.find('#secure_code').val()
				},
				beforeSend: function() {
					view.blockUi.block($target);
				},
				success: function(res) {
					view.data = res;
					if( res.success ) {
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'success'
						});
						view.data = res.data;
						view.closeModal();
					}
					else{
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'error'
						});
					}
					view.blockUi.unblock();
				}
			});
		}	
	});
	Views.Modal_Update_Bank = Views.Modal_Box.extend({
		events: {
			'submit form#fre_credit_updat_bank_form': 'sendRequest'
		},
		/**
		 * init view setup Block Ui and Model User
		 */
		initialize: function () {
			var view = this;
			this.user = AE.App.user;
			AE.Views.Modal_Box.prototype.initialize.call();			
			this.profile = new Models.Profile();
			this.$form = this.$el.find('form#fre_credit_updat_bank_form');
			this.blockUi = new Views.BlockUi();
			view.initValidate();
		},
		onOpen: function(){
			var view = this;
			view.openModal();
			view.setupFields();
		},	
		setupFields: function(){
			var view = this;
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'get',
				data: {
					action: 'fre-credit-get-profile-info'
				},
				beforeSend: function() {},
				success: function(res) {
					var data = res.data;
					if(res.success){
						view.$el.find('#account_number').val(data.banking_info.account_number);
						view.$el.find('#banking_information').val(data.banking_info.banking_information);
						view.$el.find('#benficial_owner').val(data.banking_info.benficial_owner);
					}
				}
			});
			view.$form.find('input, textarea, select').each(function() {
				$(this).val('');
			});
		},
		initValidate: function(){
			var view = this;
			view.form_validator = view.$form.validate({
				rules: {
					benficial_owner : 'required',
					account_number : {
						required: true,
						number: true
					},
					banking_information : 'required',
					secure_code: 'required'
				}
			});
		},
		sendRequest : function(e){
			var view = this;
			$target = $(e.currentTarget);
			e.preventDefault();
			view.initValidate();
			
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'get',
				data: {
					action: 'fre-credit-update-bank',
					benficial_owner : $target.find('#benficial_owner').val(),
					account_number : $target.find('#account_number').val(),
					banking_information : $target.find('#banking_information').val(),
					secure_core : $target.find('#secure_code').val()
				},
				beforeSend: function() {
					view.blockUi.block($target);
				},
				success: function(res) {
					view.data = res;
					if( res.success ) {
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'success'
						});
						view.data = res.data;
						view.closeModal();
					}
					else{
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'error'
						});
					}
					view.blockUi.unblock();
				}
			});
		}	
	});

	Views.freCreditPage = Backbone.View.extend({
		el: '.tabs-credits',
		events: {
			'click .btn-withdraw-action': 'showModal',
			'click .btn-edit-email-credit' : 'showModalEditCredit',
			'click .btn-update-bank' : 'showModalUpdateBank'
		},
		initialize: function(){
			var view = this;
			AE.pubsub.on('sendWithdrawRequest:success', this.updateInfo, this);
			var from = new Date();
			var to = new Date();
			$('#fre_credit_from').datetimepicker({
				// defaultDate: from,
				format: 'MM/DD/YYYY',
				icons: {
					previous: 'fa fa-angle-left',
					next: 'fa fa-angle-right',
				}
			}).on("dp.change", function(e) {
				if($('#fre_credit_to').val()){
					view.filterDate('fre_credit_from', $('#fre_credit_from').val());
				}
			});
			$('#fre_credit_to').datetimepicker({
				// defaultDate: to,
				format: 'MM/DD/YYYY',
				icons: {
					previous: 'fa fa-angle-left',
					next: 'fa fa-angle-right',
				}

			}).on("dp.change", function(e) {
				view.filterDate('fre_credit_to', $('#fre_credit_to').val());
			});
		},
		filterDate: function (name, value) {
			historyCt.page = 1;
			historyCt.query[name] = value;
			historyCt.fetch($('#'+name));
		},
		showModal: function(e){
			e.preventDefault();
			var view = this;
			if( typeof this.Modal_Withdraw === 'undefined' ) {
				this.Modal_Withdraw = new Views.Modal_Withdraw({
					el: "#myModal"
				});
			}
			this.Modal_Withdraw.onOpen();
		},
		showModalEditCredit: function(e){
			e.preventDefault();
			var view = this;
			if( typeof this.Modal_Edit_EmailCredit === 'undefined' ) {
				this.Modal_Edit_EmailCredit = new Views.Modal_Edit_EmailCredit({
					el: "#modalEditPaypal"
				});
			}
			this.Modal_Edit_EmailCredit.onOpen();
		},
		showModalUpdateBank : function(e){
			e.preventDefault();
			var view = this;
			if( typeof this.Modal_Update_Bank === 'undefined' ) {
				this.Modal_Update_Bank = new Views.Modal_Update_Bank({
					el: "#modalUpdateBank"
				});
			}
			this.Modal_Update_Bank.onOpen();
		},
		updateInfo: function(data){
			this.$el.find('.fre_credit_total_text').html(data.total_text);
			this.$el.find('.fre_credit_available_text').html(data.available_text);
			this.$el.find('.fre_credit_freezable_text').html(data.freezable_text);
		}
	});
	Views.creditBody = Backbone.View.extend({
		el: 'body',
		events: {
			'click .request-secure-code': 'requestSecureCode'
		},
		initialize: function(){
			this.blockUi = new Views.BlockUi();
		},
		requestSecureCode: function(e){
			e.preventDefault();
			var view = this;
			$target = $(e.currentTarget);
			var data = {
				action: 'fre-credit-request-secure-code'
			};
			$.ajax({
				url: ae_globals.ajaxURL,
				type: 'post',
				data: data,
				beforeSend: function () {
					view.blockUi.block($target);
				},
				success: function (res) {
					if (res.success) {
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'success'
						});
					}
					else {
						AE.pubsub.trigger('ae:notification', {
							msg: res.msg,
							notice_type: 'error'
						});
					}
					view.blockUi.unblock();
				}
			});

		}
	});
	$(document).ready(function() {
		new Views.freCreditSubmitProject();
		new Views.creditBody();
		/**
		 * model withdraw
		 */
		Models.history = Backbone.Model.extend({
			action: 'fre-history-sync',
			initialize: function() {}
		});
		Collections.history = Backbone.Collection.extend({
			model: Models.history,
			action: 'fre-fetch-history',
			initialize: function() {
				this.paged = 1;
			}
		});
		if($('#fre-credit-history-loop').length > 0){
			var historyItem = Views.PostItem.extend({
				tagName: 'li',
				className: 'history-item',
				template: _.template($('#fre-credit-history-loop').html()),
				onItemBeforeRender: function() {
					// before render view
					// console.log('render');
				},
				onItemRendered: function() {
					// after render view
				}
			});
			ListHistory = Views.ListPost.extend({
				tagName: 'li',
				itemView: historyItem,
				itemClass: 'history-item'
			});
			// notification list control
			if( $('.fre-credit-history-wrapper').length > 0 ){

				if( $('.fre-credit-history-wrapper').find('.fre_credit_history_data').length > 0 ){
					var postsdata = JSON.parse($('.fre-credit-history-wrapper').find('.fre_credit_history_data').html()),
						posts = new Collections.history(postsdata);
				} else {
					var posts = new Collections.history();
				}
				/**
				 * init list blog view
				 */
				new ListHistory({
					itemView: historyItem,
					collection: posts,
					el: $('.fre-credit-history-wrapper').find('.list-histories')
				});
				/**
				 * init block control list blog
				 */
				Views.historyControl = Views.BlockControl.extend({
					events: function() {
						return _.extend({}, _.result(Views.BlockControl.prototype, 'events') || {}, {
							'click .fre-credit-history-filter a': 'historyFilter'
						});
					},
					historyFilter: function(event){
						event.preventDefault();
						var $target = $(event.currentTarget),
							name = 'history_type',
							view = this;
						if (name !== 'undefined') {
							view.query['history_type'] = $target.attr('data-value');
							view.page = 1;
							// fetch page
							view.fetch($target);
							$('.fre-credit-history-filter').addClass('hide');
						}
					}
				});
				historyCt = new Views.historyControl({
					collection: posts,
					el: $('.fre-credit-history-wrapper')
				});
				new Views.freCreditPage();
			}
		}
	});
})(jQuery, window.AE.Models, window.AE.Collections, window.AE.Views);
