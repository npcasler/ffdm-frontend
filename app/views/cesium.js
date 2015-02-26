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

    var viewer = new Cesium.Viewer('cesiumContainer', {
      imageryProvider: false,
      terrainProvider: terrainProvider,      
      animation: false, 
      baseLayerPicker: false,
      timeline: false
    });
    viewer.clock.onTick.addEventListener(function(clock) {
      var camera = viewer.camera;
    });
    var scene = viewer.scene;
    var globe = scene.globe;
    var baseLayerPicker = new Cesium.BaseLayerPicker('baseLayerPickerContainer', {globe:scene.globe, imageryProviderViewModels:imageryViewModels});
    
    
    imageryLayers = new Cesium.ImageryLayerCollection();
    cesiumController.set('imageryLayers', imageryLayers);
    globe.imageryLayers = imageryLayers;
    cesiumController.set('viewer', viewer);

    
    //Uncomment to debug tiling
    layer = new Cesium.TileCoordinatesImageryProvider({
      tilingScheme: new GeographicTilingScheme(),
      color: yellow,
     });
    //imageryLayers.addImageryProvider(layer);

    this.initCB();
  },

  initCB: function() {
    console.log('initCB has been called by CesiumView');
    
    cesiumController.setupLayers();
    var viewer = cesiumController.get('viewer');
    var camera = viewer.camera;
    camera.flyTo({ 
        destination: Cesium.Cartesian3.fromDegrees(-111.100, 36.998, 5000000.0)
    });
    console.log(camera.positionCartographic);
  }

});
