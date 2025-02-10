// Importar módulos
import { messages, addMessage, renderMessages, scrollToBottom } from './messages.js';
import { processMathExpression } from './math.js';

// Elementos del DOM
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');

// Función para detectar el idioma y obtener la respuesta del backend LLM
async function fetchBotResponse(message) {
  try {
    const response = await fetch('/process_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, history: messages })
    });

    if (!response.ok) {
      throw new Error(`¡Error HTTP! estado: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error al obtener la respuesta del bot:', error);
    return "Error al obtener la respuesta del bot.";
  }
}

// Función para solicitar y descargar un documento Excel
async function requestExcel(content) {
  try {
    const response = await fetch('/generate_excel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`¡Error HTTP! estado: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Error al solicitar el Excel:', error);
  }
}

// Función para manejar la entrada de análisis estadístico
async function processStatAnalysis(opinions) {
  try {
    const response = await fetch('/process_stat_analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ opinions })
    });

    if (!response.ok) {
      throw new Error(`¡Error HTTP! estado: ${response.status}`);
    }

    const data = await response.json();
    const absFreq = data.abs_freq;
    const relFreq = data.rel_freq;
    const mode = data.mode;

    let resultMessage = `Frecuencia Absoluta: ${JSON.stringify(absFreq)}\n`;
    resultMessage += `Frecuencia Relativa: ${JSON.stringify(relFreq)}\n`;
    resultMessage += `Moda: ${mode}\n`;
    addMessage(resultMessage, true);
  } catch (error) {
    console.error('Error al procesar el análisis estadístico:', error);
    addMessage('Error al procesar el análisis estadístico.', true);
  }
}

// Manejar el envío del formulario
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  
  if (message) {
    // Limpiar entrada inmediatamente
    messageInput.value = '';
    
    // Agregar mensaje del usuario
    addMessage(message, false);
    
    // Verificar si el mensaje es una solicitud de análisis estadístico
    if (message.toLowerCase().includes('opinión sobre un nuevo producto')) {
      const opinions = {
        "excelente": 250,
        "bueno": 150,
        "regular": 75,
        "malo": 25
      };
      await processStatAnalysis(opinions);
    } else if (/^[0-9+\-*/^()=√∫∑π≤≥≠ ]+$/.test(message)) {
      await processMathExpression(message);
    } else {
      // Obtener respuesta del bot
      const botResponse = await fetchBotResponse(message);
      addMessage(botResponse, true);
      
      // Verificar si el mensaje solicita un PDF
      if (message.toLowerCase().includes('dame un pdf de')) {
        // No agregar el mensaje dos veces
        // addMessage(botResponse, true); // Mostrar el contenido generado para el PDF
      } else if (message.toLowerCase().includes('excel')) {
        await requestExcel(botResponse);
      }
    }
  }
});
