# Handspeak Training Pipeline

The frontend dataset collector exports landmark samples as JSON. These scripts train a small static
isolated-sign classifier from that export.

## Setup

```powershell
cd "C:\Users\mathi\OneDrive\Desktop\Projects\Sign Language Translator\Sign-Language-Translator\training"
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Browser Collector Flow

1. Open the frontend dataset page.
2. Capture samples with a fixed participant, label, session, and split.
3. Start a new session before switching from train to validation or test.
4. Export the dataset JSON.
5. Put the export under `training/data/raw/`.

## Train

```powershell
python preprocess.py --input data/raw/handspeak-dataset.json
python train.py
python evaluate.py --split test
python export_model.py --copy-to-frontend
```

`export_model.py` writes `sign_classifier.tflite`. If you train a MediaPipe Model Maker gesture
recognizer instead, place the exported `gesture_recognizer.task` in `frontend/public/models/`.

## Important Evaluation Rule

Do not put frames from the same recording session into multiple splits. The preprocessing script
fails fast if it finds session leakage.
