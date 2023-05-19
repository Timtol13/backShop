const app = require('express')()
const sqlite3 = require('sqlite3'),  TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;
const cors = require('cors')

const db = new TransactionDatabase(new sqlite3.Database('shop'))

const createUser = (login, password, name, surname, description) => {
    db.run(`INSERT INTO users (login, password, Username, Surname, description) VALUES (?, ?, ?, ?, ?)`, [login, password, name, surname, description], function(err) {
        if (err) {
          console.error(err);
          console.log('Error saving user to database')
        } else {
          console.log(`User with ID ${this.lastID} saved to database`)
        }
    })
}

const getAll = () => {
    db.run(`SELECT * FROM users`, function(err, res){
        if(err){
            console.log(err)
        } else {console.log(res); return res}
    })
}
const findUser = (username) => {
    db.get(`SELECT login, password FROM users WHERE login = '${username}'`, function(err, result){
        if(err){
            console.error(err)
            console.log('Error')
        } 
        else{
            user = result
        }
    })
}

app.get('/login/:username/:password', (req, res) => {
    const { username, password } = req.params
    db.get(`SELECT * FROM users WHERE login = '${username}'`, function(err, result){
        if(err){
            console.error(err)
            console.log('Error')
        } 
        else{
            if (result.password === password)
                return res.json(result)
        }
    })
})

app.post('/registration', (req, res) => {
    const body = req.body
    createUser(body.login, body.password, body.name, body.surname, body.description)
})

app.get('/user/:username', (req, res) => {
    const { username, password } = req.params
    db.get(`SELECT * FROM users WHERE login = '${username}'`, function(err, result){
        if(err){
            console.error(err)
            console.log('Error')
        } 
        else{
            return res.json(result)
        }
    })
})

app.listen(3300, () => {
    console.log("server start on 3300 port")
})