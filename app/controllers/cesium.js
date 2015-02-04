import Ember from 'ember';

export default Ember.Controller.extend({
  proxy: '/cgi-bin/proxy.cgi?url=http://scooby.iplantcollaborative.org/maxent/',
  species: 'Abies_lasiocarpa',
  year: '2011',
  rcp: 'rcp26',
  imageryLayers: '',
  myTimer: '',
  viewer: '',
  clock: '',
  years: [1,2,3,4,5,6,7,8],
  activeDate: 1,
  
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
    var rcp = this.get('rcp');
    var years = this.get('years');
    var species = this.get('species');
    //Iterate through the years for each layer
    for (var i = 0; i < years.length; i++) {
      //var newUrl = 'http://scooby.iplantcollaborative.org/'+ rcp + '/20'+ years[i] + '1/'+ species;
      var newUrl = proxy + rcp + '/20' + years[i] + '1/' + species; //Use once on the server
      console.log("NewURL is "+ newUrl);
      var imageryProvider = this.createImageryProvider(newUrl);
      var alpha = this.setLayerAlpha(years[i]);
      var name = species + '-20' + years[i] + '1';
      console.log('Layer name is :'+ name); 
      this.addLayerOption(name, imageryProvider, alpha, 1);
    }
  },
 
  removeLayers: function() {
    //Clear old layers before adding new ones
    console.log('Remove layers called');
    for (var i = this.get('years').length -1; i > 0; i--){
      var year = this.get('years')[i];
      console.log('year is ' + year);
      var layer = this.get('imageryLayers').get(year)
      console.log("Layer is "+ layer);
      this.get('imageryLayers').remove(layer);
      console.log(this.get('imageryLayers'));
    }
  },

  changeSpecies: function() {
    this.set('species', 'Quercus_gambelii');
    console.log('The new species is '+ this.get('species'));
  },
  actions: {
    reloadLayers: function() {
      this.removeLayers();
      this.changeSpecies();
      this.setupLayers();
  }
  }
  
});
