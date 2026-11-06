
// 1. Import Firebase SDK
import { initializeApp } from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    query,
    orderBy
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

import {
    getAuth,
    signInAnonymously
} from
"https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";


// 2. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwYjBJ1At9CZIJ5JCf15XlWvNh_NG3k6c",
    authDomain: "day27-proctor-telemetry-78e4b.firebaseapp.com",
    projectId: "day27-proctor-telemetry-78e4b",
    storageBucket: "day27-proctor-telemetry-78e4b.firebasestorage.app",
    messagingSenderId: "573068846197",
    appId: "1:573068846197:web:d654af8fbcc036bdb9043c"
};


// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firebase initialized successfully!");


// 4. Get HTML Elements
const totalEvents = document.getElementById("totalEvents");
const warningCount = document.getElementById("warningCount");
const criticalCount = document.getElementById("criticalCount");
const normalCount = document.getElementById("normalCount");

const candidateId = document.getElementById("candidateId");
const sessionId = document.getElementById("sessionId");

const alertsContainer = document.getElementById("alertsContainer");

const connectionStatus =
    document.getElementById("connectionStatus");

const connectionDot =
    document.getElementById("connectionDot");


// 5. Format Timestamp
function formatTimestamp(timestamp) {

    if (!timestamp) {
        return "Not available";
    }

    const date = timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString();
}


// 6. Display Alert Card
function displayAlert(data, documentId) {

    const severity = String(
        data.severity_level || "NORMAL"
    ).toLowerCase();

    const gaze = data.alerts?.gaze_deviation || {};
    const acoustic = data.alerts?.acoustic_anomaly || {};

    const card = document.createElement("div");

    card.className = `alert-card ${
        ["warning", "critical"].includes(severity)
            ? severity
            : "normal"
    }`;

    const heading = document.createElement("h3");

    heading.textContent =
        `${severity.toUpperCase()} ALERT`;

    const details = [

        `Candidate ID: ${data.candidate_id || "N/A"}`,

        `Session ID: ${data.session_id || "N/A"}`,

        `Gaze Deviation: ${
            gaze.triggered ? "Detected" : "Not detected"
        }`,

        `Gaze Duration: ${
            gaze.duration_seconds ?? 0
        } seconds`,

        `Acoustic Anomaly: ${
            acoustic.triggered ? "Detected" : "Not detected"
        }`,

        `Average Log Probability: ${
            acoustic.avg_logprob ?? "N/A"
        }`,

        `Flag Type: ${
            acoustic.flag_type || "N/A"
        }`,

        `Latency: ${data.latency_ms ?? "N/A"} ms`,

        `Timestamp: ${formatTimestamp(data.timestamp)}`,

        `Document ID: ${documentId}`
    ];

    card.appendChild(heading);

    details.forEach(detail => {

        const paragraph = document.createElement("p");

        paragraph.textContent = detail;

        card.appendChild(paragraph);

    });

    return card;
}


// 7. Start Firebase Real-Time Listener
function startTelemetryListener() {

    console.log("Starting Firestore listener...");

    const telemetryQuery = query(
        collection(db, "proctor_tracking"),
        orderBy("timestamp", "desc")
    );

    onSnapshot(

        telemetryQuery,

        (snapshot) => {

            console.log(
                "Firestore data received:",
                snapshot.size
            );

            connectionStatus.textContent =
                "Firebase Connected";

            connectionDot.style.background = "#16a34a";

            const events = snapshot.docs;

            let warnings = 0;
            let criticals = 0;
            let normals = 0;

            alertsContainer.replaceChildren();

            if (events.length === 0) {

                const message = document.createElement("p");

                message.className = "empty-message";

                message.textContent =
                    "No telemetry events available.";

                alertsContainer.appendChild(message);
            }

            events.forEach(documentSnapshot => {

                const data = documentSnapshot.data();

                const severity = String(
                    data.severity_level || "NORMAL"
                ).toUpperCase();

                if (severity === "WARNING") {
                    warnings++;
                }
                else if (severity === "CRITICAL") {
                    criticals++;
                }
                else {
                    normals++;
                }

            });

            // Update Dashboard Counters
            totalEvents.textContent = events.length;

            warningCount.textContent = warnings;

            criticalCount.textContent = criticals;

            normalCount.textContent = normals;


            // Update Candidate and Session Information
            if (events.length > 0) {

                const latestData = events[0].data();

                candidateId.textContent =
                    latestData.candidate_id || "N/A";

                sessionId.textContent =
                    latestData.session_id || "N/A";
            }


            // Display All Alert Cards
            events.forEach(documentSnapshot => {

                const data = documentSnapshot.data();

                const card = displayAlert(
                    data,
                    documentSnapshot.id
                );

                alertsContainer.appendChild(card);

            });

        },

        (error) => {

            console.error("Firestore error:", error);

            connectionStatus.textContent =
                "Connection Error";

            connectionDot.style.background = "#dc2626";

            alertsContainer.textContent =
                "Unable to load telemetry data. Check Firestore permissions.";

        }

    );

}


// 8. Firebase Anonymous Authentication
async function connectDashboard() {

    try {

        connectionStatus.textContent =
            "Authenticating...";

        connectionDot.style.background = "orange";

        await signInAnonymously(auth);

        console.log(
            "Anonymous authentication successful!"
        );

        connectionStatus.textContent =
            "Authentication Successful";

        // Start Firestore only after login
        startTelemetryListener();

    }

    catch (error) {

        console.error(
            "Authentication failed:",
            error
        );

        connectionStatus.textContent =
            "Authentication Failed";

        connectionDot.style.background = "#dc2626";

        alertsContainer.textContent =
            "Firebase authentication failed. Check Anonymous Authentication settings.";
    }

}


// 9. Start Dashboard
connectDashboard();
