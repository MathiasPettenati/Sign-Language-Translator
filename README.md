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
- Optional MediaPipe Gesture Recognizer model loading from `frontend/public/models/gesture_recognizer.task`.
- Rule-based static prototype recognition for selected signs and hand shapes.
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
- `gesture_recognizer.task`: optional MediaPipe Gesture Recognizer model.
- `sign_classifier.tflite`: TensorFlow Lite export from `training/export_model.py`.

The Stage 1/2 app loads MediaPipe's public Hand Landmarker model and processes webcam frames
locally in the browser. If no custom gesture model exists, it uses the local prototype classifier
instead of pretending a trained sign model is available.

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
