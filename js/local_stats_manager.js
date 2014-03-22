function LocalStatsManager()
{
  this.stats_names_and_initials = {
    'game-size'                           : 4,
    'timestamp-game-start'                : 0,
      
    'time-game-total'                     : 0,
    'moves-total'                         : 0,
    'moves-up'                            : 0,
    'moves-down'                          : 0,
    'moves-left'                          : 0,
    'moves-right'                         : 0,
    'time-move-avg'                       : 0,
    'tiles-current'                       : 0,
    'tiles-current-pct'                   : 0,
    'tiles-avg'                           : 0,
    'tiles-avg-pct'                       : 0,
    'pos-highest-tile-corner'             : 0,
    'pos-highest-tile-corner-pct'         : 0,
    'pos-highest-tiles-outside'           : 0,
    'pos-highest-tiles-outside-pct'       : 0,
    'newtiles-2'                          : 0,
    'newtiles-4'                          : 0,
    'newtiles-4-pct'                      : 0,
    'moves-nomerge'                       : 0,
    'moves-nomerge-pct'                   : 0,
    'merges-total'                        : 0,
    'merges-4'                            : 0,
    'merges-8'                            : 0,
    'merges-16'                           : 0,
    'merges-32'                           : 0,
    'merges-64'                           : 0,
    'merges-128'                          : 0,
    'merges-256'                          : 0,
    'merges-512'                          : 0,
    'merges-1024'                         : 0,
    'merges-2048'                         : 0,
    'merges-4096'                         : 0,
    };        
        
  this.stats        = new Object();
  for (stats_name in this.stats_names_and_initials)
  {
    this.stats[stats_name]  = new LocalScoreManager('stats-' + stats_name);
    this.stats[stats_name].set( this.stats_names_and_initials[stats_name] );
  } //for

  /*
  var firebase = new Firebase('https://resplendent-fire-3517.firebaseio.com/');
  firebase.set({key: 'bestScore', value: 4234, name: 'Rayo'});
  firebase.on('value', function(snapshot) {
  alert(snapshot);
  for (property in snapshot) alert(property + ": " + snapshot[property]);
});
  */
} //LocalStatsManager()

LocalStatsManager.prototype.get = function(key)
{
  return this.stats[key].get();
};

LocalStatsManager.prototype.set = function(key, value)
{
  return this.stats[key].set(value);
};

LocalStatsManager.prototype.increase = function(key, value)
{
  if ('undefined' === typeof value)
    value = 1;
  
  return this.stats[key].set( parseInt(this.stats[key].get()) + value );
};

