// Estructura de datos de mensajes
let messages = [
  {
    id: 1,
    content: "¡Hola! ¿En qué puedo ayudarte hoy?",
    isBot: true
  }
];

// Elementos del DOM
const messagesContainer = document.querySelector('.messages-content');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const scrollToBottomButton = document.getElementById('scroll-to-bottom-button');

// Iconos como cadenas SVG
const botIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="message-icon">
  <path d="M12 8V4H8"></path>
  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
  <path d="M2 14h2"></path>
  <path d="M20 14h2"></path>
  <path d="M15 13v2"></path>
  <path d="M9 13v2"></path>
</svg>`;

const userIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="message-icon">
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
  <circle cx="12" cy="7" r="4"></circle>
</svg>`;

// Función para crear un elemento de mensaje
function createMessageElement(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.isBot ? 'bot' : 'user'}`;

  const iconDiv = message.isBot ? botIconSvg : userIconSvg;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content markdown-content';
  
  contentDiv.innerHTML = message.isBot ? marked.parse(message.content) : message.content;

  if (message.isBot) {
    messageDiv.innerHTML = iconDiv;
    messageDiv.appendChild(contentDiv);
  } else {
    messageDiv.appendChild(contentDiv);
    messageDiv.innerHTML += iconDiv;
  }

  return messageDiv;
}

// Función para renderizar todos los mensajes
function renderMessages() {
  messagesContainer.innerHTML = '';
  messages.forEach(message => {
    messagesContainer.appendChild(createMessageElement(message));
  });
  scrollToBottom();
}

// Función para agregar un nuevo mensaje
function addMessage(content, isBot) {
  const newMessage = {
    id: messages.length + 1,
    content,
    isBot
  };
  messages.push(newMessage);
  renderMessages();
}

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

// Función para manejar la entrada de expresiones matemáticas
async function processMathExpression(expression) {
  try {
    const response = await fetch('/process_math', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expression })
    });

    if (!response.ok) {
      throw new Error(`¡Error HTTP! estado: ${response.status}`);
    }

    const data = await response.json();
    addMessage(`Resultado: ${data.result}`, true);
    addMessage(`Paso a paso:\n${data.steps}`, true); // Renderizar paso a paso en Markdown
  } catch (error) {
    console.error('Error al procesar la expresión matemática:', error);
    addMessage('Error al procesar la expresión matemática.', true);
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

// Mostrar símbolos matemáticos para la entrada
const mathSymbolsButton = document.getElementById('math-symbols-button');
const mathSymbolsContainer = document.getElementById('math-symbols-container');

mathSymbolsButton.addEventListener('click', () => {
  mathSymbolsContainer.style.display = mathSymbolsContainer.style.display === 'none' ? 'block' : 'none';
});

mathSymbolsContainer.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    messageInput.value += e.target.textContent;
  }
});

// Manejar el envío del formulario
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  
  if (message) {
    // Agregar mensaje del usuario
    addMessage(message, false);
    
    // Verificar si el mensaje es una expresión matemática
    if (/^[0-9+\-*/^()=√∫∑π≤≥≠ ]+$/.test(message)) {
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
    
    // Limpiar entrada
    messageInput.value = '';
  }
});

// Función para desplazarse automáticamente hacia abajo
function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Mostrar u ocultar el botón "Scroll to Bottom"
messagesContainer.addEventListener('scroll', () => {
  if (messagesContainer.scrollTop < messagesContainer.scrollHeight - messagesContainer.clientHeight - 100) {
    scrollToBottomButton.style.display = 'flex';
  } else {
    scrollToBottomButton.style.display = 'none';
  }
});

// Manejar el clic en el botón "Scroll to Bottom"
scrollToBottomButton.addEventListener('click', scrollToBottom);

// Renderizado inicial
renderMessages();

// Desplazarse automáticamente hacia abajo cuando se agrega un nuevo mensaje
const observer = new MutationObserver(scrollToBottom);
observer.observe(messagesContainer, { childList: true });