import Ember from 'ember';

export default Ember.Controller.extend({
  needs: ['plants', 'outerras'],
  proxy: '/cgi-bin/proxy.cgi?url=http://scooby.iplantcollaborative.org/maxent/', //allows access to records without opening cors
  species: '', // object holding the record from the plant table
  speciesName: 'Abies_lasiocarpa',
  year: '2011',
  rcp: 'rcp26',
  imageryLayers: '',
  imageryViewModels: [], // this will house the base layers
  myTimer: '', // timer for animations
  viewer: '',
  isAnimated: 0, // boolean to signal animations
  years: [1,2,3,4,5,6,7,8], 
  activeDate: 1, // counter to track the current year/layer
  outerrasController: Ember.computed.alias("controllers.outerras"),
  
  plantsSelected: function() {
    console.log('plant selection changed ' + this.get('species').get('sci_name'));
    this.animateMaps(0);
    $('#rcp-group').css('visibility', 'visible');
    this.set('speciesName', this.get('species').get('sci_name'));
    this.remindSubmit();
  }.observes('species'),

    
  rcpSelected: function() {
    console.log('rcp selection has changed! ' + this.get('rcp'));
    $('#year-group').css('visibility', 'visible');
    if (this.get('rcp') === 'rcp85') {
      $('#rcp85-label').addClass('active-label');
      $('#rcp26-label').removeClass('active-label');
      //$('#rcp85-label').css('border', '2px solid #bf3604');
      //$('#rcp26-label').css('border', '1px solid white');
    } else {
      $('#rcp85-label').removeClass('active-label');
      $('#rcp26-label').addClass('active-label');
      //$('#rcp26-label').css('border', '2px solid #bf3604');
      //$('#rcp85-label').css('border', '1px solid white');
    }
    this.remindSubmit();
    
  }.observes('rcp'),

  animateChanged: function() {
    var animate = this.get('isAnimated');
    console.log('Animate Changed called');
    if (animate) {
      this.animateMaps(1);
      $('#playPause').removeClass('fa-play');
      $('#playPause').addClass('fa-pause');
    } else {
      $('#playPause').removeClass('fa-pause');
      $('#playPause').addClass('fa-play');
      this.animateMaps(0);
    }
  }.observes('isAnimated'),
  
  yearChanged: function() {
    var active = this.get('activeDate');
    var newYear = "20" + active + "1";
    this.set('year', newYear);
    console.log('Year has changed to '+ this.get('year'));
  }.observes('activeDate'),


  yearSelected: function() {
    console.log('year selection changed! ' + this.get('selectedYear'));
    $('#submit-group').css('visibility', 'visible');
    $('#slider-control').css('visibility', 'visible');
    
  }.observes('selectedYear'), 

  createImageryProvider: function(url) {
    var wms = new Cesium.TileMapServiceImageryProvider({
      url: url,
      maximumLevel: 7,
      gamma: 2,
      parameters: {
        transparent: 'true',
        format: 'image/png'
      }
    });
    return wms;
  },
  
  setLayerAlpha: function(year) {
    if (year === this.get('activeDate')) {
      return 1;
    } else {
      return 0;
    }
  },

  addLayerOption: function(name, imageryProvider, alpha, show) {
    var layers = this.get('imageryLayers');
    var globe = this.get('viewer').scene.globe;
    console.log(globe.imageryLayers);
    console.log(name + ' is ready: '+ imageryProvider.ready);
    console.log(typeof layers);
    var layer = layers.addImageryProvider(imageryProvider);
    layer.name = name;
    layer.alpha = alpha;
    layer.show = show;
  },

  setupLayers: function() {
    //Add all the decade layers for the given species and rcp
    //This will need to be refactored to allow it to be species specific
    var proxy = this.get('proxy');
    var rcp = this.get('rcp');
    var years = this.get('years');
    
    var speciesName = this.get('speciesName');
    console.log(speciesName);
    //Iterate through the years for each layer
    var readyCounter = 0;
    for (var i = 0; i < years.length; i++) {
      var newUrl = proxy + rcp + '/20' + years[i] + '1/' + speciesName; //Use once on the server
      var imageryProvider = this.createImageryProvider(newUrl);
      var alpha = this.setLayerAlpha(years[i]);
      var name = speciesName + '-20' + years[i] + '1';
      
      
      this.addLayerOption(name, imageryProvider, alpha, 1);
     
    }
  },

  addBillboard: function(x,y, title, description) {
    console.log("Adding Billboard...");
    var viewer = this.get('viewer');
    //Create the marker for the map
    var marker = viewer.entities.add({
      name: title,
      //marker position, need to account for elevation
      position: Cesium.Cartesian3.fromDegrees(x, y, 3000),
      billboard: {
        image: 'assets/images/outerra-pin.png',
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffsetScaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 1.5e6, 0.0),
      },
      description: '<img href='+description +'></img>',
      //currently not being recognized
      viewFrom: Cesium.Cartesian3.fromDegrees(x,y,10000)
        
    });
  },
  loadPoints: function() {

   //This function will load the data for outerra points.
  
    // Get the Model from the Outerra controller
    var outerraModel = this.get('outerrasController').get('model');
    //Capture scope for timeout function
    var self = this;
    setTimeout(function() {
     
      console.log('Second try');
      //this gathers a reference to promise array that pulls the outerra records
      var content = outerraModel.get('content');
      console.log(content);

      if (content.isLoaded) {
      //For some reason there are three levels of 'content' to get to actual data
      var points = content.get('content');
      //Iterate through the returned records
      for (var x =0, len = points.length; x < len; x++) {
        var lat = points[x].get('y');
        var lon = points[x].get('x');
        console.log('lat: '+lat+', lon: '+lon);
        var title = points[x].get('title');
        var description = points[x].get('url');
        //Add the marker to the map
        self.addBillboard(lon, lat, title, description);
      }
      }

    }, 1000);


  },
 
  
  removeLayers: function() {
    //Clear old layers before adding new ones
    this.set('isAnimated', 0);
    console.log('Remove layers called');
    var layerLength = this.get('imageryLayers').length;
    console.log(layerLength);
    for (var i = layerLength; i > 0; i--){
      console.log('Removing layer ' + i+ ' out of '+this.get('years').length+ " layers");
      var layer = this.get('imageryLayers').get(i)
      //console.log("Layer is "+ layer);
      
      this.get('imageryLayers').remove(layer);
      //console.log(this.get('imageryLayers'));
    }
  },
//If direction is 1, it will move forward in time, else it goes backward in time
  changeYear: function(direction) {
   
    var active = this.get('activeDate');
    var oldLayer = this.get('imageryLayers').get(active);
    if (direction === 1){ 
      if (active < this.get('years').length) {
        console.log('Moving forward in time');
        active = active + 1;
      } else {
        console.log('Moving to start');
        active = 1;
      }
    } else {
      if (active > 1) {
        console.log('Moving backward in time');
        active = active - 1;
      } else {
        console.log('Moving to end');
        active = this.get('years').length;
      }
    }
    this.set('activeDate', active);
    var newLayer = this.get('imageryLayers').get(active);
    oldLayer.alpha = 0;
    newLayer.alpha = 1;
  },
    
 

  animateMaps: function(start) {
    if (start) {
      var self = this;
      this.set('myTimer', null);
      console.log('Animating maps...');
      this.set('myTimer', setInterval(function() {
        self.changeYear(1);
        console.log("Animated");
      }, 500));
    } else {
      console.log('Stopping animation');
      clearInterval(this.get('myTimer'));
    }
  },


  changeSpecies: function() {
    this.set('speciesName', this.get('species').get('sci_name'));
    console.log('The new species is '+ this.get('species').get('sci_name'));
  },
    pulseObject: function(varname) {
      $(String(varname)).removeClass('pulse');
      setTimeout(
          function() {
            console.log('Pulsing ' + varname);
            $(String(varname)).addClass('pulse');}, 1);
    },
  
    remindSubmit: function() {
      if (this.get('selectedYear') !== null) {
        this.pulseObject('#submit-desc');
      }
    },
  actions: {
    reloadLayers: function() {
      this.removeLayers();
      //this.changeSpecies();
      this.setupLayers();
  },

    plusYear: function() {
      this.changeYear(1);
    },
    minusYear: function() {
      this.changeYear(0);
    },

    setWorstRcp: function() {
        this.set('rcp', 'rcp85');
      },
    setBestRcp: function() {
        this.set('rcp', 'rcp26');
      
    },
    getEntity: function() {
    },
    playPause: function() {
      if (this.get('isAnimated')) {
        console.log("Stopping animation");
        this.set('isAnimated', 0);
      } else {
        console.log("Starting animation");
        this.set('isAnimated', 1);
      }
    },

  } 
});
