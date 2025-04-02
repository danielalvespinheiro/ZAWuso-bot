from flask import Flask, request
import os

app = Flask(__name__)

UPLOAD_FOLDER = 'Arquivos'  # Pasta onde os arquivos serão salvos
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return {'message': 'Nenhum arquivo enviado'}, 400

    file = request.files['file']
    if file.filename == '':
        return {'message': 'Nome do arquivo inválido'}, 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return {'message': f'Arquivo {file.filename} salvo com sucesso'}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
