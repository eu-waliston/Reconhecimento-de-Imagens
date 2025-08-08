// index.js
import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import tf from "@tensorflow/tfjs-node";
import cocoSsd from "@tensorflow-models/coco-ssd";

const app = express();
const PORT = process.env.PORT || 1337;

// Configuração do multer (upload)
const upload = multer({ dest: "uploads/" });

// Carregar o modelo COCO-SSD antes de iniciar o servidor
let model;
(async () => {
  console.log("Carregando modelo COCO-SSD...");
  model = await cocoSsd.load();
  console.log("Modelo carregado!");

  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
})();

// Função para processar a imagem e detectar objetos
async function detectarObjetos(filePath) {
  if (!model) throw new Error("Modelo ainda não carregado.");
  const imageBuffer = fs.readFileSync(filePath);
  const tfImage = tf.node.decodeImage(imageBuffer);
  const predictions = await model.detect(tfImage);
  tfImage.dispose();
  return predictions.map(pred => ({
    nome: pred.class,
    confianca: Number(pred.score.toFixed(2))
  }));
}

// Endpoint 1: Upload de arquivo
app.post("/analisar/upload", upload.single("imagem"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });
    const resultados = await detectarObjetos(req.file.path);
    fs.unlinkSync(req.file.path);
    res.json({ objetos: resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message || "Erro ao processar a imagem." });
  }
});

// Endpoint 2: Imagem via URL
app.post("/analisar/url", express.json(), async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ erro: "URL da imagem não fornecida." });

    const response = await fetch(url);
    if (!response.ok) return res.status(400).json({ erro: "Não foi possível baixar a imagem." });

    const tempPath = path.join("uploads", `temp_${Date.now()}.jpg`);
    const buffer = await response.buffer();
    fs.writeFileSync(tempPath, buffer);

    const resultados = await detectarObjetos(tempPath);
    fs.unlinkSync(tempPath);

    res.json({ objetos: resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: err.message || "Erro ao processar a imagem." });
  }
});
