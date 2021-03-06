import Database from 'better-sqlite3'
import fs from 'fs'
import {User} from './model'

export default class UserRepository{

    db: Database.Database;

    constructor() {
        this.db = new Database('db/users.db', { verbose: console.log });
        this.applyMigrations();
    }

    applyMigrations(){
        const applyMigration = (path: string) => {
            const migration = fs.readFileSync(path, 'utf8')
            this.db.exec(migration)
        }
        const testRow = this.db.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'users'").get()
        if (!testRow){
            console.log('Applying migrations on DB users...')
            const migrations = ['db/migrations/init.sql']      
            migrations.forEach(applyMigration)
        }
    }

    getAllUsers(){
        const statement = this.db.prepare("SELECT name, score FROM users");
        return statement.all();
    }

    getUserByName(name : string){
        const statement = this.db
            .prepare("SELECT user_id, name, score FROM users WHERE name = ?");
        const rows : User[] = statement.get(name);
        return rows; 
    }

    getUserById(id : string){
        const statement = this.db
            .prepare("SELECT user_id, name, score FROM users WHERE user_id = ?");
        const rows : User[] = statement.get(id);
        return rows;
    }

    createUser(name : string, password : string){
        const statement = 
            this.db.prepare("INSERT INTO users (name,password) VALUES (?,?)");
        return statement.run(name,password).lastInsertRowid;
    }

    removeUser(id : string){
        const statement = 
            this.db.prepare("DELETE FROM users WHERE user_id = ?");
        return statement.run(id).changes;
    }

    login(name : string, password : string){
        const statement = 
            this.db.prepare("SELECT * FROM users WHERE name = ? AND password = ?");
        return statement.all(name,password)[0];
    }

}