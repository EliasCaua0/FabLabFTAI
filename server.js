// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

// Carrega variáveis de ambiente
dotenv.config();

// Cria app Express
const app = express();
app.use(cors());
app.use(express.json());

// Ajuste para __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos
app.use(express.static(__dirname));

// URL base da API Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// 🔹 Rota principal - serve o HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔹 Rota para perguntas - Gemini 2.0 Flash API
app.post("/api/query", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Faltou a pergunta" });
  }

  try {
    console.log("📤 Enviando para Gemini 2.0 Flash:", query);
    
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Como assistente especializado em Fortalezas Mágicas, responda de forma helpful e mágica: ${query}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro da API Gemini:", errorData);
      throw new Error(errorData.error?.message || "Erro na API Gemini");
    }

    const data = await response.json();
    console.log("📩 Resposta do Gemini:", data);

    // Extrai a resposta corretamente
    let textoResposta = "❌ Não foi possível obter resposta";
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      textoResposta = data.candidates[0].content.parts[0].text;
    }

    res.json({ answer: textoResposta });
    
  } catch (err) {
    console.error("❌ Erro no servidor:", err);
    
    // Fallback para resposta simulada
    const respostasFallback = [
      "Como mestre das fortalezas mágicas, estou aqui para ajudar!",
      "A magia dessas terras responde à sua curiosidade.",
      "Sua jornada é importante para o reino mágico.",
      "As fortalezas aguardam seu comando, grande aventureiro!"
    ];
    
    const respostaFallback = respostasFallback[
      Math.floor(Math.random() * respostasFallback.length)
    ];
    
    res.json({ 
      answer: respostaFallback,
      error: err.message 
    });
  }
});

// 🔹 Rota de saúde para teste
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Servidor funcionando com Gemini API",
    model: "gemini-2.0-flash"
  });
});

// 🔹 Rota de informações da API
app.get("/api/info", (req, res) => {
  res.json({
    provider: "Google Gemini",
    model: "gemini-2.0-flash",
    status: "active",
    api_version: "v1beta"
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configurada' : 'NÃO CONFIGURADA'}`);
  console.log(`🤖 Modelo: gemini-2.0-flash`);
  console.log(`🌐 API Version: v1beta`);
});
