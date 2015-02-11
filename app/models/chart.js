import DS from 'ember-data';

export default DS.Model.extend({
  plant   : DS.belongsTo('plant'),
  pictureUrl : DS.attr('string'),
  figureUrl : DS.attr('string'),
  headline  : DS.belongsTo('headline'),
  createdAt : DS.attr(),
  updatedAt : DS.attr()
});
