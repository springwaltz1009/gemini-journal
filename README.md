# Gemini Journal & Reflection Companion

A secure, user-authenticated journaling and wellbeing reflection web application powered by Google Gemini and Cloud Firestore.

---

## 🛡️ Security Architecture & Threat Model

| Zone | Threat Identified | Countermeasure Implemented |
| :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection via journal reflections | Delimiter isolation, passive text ingestion, schema validation |
| **Planning & Reasoning** | System instruction bypass | Wellbeing-centric guardrails, structured JSON output enforcement |
| **Tool Execution** | API credential leakage | All Gemini calls executed server-side via Express proxy |
| **Memory & State** | Cross-user data contamination | Owner-bound Firestore rules restricting access to `request.auth.uid == userId` |
| **Inter-System Comms** | Involuntary location tracking | User-controlled, optional, human-readable place tagging |

---

## 🚀 Cloud Run Deployment & Configuration Guide

### 1. Prerequisites
Ensure the necessary Google Cloud APIs are enabled in your GCP project:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

### 2. Secret Management Setup
Store your Gemini API key securely in Google Cloud Secret Manager:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Cloud Firestore Security Rules
Deploy the following owner-bound Firestore security rules (`firestore.rules`):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journals/{journalId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### 4. Cloud Run Deployment Flow
Build and deploy the application to Cloud Run with Secret Manager environment variable binding:

```bash
gcloud run deploy gemini-journal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 5. Mandatory Verification Binding
Apply the challenge verification label:

```bash
gcloud run services update gemini-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region us-central1
```

---

## 🧭 Features Walkthrough & Test Guide

1. **Authentication Flow**:
   - Arrive at the landing page and click "Continue with Google".
   - Authenticate with your Google account.
   - Verify that your profile photo and email appear on the top right navigation bar.

2. **Journal Canvas & Draft Gating**:
   - In the Journal Canvas, write a brand-new reflection draft. Notice the badge shows `Local Draft (Unsaved)`.
   - Brand-new drafts remain strictly local and do not create premature Firestore documents while typing.
   - Click "Save to Cloud" once finished. The document is validated and saved to `users/{authenticatedUid}/journals/{entry.id}`.
   - The badge updates to `Cloud Synced`, and the entry appears immediately in **Past Entries**.
   - Subsequent edits on this saved entry trigger the 1.5-second debounced autosave.

3. **Reflection Compass**:
   - Switch to the "Reflection Compass" tab.
   - Explicitly select any saved journal entry and click "Chart Reflection Compass".
   - Generates the 5 structured reflection dimensions (*What Explored*, *Key Ideas*, *Possible Next Actions*, *Things to Revisit*, *One Reflection Question*).
   - Past generated compasses are stored under `compass` on the journal entry.

4. **Wellbeing Companion**:
   - Switch to the dedicated "Wellbeing Companion" tab.
   - Engage in a supportive, non-clinical multi-turn conversation with contextual quick chips (*Help me unpack this*, *Reflect*, *Gentle next step*).
   - Operates in strict context isolation from private journal canvas entries.

5. **Past Entries & Search**:
   - Switch to "Past Entries" to filter entries in real time by keyword, mood chip, or tag.
   - Download any reflection as a Markdown (`.md`) file or delete unwanted entries.
