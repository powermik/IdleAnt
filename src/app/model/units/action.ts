import { Unlocable } from '../utils';
import { Base } from './base';
import { Unit } from './unit';
import { Production } from '../production';
import { first } from 'rxjs/operator/first';
import { any } from 'codelyzer/util/function';
import * as decimal from 'decimal.js';
import { GameModel } from '../gameModel';
import { GameService } from '../../game.service';
import { Cost } from '../cost';

export class Action extends Base {

  public oneTime = false
  public up: Action
  public limit: decimal.Decimal
  public showNumber = true

  realPriceNow = new Array<Cost>()
  maxBuy = new Decimal(0)

  constructor(
    id: string,
    name: string,
    public fn: (number: decimal.Decimal) => boolean,
    public priceF = Array<Cost>(),
    description = "",
    public game: GameModel,
    public unit: Unit = null
  ) {
    super(game, id, name, description)
    this.realPriceNow = this.getCosts()

    this.game.actionList.push(this)
  }

  getRealPrices() {
    if (this.unit)
      return this.priceF.map(p => new Cost(p.unit, p.basePrice.times(this.unit.worldBuyModifiers), p.growFactor))
    else
      return this.priceF
  }
  buy(number: decimal.Decimal = new Decimal(1)) {

    if (number.lessThanOrEqualTo(0))
      return false

    if (this.unlocked) {
      const prices = this.getCosts(number)
      if (prices.filter(v => v.basePrice.greaterThan(v.unit.quantity)).length === 0) {
        prices.forEach(p => {
          p.unit.quantity = p.unit.quantity.minus(p.basePrice)
          this.game.currentEarning = this.game.currentEarning.plus(p.basePrice)
        })
        this.quantity = this.quantity.plus(number)
        if (this.fn)
          this.fn(number)
        if (this.oneTime)
          this.unlocked = false

        this.game.reloadProduction()
        this.realPriceNow = this.getCosts()
        this.setMaxBuy()
        return true
      }
    }
    return false
  }
  getCosts(number: decimal.Decimal = new Decimal(1)) {
    const price = this.getRealPrices()
    return price.map(c => {
      const constRet = new Cost()
      constRet.unit = c.unit
      if (!c.growFactor.equals(1))
        constRet.basePrice = c.basePrice.times(
          (c.growFactor.pow(this.quantity)).times(
            (c.growFactor.pow(number)).minus(1))
        ).div(c.growFactor.minus(1)).ceil()
      else
        constRet.basePrice = c.basePrice.times(number).ceil()
      return constRet
    })
  }
  getBuyMax(): decimal.Decimal {
    if (!this.unlocked)
      return Decimal(0)

    const price = this.getRealPrices()

    //    https://blog.kongregate.com/the-math-of-idle-games-part-i/
    let max = Decimal(Infinity)
    for (const p of price) {
      max = Decimal.min(max,
        (p.growFactor.lessThanOrEqualTo(1) ?
          p.unit.quantity.div(p.basePrice) :
          Decimal.log(
            (((p.growFactor.minus(1)).times(p.unit.quantity))
              .div((p.growFactor.pow(this.quantity)).times(p.basePrice))
            ).plus(1), p.growFactor.toNumber())
        ).floor()
      )
    }
    if (this.oneTime && max.greaterThanOrEqualTo(1))
      return Decimal(1)

    if (this.limit)
      max = Decimal.min(max, this.limit.minus(this.quantity))

    return max
  }
  owned(): boolean {
    return this.quantity.greaterThan(0)
  }
  reload() {
    this.realPriceNow = this.getCosts()
  }
  setMaxBuy() {
    if (this.oneTime) {
      this.maxBuy = !this.owned() && this.checkBuy() ? Decimal(1) : Decimal(0)
    } else {
      this.maxBuy = this.getBuyMax()
    }
  }
  checkBuy() {
    if (!this.unlocked)
      return false
    this.realPriceNow = this.getCosts()
    const size1 = this.realPriceNow.length
    for (let i = 0; i < size1; i++)
      if (this.realPriceNow[i].basePrice.greaterThan(this.realPriceNow[i].unit.quantity))
        return false

    return true
  }
}

