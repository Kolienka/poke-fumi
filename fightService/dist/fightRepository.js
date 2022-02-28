"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
class FightRepository {
    constructor() {
        this.addPokemonType = (pokemon_id, type_name, level_damage, target_type) => {
            const isTypeExists = this.db.prepare(`SELECT type_id FROM Type WHERE type_name = '${type_name}' AND target_type = '${target_type}'`).get();
            let statement, type_id;
            if (!isTypeExists) {
                statement = this.db.prepare("INSERT INTO Type (type_name, level_damage, target_type) VALUES (?,?,?)");
                statement.run(type_name, level_damage, target_type);
                statement = this.db.prepare(`SELECT type_id FROM Type WHERE type_name = '${type_name}' AND target_type = '${target_type}'`).get();
                this.insertPokemonType(pokemon_id, statement.type_id);
            }
        };
        this.insertPokemonType = (pokemon_id, type_id) => {
            const statement = this.db.prepare("INSERT INTO Pokemon_Type(pokemon_id, type_id) VALUES (?,?)");
            statement.run(pokemon_id, type_id).changes;
        };
        this.createFight = (idMatch) => {
            const statement = this.db.prepare("INSERT INTO fight (match_id) VALUES (?) ");
            return statement.run(idMatch).lastInsertRowid;
        };
        this.sendPokemonToArena = (idFight, idPokemon) => {
            let i = 1;
            const isFirst = this.db.prepare("SELECT * FROM fight WHERE fight_id = " + idFight + " AND pokemon1 IS NULL").get();
            if (!isFirst) {
                i = 2;
                console.log("DETERMINER QUI EST LE VAINQUEUR");
            }
            const statement = this.db.prepare("UPDATE fight SET pokemon" + i + " = ? WHERE fight_id = ?");
            statement.run(idPokemon, idFight).lastInsertRowid;
        };
        this.isFightStart = (idFight) => {
            return this.db.prepare("SELECT * FROM fight WHERE fight_id = " + idFight + " AND pokemon1 IS NOT NULL AND pokemon2 IS NOT NULL").get();
        };
        this.db = new better_sqlite3_1.default('db/fight.db', { verbose: console.log });
        this.applyMigrations();
    }
    applyMigrations() {
        const applyMigration = (path) => {
            const migration = fs_1.default.readFileSync(path, 'utf8');
            this.db.exec(migration);
        };
        const isFightTableExists = this.db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'fight'").get();
        const isPokemonTableExists = this.db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name ='pokemon'").get();
        if (!isFightTableExists || !isPokemonTableExists) {
            console.log('Applying migrations on DB users...');
            const migrations = ['db/migrations/init.sql'];
            console.log("Allo ?");
            migrations.forEach(applyMigration);
            console.log("toujours là ?");
        }
    }
    getAllFights() {
        const statement = this.db.prepare("SELECT * FROM fight");
        const rows = statement.all();
        return rows;
    }
    getAllPokemons() {
        const statement = this.db.prepare("SELECT * FROM pokemon");
        const rows = statement.all();
        return rows;
    }
    getPokemon(id) {
        const statement = this.db.prepare(`SELECT * FROM Pokemon AS p INNER JOIN Pokemon_Type AS pt ON p.pokemon_id = pt.pokemon_id INNER JOIN Type AS t ON pt.type_id = t.type_id WHERE pt.pokemon_id = ?`);
        const rows = statement.all(id);
        console.log(rows);
        return rows;
    }
    addPokemon(pokemon_id, name) {
        const statement = this.db.prepare("INSERT INTO pokemon (pokemon_id,name) VALUES (?,?)");
        statement.run(pokemon_id, name).lastInsertRowid;
    }
    getPokemonModel(id) {
        const data = this.getPokemon(id);
        let type = [];
        let no_damage_to = [];
        let half_damage_to = [];
        let double_damage_to = [];
        for (let i = 0; i < data.length; i++) {
            if (type.length == 0 || !type.includes(data[i].type)) {
                type.push(data[i].type);
            }
            switch (data[i].level_damage) {
                case "double":
                    double_damage_to.push(data[i].target_type);
                    break;
                case "half":
                    half_damage_to.push(data[i].target_type);
                    break;
                case "no":
                    no_damage_to.push(data[i].target_type);
                    break;
                default:
            }
        }
        console.log("DATAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
        console.log(data);
        const model = {
            pokemon_id: id,
            name: data[0].name,
            type: type,
            no_damage_to: no_damage_to,
            half_damage_to: half_damage_to,
            double_damage_to: double_damage_to
        };
        return model;
    }
    determineWinner(pokemon1, pokemon2) {
        let isPokemon1Winner = false;
        let isPokemon2Winner = false;
        for (let i = 0; i < pokemon2.type.length; i++) {
            if (pokemon1.double_damage_to.includes(pokemon2.type[i])) {
                isPokemon1Winner = true;
                break;
            }
        }
        for (let i = 0; i < pokemon1.type.length; i++) {
            if (pokemon2.double_damage_to.includes(pokemon2.type[i])) {
                isPokemon2Winner = true;
                break;
            }
        }
        if (isPokemon1Winner !== isPokemon2Winner) {
            if (isPokemon1Winner)
                return pokemon1;
            return pokemon2;
        }
        else {
            isPokemon1Winner = false;
            isPokemon2Winner = false;
            for (let i = 0; i < pokemon2.type.length; i++) {
                if (pokemon1.half_damage_to.includes(pokemon2.type[i])) {
                    isPokemon1Winner = true;
                    break;
                }
            }
            for (let i = 0; i < pokemon1.type.length; i++) {
                if (pokemon2.half_damage_to.includes(pokemon1.type[i])) {
                    isPokemon2Winner = true;
                    break;
                }
            }
            if (isPokemon1Winner !== isPokemon2Winner) {
                if (isPokemon1Winner)
                    return pokemon1;
                return pokemon2;
            }
            else {
                isPokemon1Winner = false;
                isPokemon2Winner = false;
                for (let i = 0; i < pokemon2.type.length; i++) {
                    if (pokemon1.no_damage_to.includes(pokemon2.type[i])) {
                        isPokemon2Winner = true;
                        break;
                    }
                }
                for (let i = 0; i < pokemon1.type.length; i++) {
                    if (!pokemon2.no_damage_to.includes(pokemon2.type[i])) {
                        isPokemon1Winner = true;
                        break;
                    }
                }
                if (isPokemon1Winner !== isPokemon2Winner) {
                    if (isPokemon1Winner)
                        return pokemon1;
                    return pokemon2;
                }
                else {
                    let i = Math.floor(Math.random() * (2 + 1));
                    if (i == 1) {
                        return pokemon1;
                    }
                    return pokemon2;
                }
            }
        }
    }
    getFight(id) {
        const statement = this.db.prepare(`SELECT * FROM Fight WHERE fight_id = '${id}'`);
        const rows = statement.all();
        console.log(rows);
        return rows;
    }
    getFightModel(id) {
        const data = this.getFight(id);
        const pokemon1 = this.getPokemonModel(data[0].pokemon1);
        const pokemon2 = this.getPokemonModel(data[0].pokemon2);
        const model = {
            fight_id: id,
            match_id: data[0].match_id,
            pokemon1: pokemon1,
            pokemon2: pokemon2,
            winner: null
        };
        return model;
    }
}
exports.default = FightRepository;
//# sourceMappingURL=fightRepository.js.map