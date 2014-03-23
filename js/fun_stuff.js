function FunStuff(parent)
{
  this.parent   = parent;
} //FunStuff()

FunStuff.prototype.fun_toasty_slidein = function()
{
  var parent          = this.parent;
  var toastyContainer = $('.toasty-container');
  setTimeout(function(){ parent.audio_sounds['toasty'].play(); }, 50);

  toastyContainer.animate
    ( {"left":"0px"}
    , "fast"
    , function()
    {
      toastyContainer.animate({"left":"-180px"}, "slow");
    });
}; //fun_toasty_slidein()

