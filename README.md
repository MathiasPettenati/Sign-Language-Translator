# Handspeak

Handspeak is a real-time isolated-sign recognition and speech application. It uses a webcam,
Google MediaPipe hand landmarks, a prototype static-sign classifier, sentence building, and the
browser Web Speech API.

This is not a complete ASL translator. ASL has its own grammar and depends on movement, facial
expression, body posture, orientation, and context. The first version is intentionally scoped to
isolated signs and practical fingerspelling hand shapes.

## Current MVP

- React, TypeScript, Vite, Tailwind CSS, and Lucide icons.
- MediaPipe Hand Landmarker integration running in the browser.
- MIT-licensed Kaggle ASL Signs TFLite model for 250 isolated ASL signs.
- Optional MediaPipe Gesture Recognizer model loading from `frontend/public/models/gesture_recognizer.task`.
- Rule-based static prototype recognition for selected signs and hand shapes.
- Free local camera training for any known word, stored in browser storage.
- Full known-vocabulary word bank for sentence building and speech output.
- Prediction buffering, confidence thresholding, stabilization timing, neutral reset, and cooldown.
- Webcam landmark overlay with hand boxes, handedness labels, and confidence display.
- Sentence builder with edit, speak, replay, stop, undo, and clear controls.
- Local settings, generated sentence, and recognition history.
- IndexedDB dataset collector with labels, participants, sessions, splits, sample counts, delete, and export.
- Python preprocessing, training, evaluation, and TensorFlow Lite export scripts.
- Vitest unit tests and Playwright smoke test.



## Frontend Setup

```powershell
cd "C:\Users\mathi\OneDrive\Desktop\Projects\Sign Language Translator\Sign-Language-Translator\frontend"
npm.cmd install
npm.cmd run dev
```

Open `http://127.0.0.1:5173`.

Useful commands:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
```

## Model Files

Generated or trained model files belong in `frontend/public/models/`.

- `labels.json`: label map used by the app and training pipeline.
- `asl_signs_250.tflite`: free MIT-licensed 250-class isolated-sign model mirrored from `sign/kaggle-asl-signs-1st-place`.
- `asl_signs_250_labels.json`: label map for the 250-class ASL Signs model.
- `gesture_recognizer.task`: optional MediaPipe Gesture Recognizer model.
- `sign_classifier.tflite`: TensorFlow Lite export from `training/export_model.py`.

The app loads MediaPipe's public hand and holistic landmark models and processes webcam frames
locally in the browser. The broad isolated-sign path uses the MIT-licensed Kaggle ASL Signs model
from Hugging Face (`https://huggingface.co/sign/kaggle-asl-signs-1st-place`), which packages the
winning Kaggle ASL Signs entry and a 250-sign vocabulary. If that TFLite model cannot load or is
not confident enough, recognition falls back to an optional custom gesture model, local user-trained
word profiles, and built-in hand-shape rules.

## External Sources

- ASL Signs 250 TFLite model: https://huggingface.co/sign/kaggle-asl-signs-1st-place
- Model card / README: https://huggingface.co/sign/kaggle-asl-signs-1st-place/blob/main/README.md
- 250-sign label map: https://huggingface.co/sign/kaggle-asl-signs-1st-place/blob/main/sign_to_prediction_index_map.json
- Local source note: `frontend/public/models/asl_signs_250_SOURCE.md`

## Dataset Collection

1. Run the frontend.
2. Open the Dataset page.
3. Choose a sign label, participant, session, and split.
4. Start the camera and capture examples from different angles, distances, and hands.
5. Start a new session before switching from train to validation or test.
6. Export the dataset JSON and place it under `training/data/raw/`.

Include a `none` class with resting hands, transitions, partial hands, random movement, and non-sign
gestures.

## Training Setup

```powershell
cd "C:\Users\mathi\OneDrive\Desktop\Projects\Sign Language Translator\Sign-Language-Translator\training"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Train from a browser export:

```powershell
python preprocess.py --input data/raw/handspeak-dataset.json
python train.py
python evaluate.py --split test
python export_model.py --copy-to-frontend
```

`preprocess.py` validates labels and fails if the same recording session appears in multiple splits.
`evaluate.py` writes accuracy, precision, recall, F1, confusion matrix, and commonly confused signs.

## Optional Python Collector

The browser collector is the recommended path. A local OpenCV collector is also included:

```powershell
python collect_data.py --label Hello --participant participant-001 --split train
```

Press `Space` to capture, `N` for a new session, and `Q` to quit.

## Deployment

The frontend can deploy to Vercel without paid services:

```powershell
cd frontend
npm.cmd run build
```

Use `frontend` as the project root and `dist` as the output directory. No environment variables are
required for the current MVP, so there is no `.env.example`.
