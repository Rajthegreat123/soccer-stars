import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") team: number = 0; // 0 or 1
}

export class Disc extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("number") team: number = 0; // 0 or 1
  @type("boolean") canMove: boolean = false;
}

export class Ball extends Schema {
  @type("number") x: number = 400; // center field
  @type("number") y: number = 300;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Disc }) discs = new MapSchema<Disc>();
  @type(Ball) ball = new Ball();
  
  @type("number") currentTurn: number = 0; // 0 or 1
  @type("number") gamePhase: number = 0; // 0=waiting, 1=playing, 2=ended
  @type("number") scoreTeam0: number = 0;
  @type("number") scoreTeam1: number = 0;
  @type("number") maxScore: number = 5;
  @type("boolean") isMoving: boolean = false;
  @type("string") winner: string = "";
  
  // Game field dimensions
  @type("number") fieldWidth: number = 800;
  @type("number") fieldHeight: number = 600;
  @type("number") goalWidth: number = 120;
  @type("number") goalDepth: number = 40;
}