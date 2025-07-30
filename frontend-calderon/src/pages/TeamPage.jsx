// src/pages/TeamPage.jsx
import { useState } from "react";
import "./PageStyles.css";

const API_URL = "http://127.0.0.1:8000/chat/chatbot";

export default function TeamPage() {
  const [modelo, setModelo] = useState("openai");
  const [mensaje, setMensaje] = useState("");
  const [conversacion, setConversacion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enviarPregunta = async () => {
    if (!mensaje.trim()) return;

    const nuevaEntrada = { remitente: "usuario", texto: mensaje };
    setConversacion((prev) => [...prev, nuevaEntrada]);
    setMensaje("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: mensaje, modelo }),
      });

      const data = await res.json();
      const respuesta = data.respuesta || "No hubo respuesta.";

      setConversacion((prev) => [
        ...prev,
        { remitente: "bot", texto: respuesta },
      ]);
    } catch (err) {
      setError("❌ Error al conectar con el bot.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarPregunta();
    }
  };

  return (
    <div className="page">
      <h2>🤖 ChatBot de Calderón</h2>

      <div className="chat-config">
        <label>Selecciona modelo:</label>
        <select value={modelo} onChange={(e) => setModelo(e.target.value)}>
          <option value="openai">🔵 OpenAI</option>
          <option value="gemini">🟢 Gemini</option>
          <option value="zephyr">🟠 Zephyr</option>
        </select>
      </div>

      <div className="chat-box">
        {conversacion.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg ${msg.remitente === "usuario" ? "user" : "bot"}`}
          >
            <strong>{msg.remitente === "usuario" ? "🧑 Tú:" : "🤖 Bot:"}</strong>
            <p>{msg.texto}</p>
          </div>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      <textarea
        placeholder="Escribe tu pregunta sobre Calderón y el agua..."
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />

      <button onClick={enviarPregunta} disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}
