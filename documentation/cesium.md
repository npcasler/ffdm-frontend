
#### Change tooltip for Cesium tool icons:

BaseLayerPicker:

1. vim Source/Widgets/BaseLayerPicker/BaseLayerPicker.js
2. /cesium-toolbar-button<br><br>
      var element = document.createElement('button');
      element.type = 'button';
      element.className = 'cesium-button cesium-toolbar-button';
      element.setAtrribute('data-bind', '\
      attr: { title: buttonTooltip },\
      click: toggleDropDown');
      container.appendChild(element);
3. Add title to element: ``element.title = 'Choose another background map image',``
4. Remove 'title: buttonTooltip' from element (comment out for later use..).
5. Should now look like:
      var element = document.createElement('button');
      element.type = 'button';
      element.className = 'cesium-button cesium-toolbar-button';
      element.title = 'Choose another background map image';
      element.setAtrribute('data-bind', '\
      // attr: { title: buttonTooltip },\
      attr: { },\
      click: toggleDropDown');
      container.appendChild(element);
5. Rebuild Cesium (from cesium dir): ``./Tools/apache-ant-1.8.2/bin/ant combine runServer``
6. Check results: ``localhost:8080``


SceneModePicker:

1. vim Source/Widgets/SceneModePicker/SceneModePicker.js
2. /cesium-sceneModePicker-wrapper<br>
      var wrapper = document.createElement('span');
      wrapper.className = 'cesium-sceneModePicker-wrapper cesium-toolbar-button';
      container.appendChild(wrapper);
3. Add title to wrapper: ``wrapper.title = 'Change map projection';``
4. Should now look like:
      var wrapper = document.createElement('span');
      wrapper.title = 'Change map projection';
      wrapper.className = 'cesium-sceneModePicker-wrapper cesium-toolbar-button';
      container.appendChild(wrapper);

