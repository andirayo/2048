function GameManager(size, InputManager, Actuator, ScoreManager, StatsManager) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.scoreManager = new ScoreManager("bestScore");
  this.actuator     = new Actuator;
  this.statsManager = new StatsManager;
  this.funStuff     = new FunStuff(this);

  this.startTiles   = 2;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.continue();
  this.setup();
};

// Keep playing after winning
GameManager.prototype.keepPlaying = function () {
  this.keepPlaying = true;
  this.actuator.continue();
};

GameManager.prototype.isGameTerminated = function () {
  if (this.over || (this.won && !this.keepPlaying)) {
    return true;
  } else {
    return false;
  }
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid               = new Grid(this.size);
      
  this.score              = 0;
  this.over               = false;
  this.won                = false;
  this.keepPlaying        = false;
  this.scoreNext1Thousand = 1000;
  this.scoreNext2Thousand = 2000;
  this.greatMoveInARowCounter = 0;

  // first move is not used for stats
  this.timestampGameStart = false;
  this.timestampLastMove  = false; // Date.now();
  this.timeMoveAverage    = 0;


  // very good: http://www.freesound.org/
  // also good: http://www.freesfx.co.uk/sfx
  // OGG-conversion: http://media.io/
  // OGG-conversion: http://audio.online-convert.com/convert-to-ogg
  this.folder_data_audio  = 'data/audio/';
  this.audio_filenames    = {
       4: 'zipper_with_coins.ogg',
       8: 'coins_dropping2.ogg',
      16: 'coin_dropping1.ogg',
      32: 'checkout.ogg',
      64: 'charging.ogg',
     128: 'voice_alright.ogg',
     256: 'gold_rain.ogg',
     512: 'voice_halleluja.ogg',
    1024: 'sirene.ogg',
    2048: 'slot_machine.ogg',
    4096: 'dingdingding.ogg',
    'toasty': 'toasty.ogg',
    };
  this.audio_sounds                 = new Object();
  for (key in this.audio_filenames)
    this.audio_sounds[key]          = new Audio( this.folder_data_audio + this.audio_filenames[key] );

  this.tiles_current                = 0;
  this.sum_tiles_current            = 0;
  this.countPosHighestTileCorner    = 0;
  this.countPosHighestTilesOutside  = 0;

  this.assumedMaxPossible = 16384;
  this.gridNumberMax      = 0;
  this.gridNumberMin      = this.assumedMaxPossible;
  this.gridNumberCount    = 0;
  this.gridNumberMaxX     = [];
  this.gridNumberMinX     = [];
  this.gridNumberCountX   = [];
  this.gridNumberMaxY     = [];
  this.gridNumberMinY     = [];
  this.gridNumberCountY   = [];
  this.gridNumbersXY      = [];
  this.gridNumbersYX      = [];
  for (var x = 0; x < this.size; x++)
  {
    this.gridNumbersXY[x]     = new Array(this.size);
    this.gridNumbersYX[x]     = new Array(this.size);
    this.gridNumberMaxX[x]    = 0;
    this.gridNumberMinX[x]    = this.assumedMaxPossible;
    this.gridNumberCountX[x]  = 0;
    this.gridNumberMaxY[x]    = 0;
    this.gridNumberMinY[x]    = this.assumedMaxPossible;
    this.gridNumberCountY[x]  = 0;
  } //for

  this.statsManager.set('game-size', this.size);
  this.statsManager.set('timestamp-game-start', null);


  // Add the initial tiles
  this.addStartTiles();

  this.updateGridNumbers();

  posHighestTileCorner            = (this.statsCheckPositionHightestTileCorner()  ?  1  :  0);
  this.countPosHighestTileCorner  += posHighestTileCorner;
  this.statsManager.set('pos-highest-tile-corner'       , posHighestTileCorner);
  this.statsManager.set('pos-highest-tile-corner-pct'   , (this.countPosHighestTileCorner * 100 / (1 + 0)).toFixed(0));
  posHighestTilesOutside            = (this.statsCheckPositionHightestTilesOutside()  ?  1  :  0);
  this.countPosHighestTilesOutside  += posHighestTilesOutside;
  this.statsManager.set('pos-highest-tiles-outside'     , posHighestTilesOutside);
  this.statsManager.set('pos-highest-tiles-outside-pct' , (this.countPosHighestTilesOutside * 100 / (1 + 0)).toFixed(0));


  // Update the actuator
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function () {
  for (var i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function () {
  if (this.grid.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var tile = new Tile(this.grid.randomAvailableCell(), value);
    this.statsManager.increase('newtiles-' + value);
    this.tiles_current++;

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  if (this.scoreManager.get() < this.score) {
    this.scoreManager.set(this.score);
  }

  this.actuator.actuate(this.grid, {
    score:        this.score,
    over:         this.over,
    won:          this.won,
    bestScore:    this.scoreManager.get(),
    terminated:   this.isGameTerminated(),
    statsManager: this.statsManager,
  });

};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function () {
  this.grid.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function (tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  var cell, tile;

  var vector      = this.getVector(direction);
  var traversals  = this.buildTraversals(vector);
  var moved       = false;
  var tilesMerged = 0;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      cell = { x: x, y: y };
      tile = self.grid.cellContent(cell);

      if (tile) {
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom)
        {
          var merged        = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          tilesMerged       = Math.max(merged.value, tilesMerged);
          // ### Statistics ##################################
          self.statsManager.increase('merges-total');
          self.statsManager.increase('merges-' + merged.value);
          self.audio_sounds[merged.value].play();
          self.tiles_current--;


          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });
  if (moved)
  {
    // ### Fun Stuff ##################################
    if  (32 <= tilesMerged)
      this.greatMoveInARowCounter++;
    else
      this.greatMoveInARowCounter = 0;

    if  (3 <= this.greatMoveInARowCounter)
    {
      this.funStuff.fun_toasty_slidein();
    } //if

    if  (this.scoreNext2Thousand < this.score)
    {
      this.funStuff.fun_toasty_slidein();
      this.scoreNext2Thousand += 2000;
    } //if

    if  (this.scoreNext1Thousand < this.score)
    {
      // nothing yet
      this.scoreNext1Thousand += 1000;
    } //if


    // ### Game ##################################
    this.addRandomTile();

    if (!this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.updateGridNumbers();


    // ### Statistics ##################################
    this.statsManager.increase('moves-total');
    switch (direction)
    {
      case 0:
        this.statsManager.increase('moves-up');
        break;
      case 1:
        this.statsManager.increase('moves-right');
        break;
      case 2:
        this.statsManager.increase('moves-down');
        break;
      case 3:
        this.statsManager.increase('moves-left');
        break;
    } //switch

    var movesTotal          = parseInt(this.statsManager.get('moves-total'));
    // -----------------------------------------------------
    posHighestTileCorner              = (this.statsCheckPositionHightestTileCorner()  ?  1  :  0);
    this.countPosHighestTileCorner    += posHighestTileCorner;
    this.statsManager.set('pos-highest-tile-corner'    , posHighestTileCorner);
    this.statsManager.set('pos-highest-tile-corner-pct', (this.countPosHighestTileCorner * 100 / (1 + movesTotal)).toFixed(0));
    posHighestTilesOutside            = (this.statsCheckPositionHightestTilesOutside()  ?  1  :  0);
    this.countPosHighestTilesOutside  += posHighestTilesOutside;
    this.statsManager.set('pos-highest-tiles-outside'     , posHighestTilesOutside);
    this.statsManager.set('pos-highest-tiles-outside-pct' , (this.countPosHighestTilesOutside * 100 / (1 + movesTotal)).toFixed(0));

    // -----------------------------------------------------
    this.sum_tiles_current  += this.tiles_current

    this.statsManager.set('tiles-current', this.tiles_current);
    this.statsManager.set('tiles-avg', (this.sum_tiles_current / movesTotal).toFixed(1));

    // -----------------------------------------------------
    if  (! tilesMerged)
      this.statsManager.increase('moves-nomerge');

    this.timestampLastMove    = Date.now();
    if  (! this.timestampGameStart)
    {
      this.timestampGameStart = Date.now();
      this.statsManager.set('timestamp-game-start', this.timestampGameStart);
    } //if
    // =================================================


    this.actuate();
  }
};
GameManager.prototype.statsCheckPositionHightestTileCorner = function()
{
  return  (   (this.gridNumberMax == this.gridNumbersXY[0][0])
          ||  (this.gridNumberMax == this.gridNumbersXY[0][this.size -1])
          ||  (this.gridNumberMax == this.gridNumbersXY[this.size -1][0])
          ||  (this.gridNumberMax == this.gridNumbersXY[this.size -1][this.size -1])
          );
}; //statsCheckPositionHightestTileCorner
GameManager.prototype.statsCheckPositionHightestTilesOutside = function()
{
  // the outside traverse in question has to be filled half (at least)
          // checking the top row
  return (
        (   (this.size / 2 <= this.gridNumberCountY[0])
        &&  (Math.max.apply(Math, this.gridNumberMaxY.slice(1, this.size)) <= this.gridNumberMinY[0])
        )
        // checking the bottom row
    ||  (   (this.size / 2 <= this.gridNumberCountY[this.size -1])
        &&  (Math.max.apply(Math, this.gridNumberMaxY.slice(0, this.size -1)) <= this.gridNumberMinY[this.size -1])
        )
        // checking the left column
    ||  (   (this.size / 2 <= this.gridNumberCountX[0])
        &&  (Math.max.apply(Math, this.gridNumberMaxX.slice(1, this.size)) <= this.gridNumberMinX[0])
        )
        // checking the bottom row
    ||  (   (this.size / 2 <= this.gridNumberCountX[this.size -1])
        &&  (Math.max.apply(Math, this.gridNumberMaxX.slice(0, this.size -1)) <= this.gridNumberMinX[this.size -1])
        )
    );
}; //statsCheckPositionHightestTilesOutside()

GameManager.prototype.updateGridNumbers = function()
{
  var self              = this;
  
  this.gridNumberMax    = 0;
  this.gridNumberMin    = this.assumedMaxPossible;
  this.gridNumberCount  = 0;
  for (var x = 0; x < this.size; x++)
  {
    this.gridNumberMaxX[x]    = 0;
    this.gridNumberMinX[x]    = this.assumedMaxPossible;
    this.gridNumberCountX[x]  = 0;

    for (var y = 0; y < this.size; y++)
    {
      if  (0 == x)
      {
        this.gridNumberMaxY[y]    = 0;
        this.gridNumberMinY[y]    = this.assumedMaxPossible;
        this.gridNumberCountY[y]  = 0;
      } //if


      tile  = self.grid.cellContent( {x:x,y:y} );
      value = tile  ?  tile.value  :  0;

      this.gridNumbersXY[x][y]  = value;
      this.gridNumbersYX[y][x]  = value;


      this.gridNumberMaxX[x]    = Math.max( value, this.gridNumberMaxX[x] );
      this.gridNumberMaxY[y]    = Math.max( value, this.gridNumberMaxY[y] );
      this.gridNumberMax        = Math.max( value, this.gridNumberMax );

      if  (tile)
      {
        this.gridNumberMinX[x]  = Math.min( value, this.gridNumberMinX[x] );
        this.gridNumberMinY[y]  = Math.min( value, this.gridNumberMinY[y] );
        this.gridNumberMin      = Math.min( value, this.gridNumberMin );

        this.gridNumberCountX[x]++;
        this.gridNumberCountY[y]++;
        this.gridNumberCount++;
      } //if
    } //for
  } //for
}; //updateGridNumbers()

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  var map = {
    0: { x: 0,  y: -1 }, // up
    1: { x: 1,  y: 0 },  // right
    2: { x: 0,  y: 1 },  // down
    3: { x: -1, y: 0 }   // left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.grid.withinBounds(cell) &&
           this.grid.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function () {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.grid.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};
