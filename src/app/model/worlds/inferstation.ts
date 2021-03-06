import { Production } from '../production';
import { WorldInterface } from './worldInterface';
import { Unit } from '../units/unit';
import { GameModel } from '../gameModel';
import { BuyAction, BuyAndUnlockAction, UpAction, UpHire, UpSpecial, Research } from '../units/action';
import { Cost } from '../cost';
import { TypeList } from '../typeList';
import { World } from '../world';

export class Infestation implements WorldInterface {

  poisonousPlant: Unit
  poisonousPlant2: Unit
  weedkiller: Unit
  chemistAnt: Unit
  disinfestationAnt: Unit
  flametrowerAnt: Unit

  disinfestationBeetle: Unit
  flametrowerBeetle: Unit

  chemistBee: Unit

  basicDisinfestationRes: Research
  flametrowerRes: Research
  weedkillerRes: Research

  listInfestation = new Array<Unit>()

  constructor(public game: GameModel) { }

  public declareStuff() {

    this.listInfestation = new Array<Unit>()

    this.poisonousPlant = new Unit(this.game, "poisPlant", "Poisonous Plant",
      "This plant may kill them all.")
    this.poisonousPlant2 = new Unit(this.game, "poisPlant2", "Old Poisonous Plant",
      "Process poisonus plants!.")
    this.disinfestationAnt = new Unit(this.game, "defAnt", "Disinfestation Ant",
      "Destroy poisonus plants.")
    this.flametrowerAnt = new Unit(this.game, "flameAnt", "Flamethrower Ant",
      "Burn poisonus plants.")
    this.weedkiller = new Unit(this.game, "weedkiller", "Weedkiller",
      "Destroy poisonus plants efficently.")
    this.chemistAnt = new Unit(this.game, "chemistAnt", "Chemist Ant",
      "Proces weedkiller.")
    this.disinfestationBeetle = new Unit(this.game, "disinfestationBeetle", "Disinfestation Beetle",
      "Beetle are also good at killing plants.")
    this.flametrowerBeetle = new Unit(this.game, "flametrowerBeetle", "Flamethrower Beetle",
      "A beetle with a flametrower.")
    this.chemistBee = new Unit(this.game, "chemistBee", "Chemist Bee",
      "A chemist bee.")

    this.poisonousPlant2.alwaysOn = true

    this.listInfestation.push(this.poisonousPlant2)
    this.listInfestation.push(this.poisonousPlant)
    this.listInfestation.push(this.weedkiller)
    this.listInfestation.push(this.chemistAnt)
    this.listInfestation.push(this.disinfestationAnt)
    this.listInfestation.push(this.flametrowerAnt)
    this.listInfestation.push(this.disinfestationBeetle)
    this.listInfestation.push(this.flametrowerBeetle)
    this.listInfestation.push(this.chemistBee)

    this.game.lists.push(new TypeList("Infestation", this.listInfestation))

    //    Weedkiller
    this.weedkillerRes = new Research(
      "weedkillerRes",
      "Weedkiller", "Weedkiller will slowly kill poisonus plants.",
      [new Cost(this.game.baseWorld.science, Decimal(1E4))],
      [this.weedkiller, this.chemistAnt],
      this.game
    )

    //    Flame
    this.flametrowerRes = new Research(
      "flametrowerRes",
      "Flamethrower", "Burn poisonus plants.",
      [new Cost(this.game.baseWorld.science, Decimal(1E3))],
      [this.flametrowerAnt, this.flametrowerBeetle],
      this.game
    )

    //    Disinfestation
    this.basicDisinfestationRes = new Research(
      "basicDisinfestationRes",
      "Disinfestation", "Unlock basic disinfestation units.",
      [new Cost(this.game.baseWorld.science, Decimal(100))],
      [
        this.disinfestationAnt, this.disinfestationBeetle,
        this.flametrowerRes, this.weedkillerRes
      ],
      this.game
    )
    this.basicDisinfestationRes.avabileBaseWorld = false

  }

