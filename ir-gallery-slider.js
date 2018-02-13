(function() {
	Polymer({
		is : "ir-gallery-slider",

		properties : {
			// the source images + captions data ({ src : "http://...", caption : "xyz" })
			images : { type : Array, value : function() { return [] }, notify : true, observer : "refresh" },
			demo : { type : Boolean, value : true, notify : true },
			
			// current page/slide number
			currentPage : { type : Number, notify : true, observer  : "_pageChangedFromBinding" },
			
			// a complex object providing all info on the current slide
			currentTarget : { type : Object, notify : true },
			
			// slider is attached
			isAttached : { type : Boolean, value : false, notify : true },
			
			isWaiting : { type : Boolean, value : false, notify : true },
			
			// scroller is ready
			isReady : { type : Boolean, value : false, notify : true, observer : "_scrollerReadyChanged" },
			
			// don't display captions
			noCaptions : { type : Boolean, value : false, notify : true },
			
			// don't display border around slides
			noBorder : { type : Boolean, value : false, notify : true },
			
			// keep captions space when there are no captions, ignored if noCaptions is true
			keepCaptionsSpace : { type : Boolean, value : false, notify : true },
			
			// available dimensions
			width : { type : String, notify : true },
			height : { type : String, notify : true },
			
			// number of slides to display per view
			slidesPerView : { type : Number, value : 1, notify : true },
			
			imageContainerStyle : { type : String, value : "", notify : true },
			
			// some styling classes
			_slideFrameBorderClass : { type : String, value : "slide-frame-border", notify : true, computed : "_slideFrameBorder(noBorder)" },
			_slideSizingStyle : { type : String, value : "", notify : true },
			_imageSizingStyle : { type : String, value : "", notify : true },
			_imageContainerSizingStyle : { type : String, value : "", notify : true },
			sizing : { type : String, value : "contain" },
			
			actualSize  : { type : Object, value : function() { return {} }, notify : true },
			
			noPageChangeOnScroll : { type : Boolean, value : false }
		},
		
		observers : [
			'_updateSize(isAttached,noCaptions,noBorder,slidesPerView,width,height,images.*)',
			'_currentPageChanged(currentPage,isReady,isAttached)'
		],
		
		refresh : function() {
			if(!this.$.rvs)
				this.async(this.refresh, 100); // try again later
			
			this.debounce("refresh", function() {
				this.updateStyles();
				this.$.rvs.refresh();
				this.goToPage(this.currentPage);
			}, 100);
		},
		
		_handleDrag : function(e) {
			if(e.detail.state != 'end')
				return;

			if(Math.abs(e.detail.dx) > this.getBoundingClientRect().width / 5)
			{
				this.goToPage(this.currentPage + (e.detail.dx < 0 ? 1 : -1));
			}
		},

		_imgClick : function(e) {
			this.fire('slider-image-click', { data : e.currentTarget.data, target : Polymer.dom(e.currentTarget).children[0] });
		},

		_slideBackdropClick : function(e) {
			if(e.target.classList && /slide-backdrop/.test(e.target.className))
				this.fire('slider-slide-backdrop-click', { data : e.currentTarget.data, target : Polymer.dom(e.currentTarget).querySelector('ir-image-sizer') });
		},

		_slideClick : function(e) {
			this.fire('slider-slide-click', { data : e.currentTarget.data, target : Polymer.dom(e.currentTarget).querySelector('ir-image-sizer') });
		},

		_slideFrameBorder : function() {
			return this.noBorder ? "no-frame-border" : "slide-frame-border";
		},

		_updateSize : function() {
			this.set("_slideSizingStyle", "height : calc(" + this.height + "); width : calc(" + this._imageContainerWidth(true) + ")");
			
			this.refresh();
		},

		
		_captionClass : function(item) {
			if(item.caption && !this.noCaptions)
				return "show-caption";
			else
			if(this.keepCaptionsSpace)
				return "keep-caption-space";
		},
		
		// returns a calc() expression without the calc()
		_imageContainerHeight : function(item) {
			var res = 	"(" + 
							this.height + 
							(!this.noCaptions && (item.caption || this.keepCaptionsSpace) ? " - 2.7em" : "") +
							" - " + this._borderWidth() + " - " + this._imageContainerPaddingWidth() +
						")"; // caption and border
		
			return res;
		},
		
		// returns a calc() expression without the calc()
		_imageContainerWidth : function(includeBorder) {
			var res =  	"(" + 
							(this.slidesPerView <= 1 ? this.width : this.width + " / " + this.slidesPerView) + 
							// " - " + this._borderWidth() + " - " + this._imageContainerPaddingWidth() +

							(includeBorder === true ? "" : " - " + this._borderWidth() + " - " + this._imageContainerPaddingWidth()) +
						")";
			return res;
		},
		
		_borderWidth : function() {
			//if(this.noBorder)    // || includeBorder === true " - 2px" : " - 30px")
			//	return "0px";
				
			return this.noBorder ? "0px" : "(2 * " + (this.getComputedStyleValue("--slide-frame-border-width") || "6px") + ")";
		},
		
		_imageContainerPaddingWidth : function() {
			return "(2 * " + (this.getComputedStyleValue("--image-container-padding-width") || "0px") + ")";
		},
		
		_scrollerReadyChanged : function() {
			if(!this.isReady)
				return;

			if(!this.noPageChangeOnScroll)
				this.$.rvs.iscroll.on('scrollEnd', this._pageChangedFromScroller.bind(this));

			var p = this.currentPage;
			
			this._currentPageChanged();				
		},
		
		_currentTarget : function() {
			var slide;

			slide = slide[this.currentPage];
				
			return {
				data : slide.data,
				slide : slide,
				mediaItem : Polymer.dom(slide).querySelector('ir-image-sizer') // should be extended to other media, e. g. iframe embeds
			}
		},

		_pageChangedFromBinding : function(n, o)
		{
			if(n == o)
				return;

			this.goToPage(n);
		},
		
		_eq_ : function(a,b) {
			return a == b;
		},
		
		_pageChangedFromScroller : function(n, o)
		{
			if(!this.$.rvs.iscroll || this.noPageChangeOnScroll)
				return;
			
			var cpx = this.get("$.rvs.iscroll.currentPage.pageX");
		
			//this.cancelDebouncer('fromScroller');
			this.debounce('fromScroller', function() {
				this._scrollingSource = false;
				//this.goToPage(this.$.rvs.iscroll.currentPage.pageX);
				this.set("currentPage", this.$.rvs.iscroll.currentPage.pageX);
			}, 100);
		},
	
		goToPage : function(n) {
			console.log(this.id + " going to page ", n);

			if(!this.offsetHeight)
				return;
			
			this.cancelDebouncer('goToPage');
			
			if(typeof n == 'undefined')
				return;
			
			//this.debounce('goToPage', function() {
				if(this.disabled || !this.images.length) 
					return;
				
				if(!this.$.rvs.iscroll || !this.$.rvs.iscroll.pages.length || (!n && n != 0))
				{
					this.set("isWaiting", true);
					this.cancelDebouncer("waitingForIScroll");
					//this.__waitingForIScroll = this.async(this._pageChangedFromBinding, 100); // waiting for iscroll to be ready
					this.debounce("waitingForIScroll", this.goToPage.bind(this, n), 200); // waiting for iscroll to be ready
					return 
				}
				
				var pages = this.images.length;

				if(n < 0)
					n = pages - ((-n) % pages);
				
				n = n % pages;
				
				//this.debounce("goToPage", function() {
				if(n != this.get("$.rvs.iscroll.currentPage.pageX"))
					this.$.rvs.iscroll.goToPage(n, 0, this.isWaiting ? 0 : undefined)

				this.set("currentPage", n);				
				
				this.set("isWaiting", false);
			//}, 100);
				
			//}, 30);
		},
	
		ready : function() {
			this._injectedElements = [];
			this._sizes = { all : [] };
		},
	
		attached : function() {
			this.set('attached', true)	
		},
		
		_currentPageChanged : function() {
			var slide;
			
			if(!this.isReady || !this.isAttached) return;
			
			if(this._prevCurrentPage == this.currentPage)
				return;

			this._prevCurrentPage = this.currentPage;

			slide = Polymer.dom(this.root).querySelectorAll(".slide");
			if(!slide || !slide.length || !(this.currentPage >= 0))
				return 

			slide = slide[this.currentPage];
			this.set("currentTarget", {
				data : slide.data,
				slide : slide,
				mediaItem : Polymer.dom(slide).querySelector('ir-image-sizer') // should be extended to other media, e. g. iframe embeds
			});

			this._injectedElements.forEach(function(inj) {
				Polymer.dom(Polymer.dom(this.currentTarget.slide).querySelector("." + inj.target)).appendChild(inj.el);
			}.bind(this));
		},
		
		/* 
			el - html element, target - class of a slide component to inject the injectables into (slide-frame,image-container,caption-wrapper) 
			returns the local imported node.	
		*/
		injectIntoSlide : function(el, target) {
			var imported;
			//this.$.scroller.injectIntoSlide(el);
			if(!target)
				return console.warn("Must provide a target. ", el, " will not be injected into slides");
			
			imported = Polymer.dom(this.root).importNode(el);
			
			Polymer.dom(this.$._injectablesLanding).appendChild(el);
			Polymer.dom(this.$._injectablesLanding).innerHTML = Polymer.dom(this.$._injectablesLanding).innerHTML.trim();
			
			Polymer.dom.flush();
			
			imported = Polymer.dom(this.$._injectablesLanding).firstChild;
			Polymer.dom(this.$._injectablesLanding).innerHTML = '';
			this._injectedElements.push({
				el : imported,
				target : target
			});
			
			return imported;
		},
		
		_actualSizeChanged : function(e) {
			if(typeof e.model.index == 'undefined' || !e.detail.value || (typeof e.detail.value.width == 'undefined'))
				return;

			this._sizes.all[e.model.index] = e.detail.value;
			
			this.cancelDebouncer('updateActualSize');
			this.debounce('updateActualSize', function() {
				var s = {};
				s.width = Math.max.apply(null, this._sizes.all.map(function(size) { return size.width }));
				s.height = Math.max.apply(null, this._sizes.all.map(function(size) { return size.height }));

				if(!s.width || !s.height)
					return;

				if(this._sizes.width == s.width && this._sizes.height == s.height)
					return;

				this.set("actualSize", s);
			}, 100);
		}
	});
	
	var Units = {
		getUnits : function(v) { return v.replace(/\d/g, ''); },
		multiply : function(v, factor) { return (parseFloat(v) * factor) + Units.getUnits(v) }, 
		divide : function(v, factor) { return (parseFloat(v) / factor) + Units.getUnits(v) } 
	}
})()