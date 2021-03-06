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
			_imageContainerSizingStyle : { type : String, value : "", notify : true }
		},
		
		observers : [
			'_updateSize(isAttached,noCaptions,noBorder,slidesPerView,width,height,images.*)',
			'_currentPageChanged(currentPage,isReady,isAttached)'
		],
		
		refresh : function() {
			if(!this.$.rvs)
				this.async(this.refresh, 500); // try again later
			
			this.debounce("refresh", function() {
				this.updateStyles();
				this.$.rvs.refresh();
			}, 1000);
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
			if(this.noBorder)    // || includeBorder === true " - 2px" : " - 30px")
				return "0px";
				
			return "(2 * " + (this.getComputedStyleValue("--slide-frame-border-width") || "6px") + ")";
		},
		
		_imageContainerPaddingWidth : function() {
			return "(2 * " + (this.getComputedStyleValue("--image-container-padding-width") || "9px") + ")";
		},
		
		_scrollerReadyChanged : function() {
			if(!this.isReady)
				return;
			
			this.$.rvs.iscroll.on('scrollEnd', this._pageChangedFromScroller.bind(this));
			
			var p = this.currentPage;
			
			//this.set("currentPage", -1);
			
			//if(this.currentPage >= 0)
			//	this.$.rvs.iscroll.goToPage(p, 0)
			
			this._currentPageChanged();
			
			//if(this.currentPage >= 0)
			//	this.async(this.$.rvs.iscroll.goToPage.bind(this.$.rvs.iscroll, this.currentPage, 0), 5000)
				
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
			this.goToPage(this.currentPage);
		},
		
		_pageChangedFromScroller : function(n, o)
		{
			if(!this.$.rvs.iscroll)
				return;
			
			this.set("currentPage", this.$.rvs.iscroll.currentPage.pageX);
		},
	
		goToPage : function(n) {
			if(n < 0)
				return;
				
			if(this.disabled || !this.images.length) 
				return;
			
			if(!this.$.rvs.iscroll || !this.$.rvs.iscroll.pages.length || (!n && n != 0))
			{
				this.set("isWaiting", true);
				this.cancelAsync(this.__waitingForIScroll);
				this.__waitingForIScroll = this.async(this._pageChangedFromBinding, 200); // waiting for iscroll to be ready
				return 
			}
			//this.debounce("goToPage", function() {
			this.$.rvs.iscroll.goToPage(n, 0, this.isWaiting ? 0 : undefined)

			this.set("isWaiting", false);
				
			//}, 30);
		},
	
		ready : function() {
			this._injectedElements = [];
		},
	
		attached : function() {
			this.set('attached', true)	
		},
		
		_currentPageChanged : function() {
			var slide;
			
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
		}
	});
	
	var Units = {
		getUnits : function(v) { return v.replace(/\d/g, ''); },
		multiply : function(v, factor) { return (parseFloat(v) * factor) + Units.getUnits(v) }, 
		divide : function(v, factor) { return (parseFloat(v) / factor) + Units.getUnits(v) } 
	}
})()