export class BuyAction extends Action {
  constructor(
    game: GameModel,
    unit: Unit,
    cost: Cost[],
    public doNext: () => any = null
  ) {
    super("actBuy", "Hire",
      (n => {
        this.unit.quantity = this.unit.quantity.plus(
          n.times(
            this.unit.upHire ? this.unit.upHire.quantity.plus(1) : Decimal(1)
          ))
        if (this.doNext)
          this.doNext()
        return true
      }),
      cost, "Get more units.", game, unit
    )
    unit.buyAction = this
  }
  initialize() {
    super.initialize()
    this.unlocked = false
  }
}

export class BuyAndUnlockAction extends BuyAction {
  constructor(
    game: GameModel,
    public unit: Unit,
    public cost: Cost[],
    public toUnlock: Base[],
    public required = 1,
    public doAfter: () => any = null,
    once = false
  ) {
    super(game, unit, cost, () => {
      if (this.toUnlock && this.unit.quantity.greaterThanOrEqualTo(this.required))
        this.unit.model.unlockUnits(this.toUnlock)()

      if (this.doAfter)
        this.doAfter()
    })
    this.oneTime = once
  }
}

export class Research extends Action {
  constructor(
    id: string,
    name: string,
    description: string,
    cost: Cost[],
    public toUnlock: Unlocable[],
    public game: GameModel,
    public doAfter: () => any = null
  ) {
    super(id,
      name,
      n => {
        if (this.toUnlock)
          game.unlockUnits(this.toUnlock)()

        if (this.doAfter)
          this.doAfter()

        return true
      },
      cost,
      description, game)
    this.oneTime = true
    game.resList.push(this)
  }
}

export class UpAction extends Action {
  constructor(
    game: GameModel,
    public unit: Unit,
    costs: [Cost]
  ) {
    super("upA",
      "Teamwork",
      null,
      costs,
      "Get a better production bonus.",
      game, unit
    )
    this.unit.upAction = this
    this.unlocked = false
  }
}

export class UpSpecial extends Action {
  constructor(
    game: GameModel,
    public unit: Unit

  ) {
    super("upS",
      "Experiment",
      null,
      [
        new Cost(unit, Decimal(100), Decimal(10)),
        new Cost(unit.model.baseWorld.science, Decimal(100), Decimal(12))
      ],
      "Do some experiment to increase the procuction.",
      game, unit
    )
    this.unit.upSpecial = this
    this.unlocked = false
  }
}

export class UpHire extends Action {
  constructor(
    game: GameModel,
    public unit: Unit,
    costs: [Cost]
  ) {
    super("upH",
      "Twin",
      null,
      costs,
      "Get more units for the same price.",
      game, unit
    )
    this.unit.upHire = this
    this.unit.buyAction.up = this
    this.unlocked = false
  }
}

export class UnlockProd extends Action {
  constructor(
    game: GameModel,
    unit: Unit,
    cost: Cost[],
    prod: Production
  ) {
    super("uProd-" + prod.unit.id,
      "Training",
      n => { prod.unlocked = true; return true },
      cost,
      "Train new units",
      game
    )
    this.oneTime = true
    this.unlocked = true
  }

}

export class TimeWarp extends Action {
  constructor(
    game: GameModel,
    public timeUnits: decimal.Decimal,
    public timeName: string
  ) {
    super("actWarp", "Time Warp",
      (n => {
        game.longUpdate(n.times(timeUnits).times(1000).toNumber(), true)
        return true
      }),
      [new Cost(game.prestige.time, timeUnits, Decimal(1))],
      "Time warp by " + timeName, game
    )
    this.initialize()
  }
  initialize() {
    super.initialize()
    this.unlocked = true
    this.showNumber = false
  }
}
