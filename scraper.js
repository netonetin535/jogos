import puppeteer from "puppeteer";
import axios from "axios";

const FIREBASE_URL = "https://api-futebol-f16a5-default-rtdb.firebaseio.com";

(async () => {
  console.log("🚀 Iniciando navegador...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  console.log("🟢 Acessando https://www.sofascore.com/pt...");
  await page.goto("https://www.sofascore.com/pt", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  console.log("⏳ Aguardando carregar blocos de jogos...");
  await page.waitForSelector('div[class*="klGMtt"]');

  console.log("📦 Extraindo jogos...");
  const jogos = await page.evaluate(() => {
    const resultado = [];
    const blocos = document.querySelectorAll('div[class*="klGMtt"]');

    blocos.forEach((el) => {
      try {
        const nomeTimes = el.querySelectorAll("bdi.Text.ezSveL");
        const imagens = el.querySelectorAll("img.Img.jbiuyT");
        const horario = el.querySelector("bdi.Text.kcRyBI")?.innerText?.trim();

        if (
          nomeTimes.length === 2 &&
          imagens.length === 2 &&
          horario
        ) {
          resultado.push({
            partida: `${nomeTimes[0].innerText} x ${nomeTimes[1].innerText}`,
            horario,
            escudo_a: imagens[0].src,
            escudo_b: imagens[1].src,
          });
        }
      } catch (_) {}
    });

    return resultado;
  });

  console.log(`✅ ${jogos.length} jogo(s) extraído(s). Enviando para Firebase...`);

  try {
    await axios.put(`${FIREBASE_URL}/jogos.json`, jogos, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("✅ JSON enviado com sucesso para Firebase.");
  } catch (err) {
    console.error("❌ Erro ao enviar para Firebase:", err.response?.data || err.message);
  }

  await browser.close();
  console.log("🧹 Navegador encerrado.");
})();
