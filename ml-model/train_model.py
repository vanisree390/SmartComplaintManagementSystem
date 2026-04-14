import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os
import numpy as np

# ── Load & clean ──────────────────────────────────────────────────────────────
df = pd.read_csv('complaints_dataset.csv')
df = df.dropna()
df = df[df['text'].str.strip() != '']
df = df[df['department'].str.strip() != '']
df = df.reset_index(drop=True)

print("=== Dataset Info ===")
print(f"Total samples : {len(df)}")
print(f"Departments   : {sorted(df['department'].unique())}")
print(f"\nSamples per department:\n{df['department'].value_counts()}\n")

X = df['text']
y = df['department']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)

# ── Pipeline ──────────────────────────────────────────────────────────────────
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=15000,
        sublinear_tf=True,
        min_df=1,
        analyzer='word',
        strip_accents='unicode',
    )),
    ('clf', LogisticRegression(
        max_iter=2000,
        C=10.0,
        solver='lbfgs',
    ))
])

pipeline.fit(X_train, y_train)

# ── Evaluation ────────────────────────────────────────────────────────────────
cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"Cross-validation accuracy : {np.mean(cv_scores)*100:.1f}%  "
      f"(+/- {np.std(cv_scores)*100:.1f}%)")

y_pred = pipeline.predict(X_test)
print(f"Test set accuracy         : {accuracy_score(y_test, y_pred)*100:.1f}%\n")
print("=== Classification Report ===")
print(classification_report(y_test, y_pred))

# ── Save ──────────────────────────────────────────────────────────────────────
os.makedirs('model', exist_ok=True)
joblib.dump(pipeline, 'model/classifier.pkl')
print("Model saved → model/classifier.pkl")

# ── Sanity test ───────────────────────────────────────────────────────────────
test_cases = [
    ("wifi not working in lab",                "IT"),
    ("salary not credited this month",          "Finance"),
    ("hostel bathroom very dirty",              "Hostel"),
    ("exam result not declared yet",            "Academics"),
    ("classroom fan is broken",                 "Maintenance"),
    ("leave application not approved",          "HR"),
    ("fee payment gateway error",               "Finance"),
    ("timetable not updated on portal",         "Administration"),
    ("project guide not assigned to me",        "Academics"),
    ("hostel mess food is very bad",            "Hostel"),
    ("water leakage in corridor",               "Maintenance"),
    ("bonafide certificate not issued",         "HR"),
    ("internet very slow in campus",            "IT"),
    ("scholarship amount not received",         "Finance"),
    ("bus pass not issued",                     "Administration"),
]

print("\n=== Sanity Test ===")
correct = 0
for text, expected in test_cases:
    dept = pipeline.predict([text])[0]
    conf = round(pipeline.predict_proba([text]).max() * 100, 1)
    status = "✓" if dept == expected else f"✗ (expected {expected})"
    print(f"  {status}  '{text}'\n      → {dept} ({conf}%)\n")
    if dept == expected:
        correct += 1

print(f"Sanity accuracy: {correct}/{len(test_cases)}  ({correct/len(test_cases)*100:.0f}%)")