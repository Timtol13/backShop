const app = require('express')()
const bodyParser = require('body-parser')
const multer = require('multer')
const fs = require('fs')
const cors = require('cors')
const mysql = require('mysql2');


const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'Tim15105112345',
  database : 'shop'
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = './images';
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(cors({
    origin: 'http://localhost:3000',
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/login/:email/:password', (req, res) => {
    const { email, password } = req.params
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(`SELECT * FROM users WHERE email = '${email}'`, function(err, result){
            if(err){
                console.error(err)
                console.log('Error')
                return res.status(500).send('Uncorrect password!')
            } 
            else{
                if (result.password === password)
                    return res.json(result)
                else  return res.status(500).send('Uncorrect password!')
            }
        })
    })
})

app.post('/registration/', (req, res) => {
    const body = req.body
    connection.connect((err) => {
        if (err) {
          console.error('Error connecting to MySQL database: ', err);
          return;
        }
        console.log('Connected to MySQL database!');
        connection.query(`INSERT INTO users (login, password, name, surname, email) VALUES (?, ?, ?, ?, ?)`, [body.login, body.password, body.name, body.surname, body.email], function(err) {
            if (err) {
            console.error(err);
            console.log('Error saving user to database')
            } else {
                console.log(`User with ID ${this.lastID} saved to database`)
                return res.json({'login':body.login, 'password':body.password, 'name':body.name, 'surname':body.surname, 'email':body.email})
            }
        })
    });
})

app.get('/user/:email', (req, res) => {
    const { email } = req.params
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(`SELECT * FROM users WHERE email = '${email}'`, function(err, result){
            if(err){
                console.error(err)
                console.log('Error')
            } 
            else{
                return res.json(result[0])
            }
        })
    })
})

app.post('/sendPhoto', upload.single('files'), function async (req, res) {
        let dir = `./images/${req.body.email}/`
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    let oldPath = `./images/${req.file.originalname}`
    let newPath = `./images/${req.body.email}/${req.file.originalname}`
    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to move file' });
        }
        console.log('Successfully Moved File');

        let data = {
            email: req.body.email,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            dateCreate: Date('now')
        }

        let sql ='INSERT INTO userPhoto (email, filename, mimetype, size, dateCreate) VALUES (?,?,?,?,?)'
        let params = [data.email, data.filename, data.mimetype, data.size, Date.now()]

        connection.query(sql, params, function (err, result) {
            if (err) {
                console.error(err);
                return res.status(400).json({ error: 'Error saving photo to database' });
            }
            else {
                res.setHeader('Content-Type', 'image/*');
                res.json(result);
            }
        });
    });
});

app.get('/getPhoto/:email', (req, res) => {
    const {email} = req.params
    connection.connect((err) => {
        if(err){
            console.log(err)
        }
        connection.query(`SELECT * FROM userPhoto WHERE email = '${email}'`, (err, row) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
              } else if (!row) {
                res.status(404).send('Photo not found');
              } else {
                console.log(row)
                const filename = row[0].filename;
                const filepath = `images/${email}/` + filename;
                fs.readFile(filepath, (err, data) => {
                  if (err) {
                    console.error(err.message);
                    res.status(500).send('Server Error');
                  } else {
                    res.setHeader('Content-Type', 'image/*');
                    res.send(data);
                  }
                });
              }
        });
    })
})

app.get('/user/:login', (req, res) => {
    const { login } = req.params
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(`SELECT * FROM users WHERE login = '${login}'`, function(err, result){
            if(err){
                console.error(err)
                console.log('Error')
            } 
            else{
                console.log(result)
                return res.json(result)
            }
        })
    })
})
app.post('/sendMessage', (req, res) => {
    const {name, email, message, star} = req.body
    connection.connect((err) => {
        connection.query('INSERT INTO feedback (name, email, message, stars) VALUES (?, ?, ?, ?)', [name, email, message, star], (err, result) => {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            else{
                res.send('Success')
            }
        })
    }) 
})

app.put('/editUser', (req, res) => {
    const { name, surname, email, password, emailNow } = req.body;
    console.log(name, surname, email, password, emailNow)
    const sql = `UPDATE users SET name = '${name}', surname = '${surname}', email = '${email}', password = '${password}' WHERE email = '${emailNow}'`
    connection.connect((err) => {
        connection.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Ошибка при выполнении запроса к базе данных' });
        } else {
            res.json({ message: 'Данные пользователя успешно изменены' });
        }
        });
    }) 
});

 // ________Orders___________

 app.post('/makeOrder', (req, res) => {
    const {title, price, cardNum, cardDate, message, email, login} = req.body
    console.log(title, price, cardNum, cardDate, message, email, login)
    connection.connect((err) => {
        connection.query(`INSERT INTO orders (title, price, cardNum, cardDate, message, email, login) VALUES ('${title}', '${price}', '${cardNum}', '${cardDate}', '${message}', '${email}', '${login}')`, (err, result) => {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            else{
                res.send('Success')
            }
        })
    }) 
 })

 app.get('/getOrders/:email', (req, res) => {
    const { email } = req.params
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(`SELECT * FROM orders WHERE login = '${email}'`, function(err, result){
            if(err){
                console.error(err)
                console.log('Error')
            } 
            else{
                console.log(result)
                return res.json(result)
            }
        })
    })
 })

 // _________________________

 app.get('/fill', (req,res) => {

 })

app.listen(3300, () => {
    console.log("server start on 3300 port")
})