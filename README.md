# ir-gallery

**A simple gallery with 3 types of workmodes and support for templates.**

### Features

- 1 ability to open a reduced image in a dilog window larger size
- 2 built-in gallery
- 3 dialog gallery
- 4 customizing gallery by using templates

## It's about

using gallery as you want. You can config all this stuff by your own templates.

## Sample template usage

	<ir-gallery theme="blackfriday">
		<img src="...">
		<img src="...">
		<img src="...">
	</ir-gallery>

	<ir-gallery-theme name="blackfriday"> 
		<template inline> 
		    <style>
		    	.main p {
		    	 	color : red; 
		    	}
		    </style> 
		    <div class="main">
		    	<!-- here would be main part of inline gallery - scroller with large pictures -->
		    </div> 
		    <div>
		    	<p>inline advertising for example</p>
		    </div> 
		    <div class="scroller">
		    	<!-- here would be inline gallery thumbnails - scroller with small preview pictures -->
		    </div> 
	    </template> 
	    <template dialog> 
		    <style>
		    	.dmain p {
	    			color : red; 
	    		} 
	    		.galleryBlock { 
	    			background-color: #000000;
	    			box-shadow: 0 0 0 0; 
	    			padding: 10px;
    			}
		    	#cancelButton {
	    	 		color: white; 
	    	 	} 
		    	#back { 
		    	 	color: white; 
	    	 	}
	    	 	#forward { 
	    	 	 	color: white; 
	    	 	}
		    	#dialogChild {
		    		margin : 0;
		    		padding: 0; 
		    	}
		    </style> 
		    <div class="galleryBlock"> 
			    <div class="dmain">
			    	<!-- here would be main part of dialog gallery - scroller with large pictures -->
			    </div>
			    <!-- below is an example of using ads --> 
			    <div style="margin: auto; width: 600px;" class="toResize">
			      <!-- on your custom blocks add class "toResize" for correct responsive work -->
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			      <img style="height: 50px;" src="http://ipsumimage.appspot.com/cga?l=ad%20unit|home-center-left">
			    </div> 
			    <div class="dscroller">
			    	<!-- here would be dialog gallery thumbnails - scroller with small preview pictures -->
			    </div>
		    	<!-- you can make close button whatever you want, and just add "cancelButton" ID on this button to make it work --> 
			    <paper-icon-button id="cancelButton" icon="cancel"></paper-icon-button> 
		    </div> 
	    </template>
  </ir-gallery-theme>

# WARNING
## DO NOT SET THE SAME ID NAMES IN DIFFERENT TEMPLATES

## State

It's still in the development stage

### License
[MIT](http://opensource.org/licenses/MIT) 