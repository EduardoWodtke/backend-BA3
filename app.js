const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt'); // Importe a biblioteca bcrypt
const app = express();
const port = 3000;
const cors = require('cors');

// Habilitando o CORS para todas as origens
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração da conexão com o MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '0604',
});

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL: ' + err.stack);
    return;
  }
  console.log('Conexão bem-sucedida ao MySQL com o ID ' + connection.threadId);

  // Criação do banco de dados
  connection.query('CREATE DATABASE IF NOT EXISTS nodeApi', (error) => {
    if (error) throw error;
    console.log('Banco de dados criado ou já existente.');

    // Use o banco de dados recém-criado ou existente
    connection.query('USE nodeApi', (error) => {
      if (error) throw error;
      console.log('Usando o banco de dados.');
      connection.query(`
        CREATE TABLE IF NOT EXISTS user (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(60) NOT NULL
        )
      `, (error) => {
        if (error) throw error;
        console.log('Tabela "user" criada ou já existente.');
      });
    });
  });
});

// Rota de registro de usuário
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    // Verificar se o usuário já existe no banco de dados
    connection.query('SELECT * FROM user WHERE email = ?', [email], async (error, results) => {
      if (error) {
        res.status(500).json({ error: 'Erro ao verificar o usuário.' });
        throw error;
      }
  
      // Se já houver um usuário com o email fornecido, envie uma resposta informando sobre a existência
      if (results.length > 0) {
        res.status(409).json({ error: 'Usuário já existe.' });
      } else {
        // Se o usuário não existir, criptografe a senha antes de inserir no banco de dados
        const hashedPassword = await bcrypt.hash(password, 10); // Gere um hash da senha
  
        // Insira os dados do novo usuário no banco de dados
        connection.query(
          'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          (insertError, insertResults) => {
            if (insertError) {
              res.status(500).json({ error: 'Erro ao registrar o usuário.' });
              throw insertError;
            }
            res.status(201).json({ message: 'Usuário registrado com sucesso!' });
          }
        );
      }
    });
  });
  

// Rota de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
  
    connection.query(
      'SELECT * FROM user WHERE username = ?',
      [username],
      async (error, results) => {
        if (error) {
          res.status(500).json({ error: 'Erro ao fazer login.' });
          throw error;
        }
  
        if (results.length > 0) {
          const user = results[0];
          const passwordMatch = await bcrypt.compare(password, user.password);
  
          if (passwordMatch) {
            res.status(200).json({ message: 'Login bem-sucedido!' });
          } else {
            res.status(401).json({ error: 'Credenciais inválidas.' });
          }
        } else {
          res.status(404).json({ error: 'Usuário não encontrado.' });
        }
      }
    );
  });
  

// Restante do seu código...

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});