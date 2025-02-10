import { addMessage } from './messages.js';

// Función para manejar la entrada de expresiones matemáticas
export async function processMathExpression(expression) {
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

// Mostrar símbolos matemáticos para la entrada
const mathSymbolsButton = document.getElementById('math-symbols-button');
const mathSymbolsContainer = document.getElementById('math-symbols-container');
const messageInput = document.getElementById('message-input');

mathSymbolsButton.addEventListener('click', () => {
  mathSymbolsContainer.style.display = mathSymbolsContainer.style.display === 'none' ? 'block' : 'none';
});

mathSymbolsContainer.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const symbol = e.target.textContent;
    insertAtCursor(messageInput, symbol);
  }
});

// Función para insertar texto en la posición del cursor
function insertAtCursor(input, text) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  input.value = input.value.substring(0, start) + text + input.value.substring(end);
  input.selectionStart = input.selectionEnd = start + text.length;
  input.focus();
}
