import fetch from "node-fetch";

async function testarImagem() {
  const urlImagem = "https://blog-prd.portalpos.com.br/wp-content/uploads/2023/07/pessoa-autentica.jpg"; // cachorro

  const response = await fetch("http://localhost:1337/analisar/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: urlImagem }),
  });

  const data = await response.json();
  console.log("Resposta do microserviço:", data);
}

testarImagem().catch(console.error);
