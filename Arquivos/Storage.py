from flask import Flask, request, jsonify
import os

app = Flask(__name__)
UPLOAD_FOLDER = "documentos_recebidos"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "Nenhum arquivo encontrado"}), 400

    file = request.files["file"]
    user_id = request.form.get("user_id", "desconhecido")
    
    # Criar pasta específica para o usuário
    user_folder = os.path.join(UPLOAD_FOLDER, user_id)
    os.makedirs(user_folder, exist_ok=True)

    file_path = os.path.join(user_folder, file.filename)
    file.save(file_path)

    return jsonify({"message": "Arquivo salvo com sucesso!", "path": file_path}), 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)
