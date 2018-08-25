import { EventEmitter } from "@angular/core";
import { FullUnit } from "../full-unit";
import { Game } from "../game";
import { ProductionBonus } from "../production-bonus";
import { Research } from "../research";

export class Researches {
  researches = new Array<Research>();
  toDo: Research[];
  done: Research[];

  team1: Research;
  team2: Research;
  twin: Research;

  harvesting: Research;

  travel: Research;

  free1hWarp: Research;
  free2hWarp: Research;
  free3hWarp: Research;

  /**
   *  mastery, a special research
   *  never reset
   */
  mastery: Research;

  constructor(public researchEmitter: EventEmitter<string>) {}

  declareStuff(): void {
    this.team1 = new Research("t", this);
    this.team2 = new Research("T", this);
    this.twin = new Research("W", this);
    this.travel = new Research("r", this);
    this.mastery = new Research("M", this);
    this.harvesting = new Research("h", this, true);

    this.free1hWarp = new Research("1", this);
    this.free2hWarp = new Research("2", this);
    this.free3hWarp = new Research("3", this);

    this.team1.unlocked = true;
    this.reloadLists();
  }
  setRelations(science: FullUnit, game: Game): void {
    this.team1.genPrice(new Decimal(100), science);
    this.team2.genPrice(new Decimal(1e3), science);
    this.twin.genPrice(new Decimal(1e5), science);
    this.travel.genPrice(new Decimal(1e6), science);
    this.mastery.genPrice(new Decimal(1e20), science);
    this.harvesting.prices = game.genSciencePrice(1e3, 1e3);
    this.free1hWarp.prices = game.genSciencePrice(1);
    this.free2hWarp.prices = game.genSciencePrice(1);
    this.free3hWarp.prices = game.genSciencePrice(1);

    this.team1.toUnlock = [this.team2];
    this.team2.toUnlock = [this.twin];

    game.advWorkers.firstResearch.toUnlock.push(this.harvesting);
    const bonus = new ProductionBonus(this.harvesting, new Decimal(0.3));
    game.gatherers.list.forEach(u => {
      u.productionsEfficienty.push(bonus);
    });

    this.travel.toUnlock.push(game.tabs.travel, this.mastery);
    this.mastery.toUnlock.push(game.tabs.mastery);

    this.free1hWarp.toUnlock.push(this.free2hWarp);
    this.free1hWarp.onBuy = () => {
      game.warp(3600 * 1000);
    };
    this.free2hWarp.toUnlock.push(this.free3hWarp);
    this.free2hWarp.onBuy = () => {
      game.warp(2 * 3600 * 1000);
    };
    this.free3hWarp.onBuy = () => {
      game.warp(3 * 3600 * 1000);
    };
  }
  reset(science: FullUnit) {
    this.reloadMasteryPrice(science);
    this.researches.forEach(r => {
      r.reset();
    });

    this.mastery.reload();
    this.team1.unlocked = true;
    this.reloadLists();
  }
  reloadLists() {
    this.toDo = this.researches.filter(
      r => r.unlocked && (!r.done || r.unlimited)
    );
    this.done = this.researches.filter(
      r => r.unlocked && r.done && !r.unlimited
    );
    this.researchEmitter.emit("");
  }
  reloadMasteryPrice(science: FullUnit) {
    const masteryNum = this.mastery.quantity;
    this.mastery.genPrice(
      new Decimal(1e9).times(Decimal.pow(2, masteryNum)),
      science
    );
  }

  //#region Save and load
  getSave(): any {
    return {
      res: this.researches.map(r => r.getSave())
    };
  }
  restore(data: any, science: FullUnit): boolean {
    if ("res" in data) {
      for (const r of data.res) {
        this.researches.find(u => u.id === r.i).restore(r);
      }
      this.reloadMasteryPrice(science);
      this.reloadLists();
      return true;
    } else {
      return false;
    }
  }
  //#endregion
}
