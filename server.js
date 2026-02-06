const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser')

const app = express();
const port = 3000;
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}
// Middleware

app.use(bodyParser.json())
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'garage_db'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL Database');
});
const verifyTokenAndRole = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).send('Access Denied: No Token Provided!');
    }
    const roles = req.requiredroles || ["admin", "client"];
    try {
      const decoded = jwt.verify(token, 'OEKFNEZKkF78EZFH93023NOEAF');
      req.user = decoded;
      const sql = 'SELECT role FROM users WHERE id = ?';
      db.query(sql, [req.user.id], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Server error');
        }

        if (results.length === 0) {
          return res.status(404).send('User not found');
        }

        const userRole = results[0].role;
        if (!roles.includes(userRole)) {
        return res.status(403).send('Access Denied: You do not have the required role!');
      }

      next();
    })
    } catch (error) {
      res.status(400).send('Invalid Token');
    }
  };
// Routes
app.post('/api/signup', (req, res) => {
  const { lastname, firstname, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  console.log(hashedPassword)
  const sql = 'INSERT INTO users (lastname, firstname, email, password) VALUES (?, ?, ?, ?)';
  db.query(sql, [lastname, firstname, email, hashedPassword], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }
    res.status(201).send('User registered');
  });
});

app.post('/api/signin', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }

    if (results.length === 0) {
      res.status(404).send('User not found');
      return;
    }

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      res.status(401).send('Invalid password');
      return;
    }

    const token = jwt.sign({ id: user.id }, 'OEKFNEZKkF78EZFH93023NOEAF', { expiresIn: 86400 });
    res.cookie('token', token, { httpOnly: true, maxAge: 86400000 }); // 86400000 ms = 24 heures

    res.status(200).send({ auth: true, role: user.role});
  });
});

app.get('/api/clients/count', (req,_res, next) => {
  req.requiredroles = ["admin"]
  next()
},  verifyTokenAndRole, (req, res) => {
  const sql = 'SELECT COUNT(*) AS count FROM users WHERE role = ?';
  db.query(sql, ['client'], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }

    res.status(200).json(results[0]);
  });
});

// Route pour récupérer tous les clients
app.get('/api/clients', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const sql = 'SELECT id, firstname, lastname, email FROM users WHERE role = ?';
  db.query(sql, ['client'], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

// Route pour récupérer tous les véhicules
app.get('/api/vehicles', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const sql = `
    SELECT 
      v.id,
      v.license_plate,
      v.brand,
      v.model,
      v.year,
      v.client_id,
      CONCAT(u.firstname, ' ', u.lastname) AS client_name,
      u.email AS client_email
    FROM vehicles v
    LEFT JOIN users u ON v.client_id = u.id
    ORDER BY v.created_at DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }
    res.status(200).json(results);
  });
});

// Route pour ajouter un nouveau véhicule
app.post('/api/vehicles', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const { license_plate, brand, model, year, client_id } = req.body;
  
  // Validation des données
  if (!license_plate || !brand || !model || !year) {
    return res.status(400).send('Tous les champs obligatoires doivent être remplis');
  }
  
  const sql = 'INSERT INTO vehicles (license_plate, brand, model, year, client_id) VALUES (?, ?, ?, ?, ?)';
  const clientIdValue = client_id && client_id !== '' ? client_id : null;
  
  db.query(sql, [license_plate, brand, model, year, clientIdValue], (err, result) => {
    if (err) {
      console.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send('Cette plaque d\'immatriculation existe déjà');
      }
      return res.status(500).send('Server error');
    }
    res.status(201).json({ 
      message: 'Véhicule ajouté avec succès',
      id: result.insertId 
    });
  });
});

// Route pour modifier un véhicule existant
app.put('/api/vehicles/:id', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const { id } = req.params;
  const { license_plate, brand, model, year, client_id } = req.body;
  
  // Validation des données
  if (!license_plate || !brand || !model || !year) {
    return res.status(400).send('Tous les champs obligatoires doivent être remplis');
  }
  
  const sql = 'UPDATE vehicles SET license_plate = ?, brand = ?, model = ?, year = ?, client_id = ? WHERE id = ?';
  const clientIdValue = client_id && client_id !== '' ? client_id : null;
  
  db.query(sql, [license_plate, brand, model, year, clientIdValue, id], (err, result) => {
    if (err) {
      console.error(err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).send('Cette plaque d\'immatriculation existe déjà');
      }
      return res.status(500).send('Server error');
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Véhicule non trouvé');
    }
    
    res.status(200).json({ 
      message: 'Véhicule modifié avec succès'
    });
  });
});

// Route pour supprimer un véhicule
app.delete('/api/vehicles/:id', (req, _res, next) => {
  req.requiredroles = ["admin"];
  next();
}, verifyTokenAndRole, (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM vehicles WHERE id = ?';
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Véhicule non trouvé');
    }
    
    res.status(200).json({ 
      message: 'Véhicule supprimé avec succès'
    });
  });
});

app.use(express.static(path.join(__dirname, "./client/dist")))
app.get("*", (_, res) => {
    res.sendFile(
      path.join(__dirname, "./client/dist/index.html")
    )
})
// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
