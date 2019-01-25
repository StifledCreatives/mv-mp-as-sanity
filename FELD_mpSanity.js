/*:
 * @plugindesc  Implements behaviour required for using MP as a Sanity gauge.
 * @author Feldherren
 *
 * @param Enemy Types
 * @desc List of enemy types that may be used to distinguish different groups of enemies; comma separated
 * @default human,monster
 *
 * @help MP as Sanity v0.1, by Feldherren (rpaliwoda AT googlemail.com)
 
 A plugin that implements certain variables required for sanity (MP) behaviour.
 These variables can be accessed from attack formula.
 
 Changelog:
 v0.1: initial version
 v0.2: removed reference to Yanfly's Action Beginning and End Effect plugin

 Free for use with commercial projects, though I'd appreciate being
 contacted if you do use it in any games, just to know.

 Notebox tags:
  Actor:
   <mp_gain_multiplier:float>
    General MP gain multiplier for Actor; applies to all MP gains 
    through this system.
   <mp_loss_multiplier:float>
    General MP loss multiplier for Actor; applies to all MP losses 
    through this system.
   <type_mp_gain_multiplier:string:float[,string:float,...]>
    Enemy type-based MP gain multiplier; only applies to MP gains from 
    interactions with enemies of the specified type. Separate string-float 
    pairs with commas if you want more than one.
   <type_mp_loss_multiplier:string:float[,string:float,...]>
    Enemy type-based MP loss multiplier; only applies to MP losses from 
	interactions with enemies of the specified type. Separate string-float 
	pairs with commas if you want more than one.
  Enemy:
   <sanity_attack_change:integer>
    How much the target Actor's MP changes when being attacked by this Enemy.
   <sanity_kill_change:integer>
    How much the attacking Actor's MP changes when killing instances of this 
    Enemy.
   <enemy_type:string>
    Enemy type; mostly used for Prometheus' unique interactions.
 */ 
 
(function() {
	var parameters = PluginManager.parameters('FELD_mpSanity');

	var _Game_Actor_setup = Game_Actor.prototype.setup;
	Game_Actor.prototype.setup = function(actorId) {
		_Game_Actor_setup.call(this, actorId);
		
		this.actor().sanity_mp_gain_multiplier = 1.0;
		this.actor().sanity_mp_loss_multiplier = 1.0;
		this.actor().sanity_type_gain_multipliers = {}; // dict
		this.actor().sanity_type_loss_multipliers = {}; // dict
		
		if (this.actor().meta.mp_gain_multiplier)
		{
			this.actor().sanity_mp_gain_multiplier = parseFloat(this.actor().meta.mp_gain_multiplier);
		}
		
		if (this.actor().meta.mp_loss_multiplier)
		{
			this.actor().sanity_mp_loss_multiplier = parseFloat(this.actor().meta.mp_loss_multiplier);
		}
		
		if (this.actor().meta.type_mp_gain_multiplier)
		{
			typesValues = this.actor().meta.type_mp_gain_multiplier.split(',');
			arrayLength = typesValues.length;
			for (var i = 0; i < arrayLength; i++)
			{
				this.actor().sanity_type_gain_multipliers[typesValues[i].split(':')[0]] = parseFloat(typesValues[i].split(':')[1])
			}
		}
		
		if (this.actor().meta.type_mp_loss_multiplier)
		{
			typesValues = this.actor().meta.type_mp_loss_multiplier.split(',');
			arrayLength = typesValues.length;
			for (var i = 0; i < arrayLength; i++)
			{
				this.actor().sanity_type_loss_multipliers[typesValues[i].split(':')[0]] = parseFloat(typesValues[i].split(':')[1])
			}
		}
	};

	var _Game_Enemy_setup = Game_Enemy.prototype.setup;
	Game_Enemy.prototype.setup = function(enemyId, x, y) {
		_Game_Enemy_setup.call(this, enemyId, x, y);
		
		//console.log(this.enemy());
		
		this.enemy().sanity_attack_change = 0
		this.enemy().sanity_kill_change = 0
		
		if (this.enemy().meta.sanity_attack_change)
		{
			this.enemy().sanity_attack_change = parseInt(this.enemy().meta.sanity_attack_change);
		}
		
		if (this.enemy().meta.sanity_kill_change)
		{
			this.enemy().sanity_kill_change = parseInt(this.enemy().meta.sanity_kill_change);
		}
	};
})();
/*
    So far, plug the following into attack:
	
	b.isEnemy()?a.gainMp(b.enemy().sanity_attack_change):b.gainMp(a.enemy().sanity_attack_change); if (b.isEnemy()) if (b.result().critical) { if ((a.atk * 4 - b.def * 2)*3>=b.hp) a.gainMp(b.enemy().sanity_kill_change);} else {if ((a.atk * 4 - b.def * 2)>=b.hp) a.gainMp(b.enemy().sanity_kill_change);} a.atk * 4 - b.def * 2
	
	replace 'a.atk * 4 - b.def * 2' if we change the attack formula
	replace '*3' if we change the critical hit damage multiplier
*/