"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.Ball = exports.Disc = exports.Player = void 0;
const schema_1 = require("@colyseus/schema");
class Player extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.team = 0; // 0 or 1
    }
}
exports.Player = Player;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Player.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Player.prototype, "team", void 0);
class Disc extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.team = 0; // 0 or 1
        this.canMove = false;
    }
}
exports.Disc = Disc;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], Disc.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Disc.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Disc.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Disc.prototype, "vx", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Disc.prototype, "vy", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Disc.prototype, "team", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], Disc.prototype, "canMove", void 0);
class Ball extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.x = 400; // center field
        this.y = 300;
        this.vx = 0;
        this.vy = 0;
    }
}
exports.Ball = Ball;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ball.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ball.prototype, "y", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ball.prototype, "vx", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Ball.prototype, "vy", void 0);
class GameState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.players = new schema_1.MapSchema();
        this.discs = new schema_1.MapSchema();
        this.ball = new Ball();
        this.currentTurn = 0; // 0 or 1
        this.gamePhase = 0; // 0=waiting, 1=playing, 2=ended
        this.scoreTeam0 = 0;
        this.scoreTeam1 = 0;
        this.maxScore = 5;
        this.isMoving = false;
        this.winner = "";
        // Game field dimensions
        this.fieldWidth = 800;
        this.fieldHeight = 600;
        this.goalWidth = 120;
        this.goalDepth = 40;
    }
}
exports.GameState = GameState;
__decorate([
    (0, schema_1.type)({ map: Player }),
    __metadata("design:type", Object)
], GameState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)({ map: Disc }),
    __metadata("design:type", Object)
], GameState.prototype, "discs", void 0);
__decorate([
    (0, schema_1.type)(Ball),
    __metadata("design:type", Object)
], GameState.prototype, "ball", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "currentTurn", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "gamePhase", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "scoreTeam0", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "scoreTeam1", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "maxScore", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], GameState.prototype, "isMoving", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], GameState.prototype, "winner", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "fieldWidth", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "fieldHeight", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "goalWidth", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameState.prototype, "goalDepth", void 0);
