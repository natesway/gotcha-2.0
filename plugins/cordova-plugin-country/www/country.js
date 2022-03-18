cordova.define("cordova-plugin-country.Country", function(require, exports, module) {
var Country = function() {};

/*var CountryError = function(code, message) {
  this.code = code || null;
  this.message = message || '';
};*/

Country.prototype.get = function(success, fail) {
  cordova.exec(success, fail, 'Country', 'get', []);
};

if (!window.plugins) {
  window.plugins = {};
}
if (!window.plugins.country) {
  window.plugins.country = new Country();
}

if (module.exports) {
  module.exports = Country;
}
});
