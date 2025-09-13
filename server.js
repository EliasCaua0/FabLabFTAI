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

// URL da API Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// 🔹 Verifica se a API Key está disponível
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.log('⚠️  GEMINI_API_KEY não encontrada. Usando modo simulador.');
} else {
  console.log('✅ GEMINI_API_KEY configurada');
}

// 🔹 Rota principal - serve o HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔹 Rota para perguntas - Gemini API
app.post("/api/query", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Faltou a pergunta" });
  }

  // Se não tiver API key, usa respostas simuladas
  if (!GEMINI_API_KEY) {
    console.log('📤 Modo simulado:', query);
    
    const respostas = [
      "Como mestre das fortalezas mágicas, estou aqui para ajudar!",
      "A magia dessas terras responde à sua curiosidade. O que mais deseja saber?",
      "Sua jornada é importante para o reino. Conte-me seus planos.",
      "As fortalezas mágicas aguardam seu comando. Qual estratégia vamos traçar?",
      "A sabedoria ancestral flui através de mim. Faça sua pergunta, aventureiro."
    ];
    
    const resposta = respostas[Math.floor(Math.random() * respostas.length)];
    
    return res.json({ 
      answer: resposta,
      note: "Modo simulado - API não configurada"
    });
  }

  try {
    console.log("📤 Enviando para Gemini:", query);
    
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Como assistente especializado em Fortalezas Mágicas, responda de forma helpful e mágica em português: ${query}`
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
    console.log("📩 Resposta recebida do Gemini");

    // Extrai a resposta corretamente
    let textoResposta = "❌ Não foi possível obter resposta";
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      textoResposta = data.candidates[0].content.parts[0].text;
    }

    res.json({ answer: textoResposta });
    
  } catch (err) {
    console.error("❌ Erro no servidor:", err.message);
    
    // Fallback para resposta simulada
    const respostas = [
      "No momento estou com dificuldades técnicas, mas logo estarei 100%!",
      "Sua jornada é importante para o reino mágico!",
      "As fortalezas aguardam seu comando, grande aventureiro!",
      "Como mestre das fortalezas mágicas, estou aqui para ajudar!"
    ];
    
    const resposta = respostas[Math.floor(Math.random() * respostas.length)];
    
    res.json({ 
      answer: resposta,
      error: err.message 
    });
  }
});

// 🔹 Rota de saúde para teste
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Servidor funcionando",
    gemini_configured: !!GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// 🔹 Rota de informações da API
app.get("/api/info", (req, res) => {
  res.json({
    provider: "Google Gemini",
    model: "gemini-2.0-flash",
    status: GEMINI_API_KEY ? "active" : "simulator",
    api_version: "v1beta"
  });
});

// 🔹 Rota de fallback para qualquer outra requisição
app.get("*", (req, res) => {
  res.redirect("/");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`🔑 Gemini API: ${GEMINI_API_KEY ? 'Configurada' : 'Modo Simulador'}`);
  console.log(`🤖 Modelo: gemini-2.0-flash`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
