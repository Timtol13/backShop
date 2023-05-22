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

app.get('/login/:login/:password', (req, res) => {
    const { login, password } = req.params
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(`SELECT * FROM users WHERE email = '${login}'`, function(err, result){
            if(err){
                console.error(err)
                console.log('Error')
            } 
            else{
                console.log(result)
                if (result.password === password)
                    return res.json(result)
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
                return res.json(result)
            }
        })
    })
})

app.post('/sendPhoto', upload.single('files'),  async function (req, res) {
    let dir = `./images/${req.body.email}/`
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    let oldPath = `./images/${req.file.originalname}`
    let newPath = `./images/${req.body.email}/${req.file.originalname}`
    fs.rename(oldPath, newPath, function (err) {
        if (err) throw err
        console.log('Successfully Moved File')
    })

    let data = {
        email: req.body.email,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        dateCreate: Date('now')
    }

    let sql ='INSERT INTO userPhoto (email, filename, mimetype, size, dateCreate) VALUES (?,?,?,?,?)'
    let params = [data.email, data.filename, data.mimetype, data.size, Date('now')]
    connection.connect((err) => {
        if(err){
            console.log(err.message)
        }
        console.log('Connected to MySQL')
        connection.query(sql, params, function (err, result) {
            if (err){
                res.status(400).json({"error": err.message})
                return;
            }
            else{
                res.json(result)
            }
        });   
    })
    res.status(200).json(req.file)
})

app.get('/getPhoto/:email', (req, res) => {
    const {email} = req.params
    connection.connect((err) => {
        if(err){
            console.log(err)
        }
        connection.query('SELECT * FROM userPhoto WHERE email = ?', [email], (err, row) => {
            if (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            } else if (!row) {
                res.status(404).send('Photo not found');
            } else {
                const filename = row.filename;
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
    connection.query('INSERT INTO feedback (name, email, message, star) VALUES (?, ?, ?, ?)', [name, email, message, star], (err, result) => {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        else{
            res.json(result)
        }
    })
})

app.listen(3300, () => {
    console.log("server start on 3300 port")
})