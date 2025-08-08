import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import tf from "@tensorflow/tfjs-node";
import cocoSsd from "@tensorflow-models/coco-ssd";
import cors from "cors";
import { createCanvas, loadImage } from "canvas"; // npm install canvas


const app = express();
const PORT = process.env.PORT || 1337;

app.use(cors()); // Permite requisições de qualquer origem

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

  if (predictions.length === 0) {
    console.log(`⚠️ Nenhum objeto detectado na imagem: ${filePath}`);
  } else {
    console.log(`✅ Objetos detectados na imagem: ${filePath}`);
    predictions.forEach(p => {
      console.log(` - ${p.class} (${(p.score * 100).toFixed(1)}%)`);
    });
  }

  return predictions
    .filter(pred => pred.score >= 0.3) // limite mínimo de confiança
    .map(pred => ({
      nome: pred.class,
      confianca: Number(pred.score.toFixed(2))
    }));
}

// Endpoint 1: Upload de arquivo
app.post("/analisar/upload", upload.single("imagem"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });

    const resultados = await detectarObjetos(req.file.path);
    fs.unlinkSync(req.file.path); // remove arquivo temporário

    if (resultados.length === 0) {
      return res.json({ aviso: "Nenhum objeto reconhecido na imagem.", objetos: [] });
    }

    res.json({ objetos: resultados });
  } catch (err) {
    console.error(`❌ Erro ao processar a imagem: ${err.message}`);
    res.status(500).json({ erro: "Erro ao processar a imagem." });
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

    if (resultados.length === 0) {
      return res.json({ aviso: "Nenhum objeto reconhecido na imagem.", objetos: [] });
    }

    res.json({ objetos: resultados });
  } catch (err) {
    console.error(`❌ Erro ao processar a imagem: ${err.message}`);
    res.status(500).json({ erro: "Erro ao processar a imagem." });
  }
});

app.post("/analisar/upload/draw", upload.single("imagem"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });

    // Ler imagem original do disco
    const img = await loadImage(req.file.path);

    // Detectar objetos
    const imageBuffer = fs.readFileSync(req.file.path);
    const tfImage = tf.node.decodeImage(imageBuffer);
    const predictions = await model.detect(tfImage);
    tfImage.dispose();

    if (predictions.length === 0) {
      console.warn("⚠️ Nenhum objeto detectado na imagem:", req.file.path);
    }

    // Criar canvas com o tamanho da imagem
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext("2d");

    // Desenhar imagem original
    ctx.drawImage(img, 0, 0);

    // Estilo para as caixas
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 2;
    ctx.font = "18px Arial";
    ctx.fillStyle = "#00FF00";

    // Desenhar cada box e texto
    predictions.forEach(pred => {
      const [x, y, width, height] = pred.bbox;
      ctx.strokeRect(x, y, width, height);
      const texto = `${pred.class} (${(pred.score * 100).toFixed(1)}%)`;
      ctx.fillText(texto, x, y > 20 ? y - 5 : y + 20);
    });

    // Remover arquivo temporário
    fs.unlinkSync(req.file.path);

    // Enviar imagem desenhada como jpeg
    res.set("Content-Type", "image/jpeg");
    canvas.createJPEGStream().pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao processar a imagem." });
  }
});
