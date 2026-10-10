import type { FirebaseOptions } from "firebase/app";

// Non-secret by design -- see terraform/firestore.tf and
// docs/Project_Factory_Dashboard_UI.md "One-time Firestore setup".
// Access control is Firestore Security Rules (firebase/firestore.rules),
// not secrecy of this value.
//   projectId: `terraform output firestore_project_id`
//   apiKey:    created once via `gcloud services api-keys create ...`
export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyDA39TRsA7LquhGXzK1Om9zDfkROKi--44",
  projectId: "nickm-project-factory",
};