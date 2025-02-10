// Estructura de datos de mensajes
export let messages = [
  {
    id: 1,
    content: "¡Hola! ¿En qué puedo ayudarte hoy?",
    isBot: true
  }
];

// Elementos del DOM relacionados con los mensajes
const messagesContainer = document.querySelector('.messages-content');
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
export function createMessageElement(message) {
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
export function renderMessages() {
  messagesContainer.innerHTML = '';
  messages.forEach(message => {
    messagesContainer.appendChild(createMessageElement(message));
  });
  scrollToBottom();
}

// Función para agregar un nuevo mensaje
export function addMessage(content, isBot) {
  const newMessage = {
    id: messages.length + 1,
    content,
    isBot
  };
  messages.push(newMessage);
  renderMessages();
}

// Función para desplazarse automáticamente hacia abajo
export function scrollToBottom() {
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
