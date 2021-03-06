import * as express from "express";
import * as AdminController from "./adminController";
import {User} from './model';
import * as UserController from './userController';
import {authenticateJWT} from './authMiddleware' 

export const register = (app: express.Application) => {
    const bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', (_,res) => res.send('Hello world from player service'));

    app.get('/user/getAllUsers', authenticateJWT, (_,res) => {
        res.status(200).json(UserController.listUsers());
    });

    app.get('/user/getUserByName', authenticateJWT, (req,res) => {
        const name = req.query.name as string;
        if(name){
            res.status(200).json(UserController.getUserByName(name));
        }else{
            res.status(400).json("Please specify a username");
        }
    });

    app.get('/user/getUserById', authenticateJWT, (req,res) => {
        const id = req.query.id as string;
        if(id){
            res.status(200).json(UserController.getUserById(id));
        }else{
            res.status(400).json("Please specify an id");
        }
    });

    app.post('/user/register', (req,res) => {
        const newUser: User = req.body;
        const userName = UserController.getUserByName(newUser.name);
        if(userName){
            res.status(400).json("This username is already taken");
        }else{
            res.status(200).json(UserController.addUser(newUser.name,newUser.password));
        }
    });

    app.post('/user/connect', (req, res) => {
        const {name,password} = req.body;
        const user : User = UserController.login(name,password);
        if(user){
          res.status(200).json(user);
        }else{
          res.status(400).send("Invalid username or password, please try again...")
        }
    });

    app.delete('/user/remove', authenticateJWT, (req,res) => {
        const {id} = req.body;
        const user_id = UserController.getUserById(id);
        if(user_id){
            AdminController.removeUser(id);
            res.status(200).json("The user: " + id + " has been removed");
        }else{
            res.status(400).send("Please check the user's id");
        }
    });

    app.put('/user/update', (req,res) => {
        const {id, name, password} = req.body;
        const user_id = UserController.getUserById(id);
        if(user_id){
            AdminController.updateUser(id,name,password);
            res.status(200).json("The user: " + id + " has been modified");
        } else {
            res.status(400).send("Please check the user's id");
        }
    })

}