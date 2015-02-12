import Ember from 'ember';

export default Ember.Controller.extend({
  needs: ['plants'],
  proxy: '/cgi-bin/proxy.cgi?url=http://scooby.iplantcollaborative.org/maxent/',
  species: '',
  speciesName: 'Abies_lasiocarpa',
  year: '2011',
  rcp: 'rcp26',
 // selectedYear: null,
  selectedRcp: 'rcp26',
  imageryLayers: '',
  myTimer: '',
  viewer: '',
  isAnimated: 0,
  years: [1,2,3,4,5,6,7,8],
  activeDate: 1,


  plantsSelected: function() {
    console.log('plant selection changed ' + this.get('species').get('sci_name'));
    this.animateMaps(0);
    $('#rcp-group').css('visibility', 'visible');
    this.set('speciesName', this.get('species').get('sci_name'));
    this.remindSubmit();
  }.observes('species'),

    
  rcpSelected: function() {
    console.log('rcp selection has changed! ' + this.get('selectedRcp'));
    $('#year-group').css('visibility', 'visible');
    if (this.get('selectedRcp') === 'rcp85') {
      $('#rcp85-label').css('border', '2px solid #bf3604');
      $('#rcp26-label').css('border', '1px solid white');
    } else {
      $('#rcp26-label').css('border', '2px solid #bf3604');
      $('#rcp85-label').css('border', '1px solid white');
    }
    this.remindSubmit();
    
  }.observes('selectedRcp'),

  yearChanged: function() {
    var active = this.get('activeDate');
    var newYear = "20" + active + "1";
    this.set('year', newYear);
    console.log('Year has changed to '+ this.get('year'));
  }.observes('activeDate'),

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

  yearSelected: function() {
    console.log('year selection changed! ' + this.get('selectedYear'));
    $('#submit-group').css('visibility', 'visible');
    $('#slider-control').css('visibility', 'visible');
    
  }.observes('selectedYear'), 

  stepClock: function() {
    var currentDate = this.get('activeDate');
    console.log('StepClock called on cesiumController');
    if (currentDate >= 8) {
      this.set('activeDate', 1);
    } else {
      this.set('activeDate', currentDate + 1);
      console.log('Active date is ' + this.get('activeDate'));
    }
    var dateFormatted = '20'+ this.get('activeDate') + '1-01-01';
    console.log(dateFormatted);
    var dateEncoded = new Cesium.JulianDate.fromIso8601(dateFormatted);
    console.log(dateEncoded);
    console.log(this.get('clock').currentTime);
    this.get('clock').currentTime = dateEncoded;
  },

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
    console.log(layers);
    var layer = layers.addImageryProvider(imageryProvider);
    layer.name = name;
    layer.alpha = alpha;
    layer.show = show;
  },

  setupLayers: function() {
    //Add all the decade layers for the given species and rcp
    //This will need to be refactored to allow it to be species specific
    var proxy = this.get('proxy');
    var rcp = this.get('selectedRcp');
    var years = this.get('years');
    var species = this.get('species');
    console.log(typeof species);
    console.log(species);
    var speciesName = this.get('speciesName');
    console.log(speciesName);
    //Iterate through the years for each layer
    for (var i = 0; i < years.length; i++) {
      var newUrl = proxy + rcp + '/20' + years[i] + '1/' + speciesName; //Use once on the server
      console.log("NewURL is "+ newUrl);
      var imageryProvider = this.createImageryProvider(newUrl);
      var alpha = this.setLayerAlpha(years[i]);
      var name = speciesName + '-20' + years[i] + '1';
      console.log('Layer name is :'+ name); 
      this.addLayerOption(name, imageryProvider, alpha, 1);
     
    }
  },
 
  removeLayers: function() {
    //Clear old layers before adding new ones
    this.animateMaps(0);
    console.log('Remove layers called');
    for (var i = this.get('years').length; i > 0; i--){
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
    console.log('Active layer is: '+active);
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
    this.set('species', this.get('species').get('sci_name'));
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
