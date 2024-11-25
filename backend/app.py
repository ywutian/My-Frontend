from flask import Flask, request, jsonify
from flask_cors import CORS
from googletrans import Translator
import traceback

app = Flask(__name__)
CORS(app)

translator = Translator()

@app.route('/translate', methods=['POST', 'OPTIONS'])
def translate():
    # 处理 CORS 预检请求
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
        
    try:
        print("\n=== New Translation Request ===")
        data = request.json
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        text = data.get('text')
        if not text:
            return jsonify({'error': 'No text provided'}), 400

        print(f"Translating text: {text}")

        try:
            # 使用 zh-CN 作为目标语言代码
            translation = translator.translate(text, dest='zh-CN')
            
            if not translation or not translation.text:
                return jsonify({'error': 'Translation failed'}), 500

            print(f"Translation successful: {translation.text}")
            
            return jsonify({
                'translation': translation.text,
                'source': translation.src,
                'target': translation.dest
            })
            
        except Exception as e:
            print(f"Translation API error: {str(e)}")
            traceback.print_exc()
            return jsonify({'error': f'Translation API error: {str(e)}'}), 500
            
    except Exception as e:
        print(f"Server error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("\n=== Starting Translation Server ===")
    print("Server is running on http://127.0.0.1:5001")
    app.run(host='0.0.0.0', port=5001, debug=True) 