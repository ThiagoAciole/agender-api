const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do PostgreSQL
const pgConfig = {
  user: "postgres",
  host: "db.vasqvmovdjqzltxwvbrn.supabase.co",
  database: "postgres",
  password: "5mgzSNOqLUkxby5r",
  port: 5432,
};

const client = new Client(pgConfig);
client.connect();

// Middleware para permitir requisições JSON
app.use(bodyParser.json());

// Rota para obter um horário específico
app.get("/horarios/data/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query(
      `
      SELECT id, turno, horario, nome, procedimento, telefone, status, data, valor
      FROM horario
      WHERE id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Horário não encontrado." });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter todos os horários
app.get("/horarios", async (req, res) => {
  try {
    const result = await client.query(
      `
      SELECT id, turno, horario, nome, procedimento, telefone, status, data, valor
      FROM horario
    `
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter todos os horários de uma data específica
app.get("/horarios/:data", async (req, res) => {
  const { data } = req.params;
  try {
    const result = await client.query(
      `
      SELECT id, turno, horario, nome, procedimento, telefone, status, data, valor
      FROM horario
      WHERE data = $1
    `,
      [data]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para adicionar horários para uma data específica
app.post("/horarios/:data", async (req, res) => {
  const { data } = req.params;
  const { horarios } = req.body;

  try {
    // Verifica se a data já existe ou cria uma nova
    const result = await client.query(
      "INSERT INTO data (data) VALUES ($1) ON CONFLICT (data) DO NOTHING RETURNING id",
      [data]
    );

    const dataId =
      result.rows[0]?.id ||
      (await client.query("SELECT id FROM data WHERE data = $1", [data]))
        .rows[0].id;

    // Adiciona os horários associados à data, incluindo a tabela "valor"
    const horarioValues = horarios.map(({ turno, horario, valor }) => [
      dataId,
      turno,
      horario,
      null,
      null,
      null,
      "Livre",
      valor, // Adicionando o valor na inserção
    ]);
    const horarioResult = await client.query(
      "INSERT INTO horario (data_id, turno, horario, nome, procedimento, telefone, status, valor) VALUES $1",
      [horarioValues]
    );

    res.json(horarioResult.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para adicionar um horário
app.post("/horarios", async (req, res) => {
  const { data, turno, horario, nome, procedimento, telefone, status, valor } =
    req.body;

  try {
    // Tenta inserir a data ou obtê-la se já existir
    const result = await client.query(
      "INSERT INTO data (data) VALUES ($1) ON CONFLICT (data) DO NOTHING RETURNING id",
      [data]
    );

    const dataId =
      result.rows[0]?.id ||
      (await client.query("SELECT id FROM data WHERE data = $1", [data]))
        .rows[0].id;

    const horarioResult = await client.query(
      "INSERT INTO horario (data, turno, horario, nome, procedimento, telefone, status, valor) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [data, turno, horario, nome, procedimento, telefone, status, valor]
    );

    res.json(horarioResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar um horário específico
app.put("/horario/:id", async (req, res) => {
  const { id } = req.params;
  const { turno, horario, nome, procedimento, telefone, status, valor } =
    req.body;

  try {
    const result = await client.query(
      "UPDATE horario SET turno = $1, horario = $2, nome = $3, procedimento = $4, telefone = $5, status = $6, valor = $7 WHERE id = $8 RETURNING *",
      [turno, horario, nome, procedimento, telefone, status, valor, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para obter um horário específico
app.get("/horario/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      "SELECT * FROM horario WHERE id = $1",
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para atualizar todos os horários de uma data específica
app.put("/horarios/:data", async (req, res) => {
  const { data } = req.params;
  const { turno, horario, nome, procedimento, telefone, status, valor } =
    req.body;

  try {
    // Atualiza os horários associados à data
    const result = await client.query(
      `
      UPDATE horario SET turno = $1, horario = $2, nome = $3, procedimento = $4, telefone = $5, status = $6, valor = $7
      FROM data d WHERE horario.data_id = d.id AND d.data = $8
      RETURNING horario.*;
    `,
      [turno, horario, nome, procedimento, telefone, status, valor, data]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para excluir todos os horários de uma data específica
app.delete("/horarios/:data", async (req, res) => {
  const { data } = req.params;

  try {
    // Exclui a data e todos os horários associados
    await client.query("DELETE FROM data WHERE data = $1", [data]);

    res.json({ message: "Horários removidos com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
