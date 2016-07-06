(function() {
  var themes  = {};



  Polymer({
			is : 'ir-gallery',

			properties : {
				images  :		   { type : Array, value : [] },
				imgSrc :			{ type : String },
				imgCaption :		{ type : String },
				imagesReady : 		{ type : Boolean, value : false },
				negativeHeight :	{ type : Number, value : 40 },
				showDefaultImages : { type : Boolean, value : false },
				isItFirstTime :	 { type : Boolean, value : false },
				onePictureMode :	{ type : Boolean, value : false },
				inlineMode :		{ type : Boolean, value : false },
				galleryMode :	   { type : Boolean, value : false },
				pageToSwap :		{ type : Number, value : 0 },
				theme :			 { type : String, notify : true, value : "default" },
				nameThemes :		{ type : Array, value : [] },
				themeSelected :	 { type : String, value : "default"},
				themes : { type : Object, value : themes },
				ratio : { type : Number, value : .85 },
				currentPage : { type : Number, value : 0 },
				scrollers : { type : Object, value : {} }
			},

			behaviors : [
				Polymer.Templatizer
			],

			isCaptionWrapper : function(el) {
				return el.nodeName == 'FIGURE';
			},
			
			getCaptionHTML : function(el) {
				return Polymer.dom(Polymer.dom(el).querySelector('figcaption')).innerHTML;
			},
			
			getImageCaption : function(img) {
				var captionHolder, captonChildren = [];
				if(this.isCaptionWrapper(img.parentNode))
					return Polymer.dom(Polymer.dom(img.parentNode).querySelector('figcaption')).innerHTML;
					
				return;
			},
			
			scanForImages : function() {
				var imgs = Polymer.dom(this).querySelectorAll('img');
				
				this.images = [];
				
				imgs.forEach(function(img, i) {
					var imgData = 	{
										src : img.src, 
										captionHTML : this.getImageCaption(img), 
										index : i
									};
									
					this.images.push(imgData);
				}.bind(this));
				
				console.log("here", this.images)
			},
			
			ready : function () {
				window.addEventListener('resize', this.init.bind(this));
			},
			
			attached : function () {
				this.init();
			},
			
			init : function() {
				var initialized;

				//this.main = Polymer.dom(this).querySelector('main');
				//this.scroller = Polymer.dom(this).querySelector('scroller');
				
				this.scanForImages();
				
				if(this.i) this.i++; else this.i = 1
				console.log(this.i)
				
				Polymer.dom(this.$.contentNode).observeNodes(function(info) {
					this.scanForImages();
				}.bind(this))

				// this.$.inlineContainer.style.width = this.offsetParent.clientWidth;
				
				if(initialized = this.themes[this.theme])
					this.applyTheme('inline')
				else
				{
					document.addEventListener('ir-gallery-theme-ready', function(ev) {
						if(ev.detail.name == this.theme)
							this.applyTheme('inline'); //(themes[this.theme].inline, themes[this.theme].dialog, true);
					}.bind(this));

					// if nothing happened in 5 seconds the template is probably not available and we should use the default
					setTimeout(function() { 
						if(!initialized)
							this.applyTheme('inline'); //themes.default.inline, themes[this.theme].dialog, true);
					}.bind(this), 5000);
				}
			},

			applyTheme : function(target, dialogMode, callback) {
				this.debounce('applyTheme', function() {
					var themeData = this.themes[this.theme],
						w, h, min, t, minw, minh, pic, stampRes,
						container;
						
					container = this.$[target + "Container"];
					
					
					
					if(dialogMode)
					{
						h = document.body.clientHeight;
						w = document.body.clientWidth;
					}
					t = container.offsetParent;
					h = minh = this.style.width && this.style.width.replace(/px/, '');
					w = minw = this.style.height && this.style.height.replace(/px/, '');;
					
					if(!(h && w))
					{
						minh = t.clientHeight
						minw = t.clientWidth
						while(t) {
							minw = Math.min(t.clientWidth, minw);
							minh = Math.min(t.clientHeight, minh);
							t = t.offsetParent;
						}
					}					
					
					min = Math.min(minw, minh);
					h = w = min;
					
					//this.scrollers = {};
					
					this.scrollers[target] = {};
					
					stampRes = this.stampThemeSection(container, themeData[target], { section : target, size : min, slideWidth : minw, dialogMode : dialogMode });
					this.scrollers[target] = stampRes.scrollers;
					
					//dialog = this.stampThemeSection(this.$.dialogContainer, themeData.dialog, .35 * min);
					
					container.style.width = minw + 'px';
					container.style.height = h + 'px';
					
					pic = Polymer.dom(container);
					
					pic.querySelector('.main').style.height = this.ratio * h + "px";
					pic.querySelector('.main').style.width =
						pic.querySelector('.thumbnails').style.width = 
							minw + "px";
					pic.querySelector('.thumbnails').style.height = (1 - this.ratio) * h + "px";
					Polymer.dom(this.root).querySelector('.viewPort').style.height = h;
					
					
					if(callback)
						callback.call(this);
				}.bind(this), 300);
			},
			
			nextPage : function(page) {
				this.goToPage(this.currentPage + 1 % this.images.length)
			},
			prevPage : function(page) {
				this.goToPage(this.currentPage - 1 % this.images.length)
			},
			goToPage : function(page) {
				var s = this.scrollers;
				
				if(!(page >= 0))
					return;
					
				s.inline.main.goToPage(page, 0)
				s.inline.thumbnails.goToPage(page, 0)
				s.dialog.main.goToPage(page, 0)
				s.dialog.thumbnails.goToPage(page, 0)
				
				this.currentPage = page;
				//s.dialog.main.goToPage(Polymer.dom(ev).localTarget.index, 0)
				//s.dialog.thumbnails.goToPage(Polymer.dom(ev).localTarget.index, 0)

			},
			
			clearScrollers : function() {
				var alls = this.scrollers;
				[alls.inline.main, alls.inline.thumbnails, alls.dialog.main, alls.inline.thumbnails]
					.forEach(function(s) { s.destroy(); });
			},
			
			syncScrollers : function(section, sourceScroller) {
				var alls = this.scrollers, s = alls[section];
				this.currentPage = s[sourceScroller].currentPage.pageX || 0;
				
				
				[alls.inline.main, alls.inline.thumbnails, alls.dialog.main, alls.inline.thumbnails]
					.forEach(function(s) { s.goToPage(this.currentPage, 0) }.bind(this) );
				
				if(!s.dialog)
					return;
					
				s.dialog.main.goToPage(this.currentPage, 0);
				s.dialog.thumbnails.goToPage(this.currentPage, 0);
			},
			
			stampThemeSection : function(target, template, opts) {
				var instance, t, main, scrollers;
				t = template;		
				
				this.templatize(t);
				
				instance = this.stamp({});

				Polymer.dom(target).appendChild(instance.root);

				Polymer.dom.flush();

				this.scopeSubtree(target, true);
				Polymer.updateStyles()

				//instance.addEventListener('dom-change', this.populateMain.bind(this));
				//instance.addEventListener('dom-change', this.populateScroller.bind(this));

				scrollers = {};
				
				scrollers.main = this.populateDisplaySection(target, { 
														selector : ".main", 
														size : this.images.length > 1 ? this.ratio * opts.size : optobacs.size,
														section : target,
														onclick : opts.dialogMode ? null : function(ev) {
																								this.openDialog.call(this);
																							}.bind(this),
														slideWidth : opts.slideWidth
													});

				scrollers.thumbnails = this.populateDisplaySection(target, { 
														selector : ".thumbnails", 
														size : this.images.length > 1 ? (1 - this.ratio) * opts.size : 0,
														noCaption : true,
														section : target,
														onclick : function(ev) { 
															this.goToPage(Polymer.dom(ev).localTarget.index, 0)
															console.log('thumbnail click', Polymer.dom(ev).localTarget.index); 
														}.bind(this),
													});

				scrollers.main.on('scrollEnd', function() { this.syncScrollers(opts.section, "main"); }.bind(this) )	
 
				this.assignCommands(target)
				//return scrollers;
				//Polymer.dom.flush();
	
				return { instance : instance.root, scrollers : scrollers };
			},
			
			assignCommands : function(target) {
				var commandsEl = Polymer.dom(target).querySelector('.commands');
				commandsEl.querySelector('[backward]').addEventListener('click', this.goBackward.bind(this))
				commandsEl.querySelector('[forward]').addEventListener('click', this.goForward.bind(this))
			},
			
			openDialog : function ()
			{
				var size = Math.min(document.body.clientWidth, document.body.clientHeight);
				
				this.$.dialog.open();
				
				this.$.dialog.style.width = document.body.clientWidth;
				this.$.dialog.style.height = document.body.clientHeight;
				this.applyTheme('dialog', true, function() {
					this.scrollers.dialog.main.goToPage(this.currentPage, 0)
				});
				
			},
			
			setSize : function(el, size)
			{
				if(typeof size != 'object')
					size = { height : size, width : size };
					
				el.style.width = size.width;
				el.style.height = size.height;
				
				return el;
			},
			
			imageFromData : function(imgData, opts)
			{
				var wrapper, caption, tocenter, w, h, imgel, slide;

				imgel = document.createElement('iron-image');
				slide = document.createElement('div');

				imgel.src = imgData.src;
				imgel.index = imgData.index;
				imgel.sizing = 'contain';
				
				w = opts.slideWidth || opts.size;
				h = opts.size * (opts.noCaption ? 1 : this.ratio);
				
				this.setSize(imgel, { width : w, height : h});
				
				wrapper = document.createElement('figure');					
				Polymer.dom(wrapper).appendChild(imgel);
				Polymer.dom(slide).appendChild(wrapper);

				if(imgData.captionHTML && !opts.noCaption)
				{
					caption = document.createElement('figcaption');
					caption.height  = opts.size * (1 - this.ratio);
					Polymer.dom(caption).innerHTML = imgData.captionHTML;				
					Polymer.dom(wrapper).appendChild(caption);
					wrapper.style.height = w - caption.offsetHeight;
				}

				//el.width = "200"
				
				if(opts.slideWidth)
					slide.style.width = opts.slideWidth + 'px'
				
				slide.display = 'block';
				slide.style.textAlign = 'center';
				
				return slide;
			},
			
			// populates a scroller/thumbnails container
			//
			// opts: selector, size, noCaption, onClick
			populateDisplaySection : function(root, opts) {
				var wrapper = Polymer.dom(root).querySelector(opts.selector),
					scroller, pt;
				
				// remember: wrapper -> scroller -> slides, and iScroll is initialized on wrapper
				
				Polymer.dom(wrapper).classList.add('wrapper');
				scroller = document.createElement('div');
				Polymer.dom(scroller).classList.add('scroller')

				pt = Polymer.dom(scroller);
				
				Polymer.dom(wrapper).appendChild(scroller);
				
				this.images.forEach(function(imgData) {
					var slide = this.imageFromData(imgData, opts);
					Polymer.dom(slide).classList.add('slide');
					Polymer.dom(scroller).appendChild(slide)
					if(opts.onclick)
						slide.addEventListener("click", opts.onclick.bind(this));
				}.bind(this));
			
				Polymer.updateStyles();

				var iscroll = new IScroll(wrapper, {
					mouseWheel: true,
					scrollX: this.images.length > 1,
					scrollY: false,
					momentum: true,
					snap: ".slide",
					snapSpeed: 400,
					keyBindings: true					
				});
			
				iscroll.refresh();
				
				return iscroll;
			},


			swapTheme : function (e) {
				if (e)
					if (e.type == "click")
						this.$.preview.innerHTML = '';

				this.setAttribute('theme', this.themeSelected);
				this.setupTemplate(this.themes[this.theme].inline, this.themes[this.theme].dialog, true);
				this.$.setupMenu.close();
			},

			swapPreview : function () {
				return;
				
				this.$.preview.innerHTML = '';

				this.$.preview.innerHTML = "<ir-gallery id='previewGallery' theme='" + this.themeSelected + "'>" + this.$.contentImages.innerHTML + "</ir-gallery>";
				document.querySelector('#previewGallery').themeSelected = this.themeSelected;
				document.querySelector('#previewGallery').swapTheme();
			},

			setup : function () {
				console.log(themes);

				var state = 0;

				for (var f in themes) {
					state = 0;

					for (var i = 0; i < this.nameThemes.length; i++)
						if (this.nameThemes[i] == f)
							state = 1;

					if (state == 0)
						this.push('nameThemes', f);
				}

				this.swapPreview();
				this.$.setupMenu.open();
			},

			closeMenu : function () {
				this.$.preview.innerHTML = '';
				this.$.setupMenu.close();
			},


			goBackward : function(e) {

			  this.pageToSwap -= 1;
				if(this.pageToSwap < 0)
				  this.pageToSwap = this.images.length - 1;

			  if(e.currentTarget.getAttribute('class') == 'iback')
			  {
				this.$$('inline-thumbnails').scroll.prev();
				this.goToPage('inline-scroller', this.pageToSwap);
				this.selectThumbnail('inline-scroller', 'inline-thumbnails', this.pageToSwap);
			  }
			  else
			  {
				this.$['gallery-thumbnails'].scroll.prev();
				this.goToPage('gallery-scroller', this.pageToSwap);
				this.selectThumbnail('gallery-scroller', 'gallery-thumbnails', this.pageToSwap);
			  }

			},

			goForward : function(e) {

			  this.pageToSwap += 1;
			  if(this.pageToSwap > (this.images.length - 1))
				this.pageToSwap = 0;

			  if(e.currentTarget.getAttribute('class') == 'iforward')
			  {
				this.$$('#inline-thumbnails').scroll.next();
				this.goToPage('inline-scroller', this.pageToSwap);
				this.selectThumbnail('inline-scroller', 'inline-thumbnails', this.pageToSwap);
			  }
			  else
			  {
				this.$$('#gallery-thumbnails').scroll.next();
				this.goToPage('#gallery-scroller', this.pageToSwap);
				this.selectThumbnail('gallery-scroller', 'gallery-thumbnails', this.pageToSwap);
			  }

			}, 

			closeDialog : function(){
				this.$.dialog.close();
			},

			destroyScroller : function(){
				var that = this;

				this.$.gallery.close();

				this.$$("#gallery-scroller").scroll.destroy();
				this.$$("#gallery-thumbnails").scroll.destroy();

				this.$$('#inline-scroller').scroll._init();
				this.$$('#inline-thumbnails').scroll._init();

				setTimeout(function () {
						this.$$("#inline-scroller").scroll.refresh();
						this.$$("#inline-thumbnails").scroll.refresh();
						this.selectInlineThumb(this.pageToSwap); 
					}.bind(this), 200);		 

				//this.setUpScroller('inline-scroller', 'inline-thumbnails');
			},

		});
})();		