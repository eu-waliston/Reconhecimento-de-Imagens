# microserviço de reconhecimento de imagens simples em Node.js

A ideia é: você envia uma imagem (upload ou URL), e o serviço responde com os objetos detectados.

Usando @tensorflow/tfjs-node + @tensorflow-models/coco-ssd, para detectar coisas comuns (pessoas, carros, cachorros, celulares, etc.).


## 1 🛠 Como o serviço funciona
Endpoint POST /analisar

Recebe uma imagem via upload ou URL.

Carrega o modelo COCO-SSD.

Processa a imagem.

Retorna uma lista de objetos detectados com nome e probabilidad

## 2 Resposta JSON exemplo:

```
{
  "objetos": [
    { "nome": "person", "confianca": 0.98 },
    { "nome": "laptop", "confianca": 0.85 }
  ]
}

```
## 3 📦 Stack sugerida

Node.js + Express → Servidor HTTP.

Multer → Upload de imagens.

@tensorflow/tfjs-node + @tensorflow-models/coco-ssd → Reconhecimento.

(Opcional) Docker → Facilitar deploy.

## 4 🚀 Estrutura inicial do projeto

microservico-reconhecimento/
│-- package.json
│-- index.js
│-- uploads/      # Pasta temporária para imagens enviadas
