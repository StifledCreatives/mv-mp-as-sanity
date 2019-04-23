/*:
 * @plugindesc  Implements behaviour required for using MP as a Sanity gauge.
 * @author Feldherren
 *
 * @param Default Enemy Type
 * @desc Default type assigned to enemies when enemy_type tag is not present
 * @default human
 *
 * @help MP as Sanity v0.4, by Feldherren (rpaliwoda AT googlemail.com)
 
 A plugin that implements certain variables required for sanity (MP) behaviour.
 These variables can be accessed from attack formula.
 
 Changelog:
 v0.1: initial version
 v0.2: removed reference to Yanfly's Action Beginning and End Effect plugin
 v0.3: changed a few tag and variable names. Updated Attack formula so it
 doesn't just assume an actor is being attacked by or attacking an enemy unit,
 and takes sanity gain and loss multipliers into account.
 v0.4: changed Enemy Types plugin setting to Default Enemy Type. Changed
 some variable names for consistency - mostly relating to enemy types.
 Removed sanity_type_gain_multipliers, sanity_type_loss_multipliers and
 replaced with a general sanity_type_multipliers array.
 Also, stopped trying to convert meta.sanity_type into an integer.
 Updated attack formula in the comment at the bottom. Included 
 non-single-line version for readability.
 v0.5: no change to the script, but to the formula at the end;
 has a special case for the Old Medal equippable that reduces sanity
 loss from killing human-type enemies to -3 instead of -10.

 Free for use with commercial projects, though I'd appreciate being
 contacted if you do use it in any games, just to know.

 Notebox tags:
  Actor:
   <sanity_gain_multiplier:float>
    General MP gain multiplier for Actor; applies to all MP gains 
    through this system.
   <sanity_loss_multiplier:float>
    General MP loss multiplier for Actor; applies to all MP losses 
    through this system.
   <sanity_type_multiplier:string:float[,string:float,...]>
    Enemy type-based MP loss multiplier; only applies to sanity changes from 
	interactions with enemies of the specified type. Separate string-float 
	pairs with commas if you want more than one.
  Enemy:
   <sanity_attack_change:integer>
    How much the target Actor's MP changes when being attacked by this Enemy.
   <sanity_kill_change:integer>
    How much the attacking Actor's MP changes when killing instances of this 
    Enemy.
   <sanity_type:string>
    Enemy type; mostly used for Prometheus' unique interactions.
 */ 
 
