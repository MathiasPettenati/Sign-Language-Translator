# Model Directory

Place trained browser models here:

- `asl_signs_250.tflite` for the MIT-licensed Kaggle ASL Signs 250-class isolated-sign model.
- `asl_signs_250_labels.json` for that model's `label -> prediction index` map.
- `tflite-wasm/` for the TensorFlow.js TFLite WASM runtime files served by the frontend.
- `gesture_recognizer.task` for a MediaPipe Gesture Recognizer model.
- `sign_classifier.tflite` if you export a standalone TensorFlow Lite classifier.
- `labels.json` is consumed by the app and training scripts.

The ASL Signs model was mirrored from `https://huggingface.co/sign/kaggle-asl-signs-1st-place`,
whose model card declares an MIT license. Its README says the files come from the Kaggle ASL Signs
winning solution and the competition vocabulary.

The app loads the MediaPipe hand and holistic landmark models from Google's public model storage by default. Webcam frames stay in the browser; they are not uploaded by the app.

When the ASL Signs model is unavailable or below the confidence threshold, camera auto-recognition falls back to optional `gesture_recognizer.task`, built-in hand-shape rules, and local user-trained word profiles. The full label set in `labels.json` remains available in the app's word bank for sentence building and speech.
