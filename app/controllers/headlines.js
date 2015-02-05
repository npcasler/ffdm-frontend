import Ember from 'ember';

export default Ember.ArrayController.extend({
  sortProperties: ['orderId'],
  sortAscending: true,
  previousScroll: $(window).scrollTop()
});
