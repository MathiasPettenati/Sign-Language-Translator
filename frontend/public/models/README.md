# Model Directory

Place trained browser models here:

- `gesture_recognizer.task` for a MediaPipe Gesture Recognizer model.
- `sign_classifier.tflite` if you export a standalone TensorFlow Lite classifier.
- `labels.json` is consumed by the app and training scripts.

The Stage 1 app loads the MediaPipe Hand Landmarker model from Google's public model storage by default. Webcam frames stay in the browser; they are not uploaded by the app.