  public initStuff() {

    this.poisonousPlant.addProductor(new Production(this.poisonousPlant2))
    this.poisonousPlant.addProductor(new Production(this.disinfestationAnt, Decimal(-10)))
    this.poisonousPlant.addProductor(new Production(this.disinfestationBeetle, Decimal(-12)))

    this.poisonousPlant.addProductor(new Production(this.flametrowerBeetle, Decimal(-100)))
    this.game.baseWorld.wood.addProductor(new Production(this.flametrowerBeetle, Decimal(-5)))

    this.poisonousPlant.addProductor(new Production(this.flametrowerAnt, Decimal(-120)))
    this.game.baseWorld.wood.addProductor(new Production(this.flametrowerAnt, Decimal(-5)))

    this.poisonousPlant.addProductor(new Production(this.weedkiller, Decimal(-0.01)))
    this.game.baseWorld.fungus.addProductor(new Production(this.chemistAnt, Decimal(-10)))
    this.game.baseWorld.soil.addProductor(new Production(this.chemistAnt, Decimal(-10)))
    this.weedkiller.addProductor(new Production(this.chemistAnt, Decimal(1)))

    //  Disinfestation
    this.disinfestationAnt.actions.push(new BuyAction(this.game, this.disinfestationAnt,
      [
        new Cost(this.game.baseWorld.littleAnt, Decimal(1), this.game.buyExpUnit),
        new Cost(this.game.baseWorld.food, Decimal(1000), this.game.buyExp),
        new Cost(this.game.baseWorld.crystal, Decimal(100), this.game.buyExp)
      ]
    ))
    this.disinfestationAnt.actions.push(new UpAction(this.game, this.disinfestationAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))
    this.disinfestationAnt.actions.push(new UpHire(this.game, this.disinfestationAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))

    //  Flametrower
    this.flametrowerAnt.actions.push(new BuyAction(this.game, this.flametrowerAnt,
      [
        new Cost(this.game.baseWorld.littleAnt, Decimal(1), this.game.buyExpUnit),
        new Cost(this.game.baseWorld.food, Decimal(12E3), this.game.buyExp),
        new Cost(this.game.baseWorld.wood, Decimal(8E3), this.game.buyExp),
        new Cost(this.game.baseWorld.crystal, Decimal(4E3), this.game.buyExp)
      ]
    ))
    this.flametrowerAnt.actions.push(new UpAction(this.game, this.flametrowerAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost3, this.game.upgradeScienceExp)]))
    this.flametrowerAnt.actions.push(new UpHire(this.game, this.flametrowerAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost3, this.game.upgradeScienceExp)]))

    //  Chemist
    this.chemistAnt.actions.push(new BuyAction(this.game, this.chemistAnt,
      [
        new Cost(this.game.baseWorld.littleAnt, Decimal(1), this.game.buyExpUnit),
        new Cost(this.game.baseWorld.food, Decimal(12E3), this.game.buyExp),
        new Cost(this.game.baseWorld.fungus, Decimal(1E5), this.game.buyExp),
        new Cost(this.game.baseWorld.soil, Decimal(6E4), this.game.buyExp)
      ]
    ))
    this.chemistAnt.actions.push(new UpAction(this.game, this.chemistAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost4, this.game.upgradeScienceExp)]))
    this.chemistAnt.actions.push(new UpHire(this.game, this.chemistAnt,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost4, this.game.upgradeScienceExp)]))

    //    Beetle
    this.disinfestationBeetle.actions.push(new BuyAction(this.game,
      this.disinfestationBeetle,
      [
        new Cost(this.game.forest.larva, Decimal(1), this.game.buyExpUnit),
        new Cost(this.game.baseWorld.wood, Decimal(300), this.game.buyExp),
        new Cost(this.game.baseWorld.food, Decimal(3000), this.game.buyExp)
      ]
    ))
    this.disinfestationBeetle.actions.push(new UpAction(this.game,
      this.disinfestationBeetle, [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))
    this.disinfestationBeetle.actions.push(new UpHire(this.game,
      this.disinfestationBeetle, [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))
    this.disinfestationBeetle.avabileBaseWorld = false

    //  Flametrower  Beetle
    this.flametrowerBeetle.actions.push(new BuyAction(this.game,
      this.flametrowerBeetle,
      [
        new Cost(this.game.forest.larva, Decimal(1), this.game.buyExp),
        new Cost(this.game.baseWorld.wood, Decimal(15E3), this.game.buyExp),
        new Cost(this.game.baseWorld.food, Decimal(5E3), this.game.buyExp),
        new Cost(this.game.baseWorld.soil, Decimal(6E4), this.game.buyExp)
      ]
    ))
    this.flametrowerBeetle.actions.push(new UpAction(this.game, this.flametrowerBeetle,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))
    this.flametrowerBeetle.actions.push(new UpHire(this.game, this.flametrowerBeetle,
      [new Cost(this.game.baseWorld.science, this.game.scienceCost2, this.game.upgradeScienceExp)]))
    this.flametrowerBeetle.avabileBaseWorld = false
  }

  public addWorld() {
    World.worldPrefix.push(
      new World(this.game, "Infested", "",
        [],
        [],
        [],
        [],
        [],
        [
          [this.poisonousPlant, Decimal(1E7)],
          [this.poisonousPlant2, Decimal(1E2)],
          [this.basicDisinfestationRes, Decimal(0)]
        ],
        Decimal(5.5),
        [new Cost(this.poisonousPlant, Decimal(5E3))]
      )
    )

    World.worldSuffix.push(

      new World(this.game, "of Infestation", "",
        [this.basicDisinfestationRes],
        [],
        [],
        [],
        [],
        [
          [this.poisonousPlant, Decimal(1E7)],
          [this.poisonousPlant2, Decimal(1E2)],
          [this.basicDisinfestationRes, Decimal(0)]
        ],
        Decimal(5.5),
        [new Cost(this.poisonousPlant, Decimal(5E3))]
      )
    )

  }
}
