import os
from groq import Groq
from flask import Flask, request, jsonify, send_from_directory, render_template, send_file, url_for
from flask_cors import CORS
import sympy as sp
import re
from fpdf import FPDF
import pandas as pd
from PIL import Image
import io
import matplotlib.pyplot as plt
import base64
import plotly.graph_objects as go
import plotly.io as pio

# Establecer la clave API directamente
os.environ["GROQ_API_KEY"] = "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"

# Asegurarse de que la clave API esté establecida
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    raise ValueError("La variable de entorno GROQ_API_KEY no está establecida.")

# Configurar cliente Groq
client = Groq(api_key=api_key)

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Habilitar CORS para todas las rutas

# Función para procesar solicitudes y generar respuestas
def procesar_solicitud(mensaje, history):
    # Detectar el idioma según la entrada del usuario
    if mensaje.isascii():
        language_instruction = "Please respond in English."
    else:
        language_instruction = "Por favor, responde en español."

    # Crear solicitud de completación de chat con instrucción de idioma
    messages = [{"role": "system", "content": language_instruction}]
    for msg in history:
        role = "user" if not msg["isBot"] else "assistant"
        messages.append({"role": role, "content": msg["content"]})
    messages.append({"role": "user", "content": mensaje})

    # Detectar solicitudes de PDF y generar contenido correspondiente
    if "dame un pdf de" in mensaje.lower():
        messages.append({"role": "system", "content": "Genera el contenido para un PDF basado en la siguiente solicitud."})

    chat_completion = client.chat.completions.create(
        messages=messages,
        model="deepseek-r1-distill-llama-70b",
        stream=False,
    )

    # Devolver la respuesta generada
    response = chat_completion.choices[0].message.content

    # Ocultar contenido dentro de etiquetas <think> a menos que se solicite explícitamente
    if "<think>" in mensaje:
        return response
    else:
        response = re.sub(r'<think>.*?</think>', '', response, flags=re.DOTALL)

    return response

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/process_message', methods=['POST'])
def process_message():
    try:
        data = request.json
        user_message = data['message']
        history = data['history']
        print(f"Mensaje recibido: {user_message}")  # Registrar el mensaje recibido
        bot_response = procesar_solicitud(user_message, history)
        print(f"Respuesta del bot: {bot_response}")  # Registrar la respuesta del bot
        return jsonify({'response': bot_response})
    except Exception as e:
        print(f"Error al procesar el mensaje: {e}")
        return jsonify({'response': 'Error al procesar el mensaje.'}), 500

@app.route('/process_math', methods=['POST'])
def process_math():
    try:
        data = request.json
        expression = data['expression']
        expr = sp.sympify(expression)
        result = expr.evalf()
        
        # Generar solución paso a paso usando LLM
        steps = generate_step_by_step_solution(expression)
        
        return jsonify({'result': str(result), 'steps': steps})
    except Exception as e:
        print(f"Error al procesar la expresión matemática: {e}")
        return jsonify({'result': 'Error al procesar la expresión matemática.', 'steps': ''}), 500

# Eliminar la ruta /generate_pdf
# @app.route('/generate_pdf', methods=['POST'])
# def generate_pdf():
#     try:
#         data = request.json
#         content = data['content']
        
#         pdf = FPDF()
#         pdf.add_page()
#         pdf.set_font("Arial", size=12)
#         pdf.multi_cell(0, 10, content)
        
#         pdf_filename = "document.pdf"
#         pdf.output(pdf_filename)
        
#         return jsonify({'content': content, 'download_url': f'/static/{pdf_filename}'})
#     except Exception as e:
#         print(f"Error al generar el PDF: {e}")
#         return jsonify({'response': 'Error al generar el PDF.'}), 500

