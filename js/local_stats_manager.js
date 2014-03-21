function LocalStatsManager()
{
  this.stats_names_and_initials = {
    'time-game-total'   : 0,
    'moves-total'       : 0,
    'moves-up'          : 0,
    'moves-down'        : 0,
    'moves-left'        : 0,
    'moves-right'       : 0,
    'moves-nomerge'     : 0,
    'newtiles-2'        : 0,
    'newtiles-4'        : 0,
    'merges-total'      : 0,
    'merges-4'          : 0,
    'merges-8'          : 0,
    'merges-16'         : 0,
    'merges-32'         : 0,
    'merges-64'         : 0,
    'merges-128'        : 0,
    'merges-256'        : 0,
    'merges-512'        : 0,
    'merges-1024'       : 0,
    'merges-2048'       : 0,
    'merges-4096'       : 0,
    'time-move-average' : 0,
    };

  this.stats        = new Object();
  for (stats_name in this.stats_names_and_initials)
  {
    this.stats[stats_name]  = new LocalScoreManager('stats-' + stats_name);
    this.stats[stats_name].set( this.stats_names_and_initials[stats_name] );
  } //for
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