(function() {
	var parameters = PluginManager.parameters('FELD_mpSanity');

	var _Game_Actor_setup = Game_Actor.prototype.setup;
	Game_Actor.prototype.setup = function(actorId) {
		_Game_Actor_setup.call(this, actorId);
		
		this.actor().sanity_gain_multiplier = 1.0;
		this.actor().sanity_loss_multiplier = 1.0;
		this.actor().sanity_type_multipliers = {}; // dict
		
		if (this.actor().meta.sanity_gain_multiplier)
		{
			this.actor().sanity_gain_multiplier = parseFloat(this.actor().meta.sanity_gain_multiplier);
		}
		
		if (this.actor().meta.sanity_loss_multiplier)
		{
			this.actor().sanity_loss_multiplier = parseFloat(this.actor().meta.sanity_loss_multiplier);
		}
		
		if (this.actor().meta.sanity_type_multiplier)
		{
			typesValues = this.actor().meta.sanity_type_multiplier.split(',');
			arrayLength = typesValues.length;
			for (var i = 0; i < arrayLength; i++)
			{
				this.actor().sanity_type_multipliers[typesValues[i].split(':')[0]] = parseFloat(typesValues[i].split(':')[1])
			}
		}
	};

	var _Game_Enemy_setup = Game_Enemy.prototype.setup;
	Game_Enemy.prototype.setup = function(enemyId, x, y) {
		_Game_Enemy_setup.call(this, enemyId, x, y);
		
		//console.log(this.enemy());
		
		this.enemy().sanity_attack_change = 0;
		this.enemy().sanity_kill_change = 0;
		this.enemy().sanity_type = parameters["Default Enemy Type"];
		
		if (this.enemy().meta.sanity_attack_change)
		{
			this.enemy().sanity_attack_change = parseInt(this.enemy().meta.sanity_attack_change);
		}
		
		if (this.enemy().meta.sanity_kill_change)
		{
			this.enemy().sanity_kill_change = parseInt(this.enemy().meta.sanity_kill_change);
		}
		
		if (this.enemy().meta.sanity_type)
		{
			this.enemy().sanity_type = this.enemy().meta.sanity_type;
		}
	};
})();
/*
So far, plug the following into attack (or whatever damaging skill you want):

dmg=a.atk * 4 - b.def * 2; type_multiplier = 1; if (b.isEnemy() && a.isActor()) { 	enemyType = b.enemy().sanity_type; 	if (b.enemy().sanity_type in a.actor().sanity_type_multipliers)	type_multiplier = a.actor().sanity_type_multipliers[b.enemy().sanity_type]; } else if (a.isEnemy() && b.isActor()) { 	enemyType = a.enemy().sanity_type; 	if (a.enemy().sanity_type in b.actor().sanity_type_multipliers)	type_multiplier = b.actor().sanity_type_multipliers[a.enemy().sanity_type]; } if (b.isEnemy() && a.isActor()) { 	if (b.enemy().sanity_attack_change > 0) 	{	a.gainMp(b.enemy().sanity_attack_change*a.actor().sanity_gain_multiplier*type_multiplier); 	} 	else 	{	a.gainMp(b.enemy().sanity_attack_change*a.actor().sanity_loss_multiplier*type_multiplier); 	} } else if (a.isEnemy() && b.isActor()) { 	if (a.enemy().sanity_attack_change > 0) 	{	b.gainMp(a.enemy().sanity_attack_change*b.actor().sanity_gain_multiplier*type_multiplier); 	} 	else 	{	b.gainMp(a.enemy().sanity_attack_change*b.actor().sanity_loss_multiplier*type_multiplier); 	} }  if (b.isEnemy()) { 	critMod = 1; 	guardMod = 1; 	elemMod = b.elementRate(1); 	if (b.result().critical)	critMod = 3; 	if (b.isGuard())	guardMod = b.grd; 	if (dmg*critMod*elemMod*guardMod>=b.hp) 	{	var sanity_change = b.enemy().sanity_kill_change*a.actor().sanity_loss_multiplier*type_multiplier;	if (a.equips()[1]) 	if (a.equips()[1].id == 3)	if (enemyType == "human")	sanity_change = -3;	a.gainMp(sanity_change); 	} } dmg

replace 'a.atk * 4 - b.def * 2' in 'dmg=a.atk * 4 - b.def * 2;' if we change the attack formula (it's at the start)
replace '3' in 'if (b.result().critical) critMod = 3;' if we change the critical hit damage multiplier (near the end)
replace the ID used for elementRate() in 'elemMod = b.elementRate(1);' if we use this formula for an attack that doesn't use the element at ID 1
Change the 3 at the end of 'a.equips()[1].id == 3' to whatever the equipment ID is for the Old Medal. The [1] indicates equip slot if we change that; currently it's in shield
Needs to have 0 variance.

Laid out more sensibly:

dmg=a.atk * 4 - b.def * 2;
type_multiplier = 1;
if (b.isEnemy() && a.isActor())
{
	enemyType = b.enemy().sanity_type;
	if (b.enemy().sanity_type in a.actor().sanity_type_multipliers)
		type_multiplier = a.actor().sanity_type_multipliers[b.enemy().sanity_type];
}
else if (a.isEnemy() && b.isActor())
{
	enemyType = a.enemy().sanity_type;
	if (a.enemy().sanity_type in b.actor().sanity_type_multipliers)
		type_multiplier = b.actor().sanity_type_multipliers[a.enemy().sanity_type];
}
if (b.isEnemy() && a.isActor())
{
	if (b.enemy().sanity_attack_change > 0)
	{
		a.gainMp(b.enemy().sanity_attack_change*a.actor().sanity_gain_multiplier*type_multiplier);
	}
	else
	{
		a.gainMp(b.enemy().sanity_attack_change*a.actor().sanity_loss_multiplier*type_multiplier);
	}
}
else if (a.isEnemy() && b.isActor())
{
	if (a.enemy().sanity_attack_change > 0)
	{
		b.gainMp(a.enemy().sanity_attack_change*b.actor().sanity_gain_multiplier*type_multiplier);
	}
	else
	{
		b.gainMp(a.enemy().sanity_attack_change*b.actor().sanity_loss_multiplier*type_multiplier);
	}
} 
if (b.isEnemy())
{
	critMod = 1;
	guardMod = 1;
	elemMod = b.elementRate(1);
	if (b.result().critical)
		critMod = 3;
	if (b.isGuard())
		guardMod = b.grd;
	if (dmg*critMod*elemMod*guardMod>=b.hp)
	{
		var sanity_change = b.enemy().sanity_kill_change*a.actor().sanity_loss_multiplier*type_multiplier;
		if (a.equips()[1]) 
			if (a.equips()[1].id == 3)
				if (enemyType == "human")
					sanity_change = -3;
		a.gainMp(sanity_change);
	}
}
dmg
*/