@app.route('/generate_excel', methods=['POST'])
def generate_excel():
    try:
        data = request.json
        content = data['content']
        
        # Convert content to DataFrame (assuming content is a list of dictionaries)
        df = pd.DataFrame(content)
        
        excel_filename = "document.xlsx"
        df.to_excel(excel_filename, index=False)
        
        return send_file(excel_filename, as_attachment=True)
    except Exception as e:
        print(f"Error al generar el Excel: {e}")
        return jsonify({'response': 'Error al generar el Excel.'}), 500

@app.route('/process_stat', methods=['POST'])
def process_stat():
    try:
        data = request.json
        stat_type = data['stat_type']
        values = data['values']
        
        # Generar gráfico según el tipo de estadística
        fig, ax = plt.subplots()
        if stat_type == 'histogram':
            ax.hist(values, bins=10, edgecolor='black')
            ax.set_title('Histograma')
        elif stat_type == 'boxplot':
            ax.boxplot(values)
            ax.set_title('Diagrama de Caja')
        elif stat_type == 'scatter':
            x_values = values['x']
            y_values = values['y']
            ax.scatter(x_values, y_values)
            ax.set_title('Diagrama de Dispersión')
        else:
            return jsonify({'response': 'Tipo de gráfico no soportado.'}), 400
        
        # Guardar gráfico en un buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        
        return jsonify({'image': img_base64})
    except Exception as e:
        print(f"Error al generar el gráfico: {e}")
        return jsonify({'response': 'Error al generar el gráfico.'}), 500

@app.route('/process_stat_analysis', methods=['POST'])
def process_stat_analysis():
    try:
        data = request.json
        opinions = data['opinions']
        
        # Calcular frecuencias absolutas y relativas
        total = sum(opinions.values())
        abs_freq = opinions
        rel_freq = {k: v / total for k, v in opinions.items()}
        
        # Calcular la moda
        mode = max(opinions, key=opinions.get)
        
        return jsonify({
            'abs_freq': abs_freq,
            'rel_freq': rel_freq,
            'mode': mode
        })
    except Exception as e:
        print(f"Error al procesar el análisis estadístico: {e}")
        return jsonify({'response': 'Error al procesar el análisis estadístico.'}), 500

@app.route('/generate_graph', methods=['POST'])
def generate_graph():
    try:
        data = request.json
        graph_type = data['graph_type']
        x_values = data['x_values']
        y_values = data['y_values']
        title = data['title']
        x_label = data['x_label']
        y_label = data['y_label']
        
        # Generar gráfico según el tipo de gráfico
        if graph_type == 'bar':
            fig = go.Figure(data=[go.Bar(x=x_values, y=y_values)])
        elif graph_type == 'line':
            fig = go.Figure(data=[go.Scatter(x=x_values, y=y_values, mode='lines')])
        elif graph_type == 'scatter':
            fig = go.Figure(data=[go.Scatter(x=x_values, y=y_values, mode='markers')])
        else:
            return jsonify({'response': 'Tipo de gráfico no soportado.'}), 400
        
        fig.update_layout(title=title, xaxis_title=x_label, yaxis_title=y_label)
        
        # Guardar gráfico como archivo HTML
        graph_filename = f"graph_{graph_type}_{x_values[0]}_{y_values[0]}.html"
        graph_filepath = os.path.join(app.static_folder, graph_filename)
        pio.write_html(fig, file=graph_filepath, full_html=False)
        
        return jsonify({'graph_url': url_for('static', filename=graph_filename)})
    except Exception as e:
        print(f"Error al generar el gráfico: {e}")
        return jsonify({'response': 'Error al generar el gráfico.'}), 500

def generate_step_by_step_solution(expression):
    # Usar el LLM para generar una solución detallada paso a paso
    messages = [
        {"role": "system", "content": "Por favor, proporciona una solución detallada paso a paso para la siguiente expresión matemática."},
        {"role": "user", "content": expression}
    ]
    
    chat_completion = client.chat.completions.create(
        messages=messages,
        model="deepseek-r1-distill-llama-70b",
        stream=False,
    )
    
    return chat_completion.choices[0].message.content

# Ejemplo de uso
if __name__ == "__main__":
    app.run(debug=True)