	(function() {
		var irGalleryShared = {},
			iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, // thanks https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
			CLICK_EVENT_TYPE = iOS ? "touchstart" : "click";
	
		"use sctrict";
		Polymer({
			is : "ir-gallery",
			properties : {
				minWidth : { type : Number, value : 0, notify : true }, // will not be activated below this width
				currentPage : { type : Number, value : 0, notify : true },
				currentDialogTarget : { type : Object, notify : true, observer : "_dialogPageChanged" },
				currentInlineTarget : { type : Object, notify : true, observer : "_inlinePageChanged" },
				
				images : { type : Array, value : function() { return [] }, notify : true },
				imagesDomPath : { type : String, notify : true },
				
				demo : { type : Boolean, value : true, notify : true },

				sizingStyle : { type : String, value : "", notify : true },
				width : { type : String, /*value : "400px", */ notify : true },
				height : { type : String, /*value : "400px", */ notify : true },

				fullScreenThumbnailsHidden : { type : Boolean, value : false },
				inlineThumbnailsHidden : { type : Boolean, value : false },
				
				/* just a convenience when using inline images that are wrapped in <a></a> as a fallback */
				clickPreventDefault : { type : Boolean, value : false },
				
				inlineThumbnailsHidden : { type : Boolean, value : false },
				
				slidesPerView : { type : Number, value : 1, notify : true },

				slidesHeight : { type : String, value : "300px", notify : true },
				thumbnailsHeight : { type : String, value : "100px", notify : true },

				isReadyToDisplay : { type : Boolean, value : false, computed : "_isReadyToDisplay(images.*,width,height)" },

				zoomedImageSrc : { type : String, value : "", notify : true },
				fullScreen : { type : Boolean, value : false },
				isZooming : { type : Boolean, value : false },
			
				keepInlineFormat : { type : Boolean, value : false },
				
				noCaptions : { type : Boolean, value : false },
				
				inlineScrollerActualSize : { type : Object, value : null, observer : "_inlineActualSizeChanged" },
				inlineThumbnailsActualSize : { type : Object, value : null, observer : "_inlineActualSizeChanged" },
				
				imagesCsv : { type : String, value : "", observer : "_imagesCsvChanged" }
			},
			observers : ["_updateSize(width,height,slidesPerView,images.*)","_getImages(imagesCsv,isAttached)"],
			
			_inlineActualSizeChanged : function() {
				if(!this.get("inlineScrollerActualSize.height")) return;
				
				var sh = this.get("inlineScrollerActualSize.height"),
					th = this.get("inlineThumbnailsActualSize.height") || 0;
				
				var g = this.$$('#inlineGallery');
				
				this.style.height = (sh + th) + "px";
				
				g.style.position = "relative";
				g.style.left = 0;
				//g.style.top = "calc( (" + (s + t) + "px" + " - " + (this.height) + ") / 2)";
				g.style.width = this.width;
			},
			
			// zoom
			zoom : function(e) {
				this.set("zoomedImageSrc", this.currentDialogTarget.data.src);
				this.$.zoomDialog.open()
				this._unbindArrowKeyListeners();
			},
			
			unzoom : function(e) {
				this.set("zoomedImageSrc", this.currentDialogTarget.data.src);
				this.$.zoomDialog.close()
				this._bindArrowKeyListeners();
			},
			
			_unzoomed : function(e) {
				this._bindArrowKeyListeners();
			},
			
			// full screen
			openDialog : function(e) {
				if((e.detail.data.img.naturalHeight <= e.detail.target.actualHeight) && (e.detail.data.img.naturalWidth <= e.detail.target.actualWidth))
					return
				
				
				this.cancelDebouncer('waitingForDialog');
				this.debounce('waitingForDialog', function() {
					var fsd = this.$$("#fullScreenDialog");
					
					if(!fsd.openedAtLeastOnce)
						fsd.style.visibility = 'hidden';
					fsd.openedAtLeastOnce = true;
					
					fsd.open();

					this.async(function() {
						var dg = this.$$("#dialogGallery");						
						
						fsd.style.visibility = 'visible';
						this.async(function() {
							if(this._refreshOnOpen)
								dg.refresh();
							
							this._refreshOnOpen = false;
							this.set('fullScreen', true);

							dg.goToPage(this.currentPage, true);
						}, 100);
					}, 200);
					//this.$.dialogGallery.refresh();
				})
			},
			closeFullScreen : function() {
				var fsd = this.$$('#fullScreenDialog');
				fsd && fsd.close();

				this.set("fullScreen", false);
			},

			_disableScrollbars : function(e) {
				var p = Polymer.dom(this).parentNode, modified;
				modified = e.detail._modifiedScrollbars = [];
				Polymer.dom(e).path.forEach(function(el) {
					if(!el.style || el == document.documentElement)
						return;
					
					var memo = { el : el, overflow : el.style.overflow };
					if(el == document.body)
					{
						if(document.innerHeight < document.clientHeight)
							return;
						
						memo.body = {};
						
						var pd = function(e) { 
												e.preventDefault() 
										};
						el = el.addEventListener('wheel', pd);
						
						memo.body.pd = pd;
						
						//copyProps(el.style, memo.body, ['position','overflowY','width']);
						
						// var st = el.style;
						// //st.position = 'fixed';
						// st.overflowY = 'hidden';
						// st.width = '100%';
						// st.marginBottom = "1px";
						//el.style.paddingLeft =
					}
					
					
					modified.push(memo)
					//el.style.overflow = 'hidden';
				}.bind(this));
			},
			_restoreScrollbars : function(e) {
				e.detail._modifiedScrollbars.forEach(function(memo) {
					memo.el.style.overflow = memo.overflow;
					if(memo.body)
						memo.el.removeEventListener('wheel', memo.body.pd);
						//copyProps(memo.body, memo.el.style, ['position','overflowY','width']);
				});
			},

			_fullScreenOpened : function() {
				//this._bodyOverflow = document.body.style.overflow;
				//document.body.style.overflow = 'hidden';
				
				//this._disableScrollbars();
				this._bindArrowKeyListeners();
				if(!this.currentPage)
					this.goToPage(0);
				this._dialogPageChanged()
				
				this.fire('ir-gallery-full-screen-opened', this)
			},
			
			_fullScreenClosed : function() {
				//document.body.style.overflow = this._bodyOverflow;
				//this._restoreScrollbars();
				this._unbindArrowKeyListeners();
				this.fire('ir-gallery-full-screen-closed', this)
			},
						
			
			_configDialog : function() {
				var dg = this.$$("#dialogGallery"), cc, zc, evtype;

				// one time
				if(this.__dialogConfig)
					return;

				cc = this.$$('#close-container');
				zc = this.$$('#zoom-container');

				this.__dialogConfig = {
					closeButton : dg.injectIntoSlide(cc, "slide-frame"),
					zoomButton : dg.injectIntoSlide(zc, "slide-frame")
				};
				
				Polymer.dom.flush();
								
				this.__dialogConfig.closeButton.addEventListener(CLICK_EVENT_TYPE, this.closeFullScreen.bind(this));
				this.__dialogConfig.zoomButton.addEventListener(CLICK_EVENT_TYPE, this.zoom.bind(this));

				cc.style.visibility = 'hidden';
				zc.style.visibility = 'hidden';

			},
	
			// keyboard control
			_unbindArrowKeyListeners : function() {
				document.removeEventListener('keydown', this.__dialogConfig.listeners.keydown);
				this.__dialogConfig.listeners.keydown = null;
			},
			
			_bindFullScreenChangeListener : function() {
				document.addEventListener('ir-gallery-full-screen-opened', this._disableScrollbars)
				document.addEventListener('ir-gallery-full-screen-closed', this._restoreScrollbars)
			},
			
			_bindArrowKeyListeners : function() {
				if(this.get("__dialogConfig.listeners"))
					this._unbindArrowKeyListeners();
					
				this.__dialogConfig.listeners = {
					keydown : this._keydown.bind(this)
				};
				
				document.addEventListener('keydown', this.__dialogConfig.listeners.keydown);
			},
			
			_keydown : function(e) {
				if(e.which == 37)
					this.prev();
				else
				if(e.which == 39)
					this.next();
					
			},
			
			_isDiminished : function(img, container) {
				var r = container.getBoundingClientRect();
				return img.naturalWidth > r.width || img.naturalHeight > r.height;				
			},
			
			_inlinePageChanged : function() {
				this.currentInlineTarget.mediaItem.style.cursor = 
					this._isDiminished(this.currentInlineTarget.data.img, this.currentInlineTarget.mediaItem) ?
						"pointer" : "default";
			},
			
			_dialogPageChanged : function() {
				var r;
				
				if(!this.currentDialogTarget || !this.fullScreen)
					return;
					

				this.__dialogConfig.zoomButton.style.visibility = 
					this._isDiminished(this.currentDialogTarget.data.img, this.currentDialogTarget.mediaItem)
						? "visible" : "hidden";
						
				this.__dialogConfig.closeButton.style.visibility = 'visible';
			},
			next : function() {
				var p = this.currentPage;
				p = p >= this.images.length - 1 ? 0 : p + 1;
				this.set("currentPage", p);
			},
			prev : function() {
				var p = this.currentPage;
				p = p <= 0 ? this.images.length - 1 : p - 1;
				this.set("currentPage", p);
			},
			goToPage : function(n) {
				this.set("currentPage", n);
			},
		
			// internal services
			_isReadyToDisplay : function() {
				return this.images.length && this.width && this.height
			},
			
			_updateSize : function() {
				this.set("sizingStyle", "height : " + this.height + "; width : " + (this.slidesPerView <= 1 ? this.width : Units.divide(this.width, this.slidesPerView)) + ";");
				
				this.slidesHeight = Units.multiply(this.height, this.images.length > 1 ? .70 : 1);
				this.thumbnailsHeight = Units.multiply(this.height, this.images.length > 1 ? .20 : 0);
				
				this.refresh();
			},
			refresh : function() {
				this.$.scroller && this.$.scroller.refresh();
				this.$.thumbnails && this.$.thumbnails.refresh();
			},
			attached : function() {
				this._getImages();
				this._configDialog();
				
				if(!irGalleryShared.fullScreenChangeListener) 
					irGalleryShared.fullScreenChangeListener = this._bindFullScreenChangeListener();
			
				window.addEventListener('resize', this._resize.bind(this));
				this._resize();
			},
			
			_resize : function() {
				this.cancelDebouncer("resizing");
				this.debounce("resizing", function() {
					var el, h, w;
					
					if(!this._originalDimensions)
					{
						h = parseInt(this.height);
						w = parseInt(this.width); 
						this._originalDimensions = { w : w, h : h }
					}
					else
					{
						h = this._originalDimensions.h
						w = this._originalDimensions.w
					}
					
					h = h ? Math.min(window.innerHeight, h) : window.innerHeight;
					w = w ? Math.min(window.innerWidth, w) : window.innerWidth;
					
					for(el = this.offsetParent; el; el = el.offsetParent)
					{
						h = el.clientHeight > 0 ? Math.min(h, el.clientHeight) : h;
						w = el.clientWidth > 0 ? Math.min(w, el.clientWidth) : w;
					}
					h = Math.max(h, w);
					this.set("height", h + "px");
					this.set("width", w + "px");
				}, 200);
			},
			
			_getImagesAtDomPath : function() {
				var root, arre = /(\S+)\[(\d+)]\]/, split;
				split = this.imagesDomPath.split(".");
				root = 
					split
						.reduce(function(res, curr) {
							var arr = curr.match(arre), res;
							if(arr)
								return Polymer.dom(res)[arr[0]][arr[1]];
							else
								return Polymer.dom(res)[curr]; 
						}, this)
						
				return Polymer.dom(root)
						.querySelectorAll('img')
						.map(function(img) { return img.parentNode.tagName == 'FIGURE' ? img.parentNode : img });
			},
			
			_makeChildImagesFromCsv : function() {
				if(!this.imagesCsv)
					return [];
				
				var pt = Polymer.dom(this);
				[].slice.call(Polymer.dom(this).children).map(c => pt.removeChild(c));

				Polymer.dom.flush();
				
				this.imagesCsv.split(/,/).forEach(src => {
					var img = document.createElement('img');
					img.src = src;
					Polymer.dom(this).appendChild(img);
				});
				
			},
			
			_clearChildImages : function() {
				const pt = Polymer.dom(this);
				[].slice.call(pt.children).forEach(c => pt.removeChild(c))
			},
			
			_imagesCsvChanged : function(n, o) {
				if(o && !n) this._clearChildImages();
			},
			
			_getImages : function() {
				var sources, idp;
				
				this.goToPage(0);

				this.set("images", []);
				this.set("imgData", []);
								
				if(this.imagesCsv || this.imagesDomPath)
					this._clearChildImages();
				
				if(this.imagesCsv)
					// also in future ._makeChildImagesFromObject like { src, title, caption }
					this._makeChildImagesFromCsv();
				else
					if(this.imagesDomPath)
						sources = this._getImagesAtDomPath();
					
				sources = sources || Polymer.dom(this).children;
				
				this._refreshOnOpen = true;

				this.debounce('update', function() {
					var hasCaptions = false;
					
					sources
						.forEach(function(el, i) {
							var imgData, fc, img = el, caption = "";

							if(el.tagName == 'FIGURE')
							{
								img = Polymer.dom(el).querySelector('img');
								fc = Polymer.dom(el).querySelector('figcaption');
								caption = fc && fc.textContent;
							}
							if(!img)
								return;
								
							imgData = {
								img : img,
								src : img.src,
								caption : caption,
								index : i
							}

							this.push("images", imgData);
							
							// only useful when using the inline mode
							if(img.complete && img.naturalWidth)
								this._inlineImageLoaded(imgData, { target : imgData.img });
							else
								imgData.img.addEventListener('load', this._inlineImageLoaded.bind(this, imgData));

						}.bind(this));
				}, 30);
			},
			
			_inlineImageLoaded : function(imgData, ev) {
				var cont = Polymer.dom(imgData.img).parentNode;
				if(!cont || !this._isDiminished(imgData.img, cont))
					return;
				ev.target.addEventListener("click", this._inlineContentClick.bind(this, imgData, cont)); 							
				ev.target.style.cursor = "pointer";
				ev.target.setAttribute("onclick", "");
			},

			// _inlineContentClickCancel : function(e) {
			// 	// if(e.targetTouches && e.targetTouches.length > 1)
			// 	// if(this.fullScreen)
			// 	// 	return;

			// 	if(Date.now() - this.__contentClickStart < 400) {
			// 		this.cancelDebouncer('contentClickStart');
			// 	}
			
			// },
			
			/* Process clicks on images located outside this element's shadow dom (either when using keep-inline-format or images-dom-path) */
			// _inlineContentClick : function(imgData, cont, e) {
			// 	this.__contentClickStart = Date.now();
				
			// 	this.$$("#fullScreenDialog").noCancelOnOutsideClick = true;
				
			// 	if(this.clickPreventDefault) {
			// 		e.preventDefault();
			// 		e.stopPropagation();
			// 	}

			// 	this.cancelDebouncer('contentClickStart');
			// 	this.debounce('contentClickStart', function() {
			// 		// this.noCancelOnOutsideClick = this._noCancelOnOutsideClick;
			// 		// this.$$("#fullScreenDialog").noCancelOnOutsideClick = false;

			// 		if(Date.now() - this.__contentClickStart < 400)
			// 			this._inlineContentClickProcess(imgData, cont, e);
			// 		else
			// 			console.log("Not continuing contentClickStart - too late")
			// 	}, 300)
			// },

			/* Process clicks on images located outside this element's shadow dom (either when using keep-inline-format or images-dom-path) */
			_inlineContentClick : function(imgData, cont, e) {
				this.openDialog({ detail : { data : imgData, target : cont } });
				if(this.clickPreventDefault)
					e.preventDefault();
				this.debounce('contentClick', function() {
					this.goToPage(imgData.index);
				}, 200);
			}

			// _inlineContentClick : function(imgData, cont, e) {

			// 	this.debounce('contentClick', function() {
			// 		console.log("Opening page " + imgData.index + " from inline event")

			// 		// if(this.__contentClickStart == -1)
			// 		// 	return;
					
			// 		// this.__contentClickStart = -1;

			// 		if(this.clickPreventDefault) {
			// 			e.preventDefault();
			// 			e.stopPropagation();
			// 		}

			// 		this.openDialog({ detail : { data : imgData, target : cont } });

			// 		this.goToPage(imgData.index);
			// 	}.bind(this), 500);
			// }
		});
		
		var Units = {
			getUnits : function(v) { return v.replace(/\d/g, ''); },
			multiply : function(v, factor) { return (parseFloat(v) * factor) + Units.getUnits(v) }, 
			divide : function(v, factor) { return (parseFloat(v) / factor) + Units.getUnits(v) } 
		}
		
		function copyProps(src, tgt, propsArr) { propsArr.forEach(function(p) { tgt[p] = src[p]; }) }

	})()
	