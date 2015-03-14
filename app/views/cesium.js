import Ember from 'ember';
/* global Cesium */
export default Ember.View.extend({

  didInsertElement: function() {
    var CESIUM_BASE_URL = '.';
    var cesiumController = this.get('controller'); 
    var proxy = cesiumController.get('proxy');
    var rcp = cesiumController.get('rcp');
    var species = cesiumController.get('species');
       
    var imageryLayers = cesiumController.get('imageryLayers');
    var imageryViewModels = cesiumController.get('imageryViewModels');
    
    imageryViewModels.push(new Cesium.ProviderViewModel({
            name: 'ArcGIS World Street Map',
            iconUrl : Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/esriWorldImagery.png'),
            tooltip: 'World Imagery provided by ESRI',
            creationFunction: function() {
              return new Cesium.ArcGisMapServerImageryProvider({
                url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/Mapserver',
                errorEvent: function(e) {
                  console.log("There was an error loading the tile: "+ e);
                },

              });
            }
    }));

    imageryViewModels.push(new Cesium.ProviderViewModel({
           name : 'Open\u00adStreet\u00adMap',
           iconUrl : Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
           tooltip : 'OpenStreetMap (OSM) is a collaborative project to create a free editable \
      map of the world.\nhttp://www.openstreetmap.org',
           creationFunction : function() {
                      return new Cesium.OpenStreetMapImageryProvider({
                                     url : '//a.tile.openstreetmap.org/'
                                 });
                           }
     }));

     var terrainProvider = new Cesium.CesiumTerrainProvider({
        url: '//cesiumjs.org/stk-terrain/tilesets/world/tiles',
        credit: 'Terrain data courtesy of Analytical Graphics, Inc'
      });
    console.log("imageryViewModels created as: "+imageryViewModels);
    cesiumController.set('imageryViewModels', imageryViewModels);
    //var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {imageryProviderViewModels:imageryViewModels});

    var viewer = new Cesium.Viewer('cesiumContainer', {
      
         
      animation: false, 
      baseLayerPicker: true,
      imageryProviderViewModels: imageryViewModels,
      timeline: false
    });
    viewer.clock.onTick.addEventListener(function(clock) {
      var camera = viewer.camera;
    });
    var scene = viewer.scene;
    var globe = scene.globe;
    cesiumController.set('viewer', viewer);
    //set the imagery layers for controller
    imageryLayers = globe.imageryLayers; 
    cesiumController.set('imageryLayers', imageryLayers);
    console.log(cesiumController.get('viewer')); 

/*
    Create an event handler for onclick events
    var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction(function(cursor) {
      console.log(cursor.position);
      var pickedObject = scene.pick(cursor.position);
      console.log(pickedObject);
      if (Cesium.defined(pickedObject)) {
        var id = Cesium.defaultValue(pickedObject.id, pickedObject.primitive.id);
        if (id instanceof Cesium.Entity) {
          console.log(id.name);
        }
      } else {
        console.log("No entity here");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 */

     
    this.initCB();
  },

  initCB: function() {
    console.log('initCB has been called by CesiumView');
    var cesiumController = this.get('controller');
    cesiumController.setupLayers();
    var viewer = cesiumController.get('viewer');
    var camera = viewer.camera;
    
    //cesiumController.loadPoints();
    camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(-111.100, 36.998, 5000000.0)
    });
    console.log(camera.positionCartographic);
  }

});
