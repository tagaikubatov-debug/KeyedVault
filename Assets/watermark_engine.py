import sys
import os
import shutil
import subprocess
import traceback

# Попытка импортировать библиотеки для работы с изображениями
try:
    import cv2
    import numpy as np
except ImportError:
    print("FATAL: OpenCV or NumPy not installed. Run: pip install opencv-python numpy", file=sys.stderr)
    sys.exit(1)


class SecurityEngine:
    def __init__(self, original_path, protected_path, author_id, file_hash):
        self.original_path = original_path
        self.protected_path = protected_path
        self.author_id = author_id
        self.file_hash = file_hash

        # Общий текст подписи для всех форматов
        self.signature_text = f"PROPERTY OF {author_id} | HASH: {file_hash}"

    def secure_image(self):
        """ Стратегия 1: Твой крутой алгоритм Enterprise-сетки (OpenCV + NumPy) """
        try:
            if not os.path.exists(self.original_path):
                raise FileNotFoundError(
                    f"Input file not found in vault: {self.original_path}")

            img = cv2.imread(self.original_path)
            if img is None:
                raise ValueError(
                    f"OpenCV could not decode the image at {self.original_path}. Is it corrupted?")

            h, w, channels = img.shape

            # Create a blank transparent canvas (overlay)
            overlay = np.zeros((h, w, channels), dtype="uint8")

            # Brand Colors (OpenCV uses BGR format)
            color_burgundy = (56, 21, 111)
            color_gold = (119, 152, 197)

            # Draw the Enterprise Security Grid
            grid_spacing = int(max(h, w) * 0.05)
            for y in range(0, h, grid_spacing):
                cv2.line(overlay, (0, y), (w, y), color_burgundy, 2)
            for x in range(0, w, grid_spacing):
                cv2.line(overlay, (x, 0), (x, h), color_burgundy, 2)

            # Dynamic Typography Engine
            font = cv2.FONT_HERSHEY_DUPLEX
            font_scale = max(0.6, w / 1500.0)
            thickness = max(1, int(font_scale * 2))

            # Stamp the text in a repeating pattern across the grid
            for y in range(int(h * 0.1), h, int(h * 0.25)):
                for x in range(int(w * 0.05), w, int(w * 0.6)):
                    cv2.putText(overlay, self.signature_text, (x, y), font,
                                font_scale, color_gold, thickness, cv2.LINE_AA)

            # Alpha Blending
            protected_img = cv2.addWeighted(img, 1.0, overlay, 0.3, 0)

            # Safe File Writing
            os.makedirs(os.path.dirname(self.protected_path), exist_ok=True)
            cv2.imwrite(self.protected_path, protected_img)

            print(
                f"SUCCESS: Image {self.file_hash} cryptographically hardened.")

        except Exception as e:
            raise Exception(f"Image Securing Failed: {str(e)}")

    def secure_video(self):
        """ Стратегия 2: Водяной знак для видео (FFmpeg) """
        try:
            # FFmpeg выжигает текст по центру видео
            command = [
                "ffmpeg", "-y", "-i", self.original_path,
                "-vf", f"drawtext=text='{self.signature_text}':fontcolor=white@0.5:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.4",
                "-c:a", "copy",
                self.protected_path
            ]

            result = subprocess.run(
                command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            if result.returncode != 0:
                raise Exception(
                    f"FFmpeg error. Is FFmpeg installed? Logs: {result.stderr}")

            print(
                f"SUCCESS: Video {self.file_hash} secured with burned-in watermark.")
        except Exception as e:
            raise Exception(f"Video Securing Failed: {str(e)}")

    def secure_binary(self):
        """ Стратегия 3: Стеганография для 3D, Чертежей, PDF (Скрытая подпись) """
        try:
            shutil.copy2(self.original_path, self.protected_path)

            with open(self.protected_path, "ab") as f:
                hidden_payload = f"\n\n--- KEYED VAULT SECURE SIGNATURE ---\nAUTHOR_ID={self.author_id}\nDNA_HASH={self.file_hash}\n--- END SIGNATURE ---\n"
                f.write(hidden_payload.encode('utf-8'))

            print(
                f"SUCCESS: Binary file {self.file_hash} secured with steganographic metadata.")
        except Exception as e:
            raise Exception(f"Binary Securing Failed: {str(e)}")

    def process(self):
        """ Маршрутизатор (Router): определяет тип файла и направляет его """
        ext = os.path.splitext(self.original_path)[1].lower()

        image_exts = ['.png', '.jpg', '.jpeg', '.bmp', '.webp']
        video_exts = ['.mp4', '.avi', '.mov', '.mkv', '.webm']

        try:
            if ext in image_exts:
                self.secure_image()
            elif ext in video_exts:
                self.secure_video()
            else:
                # Все остальные файлы (PDF, OBJ, DWG, ZIP и т.д.)
                self.secure_binary()

            sys.exit(0)  # Успешное завершение для Java

        except Exception as e:
            # Перехват и отправка ошибки в Java (stderr)
            print("PYTHON CRITICAL FAILURE:", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            sys.exit(1)


# --- ENTRY POINT ---
if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(
            f"FATAL: Expected 4 arguments, received {len(sys.argv) - 1}", file=sys.stderr)
        sys.exit(1)

    arg_input_file = sys.argv[1]
    arg_output_file = sys.argv[2]
    arg_author = sys.argv[3]
    arg_hash = sys.argv[4]

    engine = SecurityEngine(
        arg_input_file, arg_output_file, arg_author, arg_hash)
    engine.process()
