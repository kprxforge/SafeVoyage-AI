<h1>SafeVoyage AI</h1>
AI-powered tourist safety monitoring and risk-aware navigation ---
currently a functional web prototype, with a native mobile application
planned as the end product.

SafeVoyage AI explores how historical safety information and relevant
live context can help travellers make more informed decisions in
unfamiliar locations. The long-term goal is to predict geographical
risk, visualise it on a map, and recommend routes that balance safety,
distance, and travel time.
Project status: Web prototype / work in progress. The current
prototype demonstrates selected user-facing safety and navigation
workflows. The complete data pipeline, validated machine-learning risk
prediction, and fully native mobile application are planned
development goals---not claims of completed functionality.

Contents
- Project Overview
- Current Prototype
- Planned AI/ML Capabilities
- Technology Stack
- Getting Started
- Environment Configuration
- How the System Is Intended to
  Work
- Roadmap
- Important Limitations
- Privacy and Safety
- Contributing
- License
Project Overview
Travellers may not know which areas are potentially unsafe, or how local
conditions change throughout the day. Conventional navigation commonly
prioritises distance and travel time, while safety tools may rely on
static information or reactive alerts.

SafeVoyage AI aims to bridge this gap with a safety-oriented workflow:
1. Collect historical safety information and relevant contextual data.
2. Process data by location and time.
3. Estimate risk for geographical areas.
4. Display risk information on an interactive map.
5. Use risk estimates alongside distance and travel time when comparing
   routes.
6. Provide useful safety information and emergency-support features.
The initial research and prototype scope is intended to focus on a
selected city or tourist region rather than attempting to model the
entire world at once.
Current Prototype
The repository currently contains a React + TypeScript + Vite web
application. The prototype includes user-facing features such as:
- Interactive map experience built with Leaflet and React Leaflet.
- Browser-based location access.
- Route display using Leaflet Routing Machine.
- Demonstration risk/safety zones and route-related UI.
- AI-assisted safety information and translation using the Google
  Gemini API.
- Emergency-contact and SOS-related interface features.
- Trip-sharing and basic offline-state UI.
Some workflows use mock, simulated, or browser-local data. In
particular, displayed zones and route choices should not be
interpreted as verified, live crime-risk assessments. See Important
Limitations.
Planned AI/ML Capabilities
The research direction includes the following capabilities, which
require data preparation, implementation, and validation before they can
be presented as production features:
- Spatio-temporal risk prediction: Estimate risk by geographical
  area and time.
- Historical and current data fusion: Combine compatible datasets
  using consistent location and time units.
- Anomaly detection: Flag unusual changes in available
  safety-related signals.
- Near-future risk forecasting: Estimate how area risk may change
  over a future time window.
- Risk-aware route recommendation: Compare candidate routes using
  estimated risk, distance, and travel time.
- Model evaluation: Assess performance with appropriate metrics
  such as precision, recall, F1-score, and ROC-AUC when suitable for
  the chosen task.
A trained and validated predictive risk model is not implied by the
presence of AI-assisted text features in the current web prototype.
Technology Stack
Based on the current repository configuration:

  Area                      Technologies
  Frontend                  React, TypeScript
  Development/build         Vite
  Styling                   Tailwind CSS
  Mapping                   Leaflet, React Leaflet
  Route display             Leaflet Routing Machine
  AI-assisted features      Google Gemini API via @google/genai
  UI utilities              Lucide React, Motion, date-fns
  Additional dependencies   Express, dotenv, UUID

The repository includes Express and dotenv dependencies, but their
presence alone does not mean a production backend or ML service is
complete. The planned predictive ML layer may be developed as a separate
Python service and integrated through a backend as the architecture
evolves.
Getting Started
Prerequisites
- Node.js (a current LTS release is recommended)
- npm
- Git
Run locally
git clone https://github.com/kprxforge/SafeVoyage-AI.git
cd SafeVoyage-AI
npm install
Create a local environment file if the features you are testing require
environment variables:
cp .env.example .env
Open .env and add the appropriate values for your environment. Do not
commit real secrets.

Start the development server:
npm run dev
Vite is configured to use port 3000. Open the local URL printed in the
terminal, typically http://localhost:3000.
Useful commands
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run the TypeScript no-emit check
Environment Configuration
The repository provides an .env.example with the following variables:

  Variable           Purpose
  GEMINI_API_KEY   API key for Gemini-powered features
  APP_URL          Application URL in the configured hosting environment

Use the environment-variable names expected by the code. Vite only
exposes variables prefixed with VITE_ to browser code by default; do
not rename variables or move secrets into client-side code without
checking how they are consumed.

Security notes:
- Never commit .env or real API keys.
- Do not expose private API credentials in browser-delivered
  JavaScript.
- For production, route secret-bearing API calls through a secure
  backend where appropriate.
- Apply usage limits and review provider terms for external APIs.
How the System Is Intended to Work
Historical safety data ─┐
Traffic / weather data ─┼─> Data preparation ─> Risk estimation
Location and time ─────┘                           │
                                                   v
                                      Geographical risk map
                                                   │
Candidate routes ─────────────────────────────────┤
                                                   v
                                  Safety-aware route comparison
                                                   │
                                                   v
                                    Traveller information / alerts
This diagram describes the intended architecture, not a claim that
every stage is implemented in the current prototype.

Historical data can teach a model recurring patterns. Relevant current
data can then be processed using the same feature definitions to update
estimates at runtime; continuous retraining is not necessarily required.
Roadmap
Current phase --- Web prototype
- [x] Establish the React/TypeScript/Vite web application.
- [x] Build an interactive map and route-display experience.
- [x] Prototype selected safety, AI-assisted information, and
  SOS-related UI flows.
- [ ] Replace simulated safety zones and mock route decisions with
  data-backed logic.
Research and prediction layer
- [ ] Select a defined pilot region and consistent geographical units.
- [ ] Collect and document suitable historical safety datasets.
- [ ] Identify compatible traffic, tourism, weather, and other
  contextual sources.
- [ ] Build a reproducible data-cleaning and feature-engineering
  pipeline.
- [ ] Train and evaluate an initial risk-prediction model.
- [ ] Add anomaly detection and, where data supports it, near-future
  forecasting.
Integration and validation
- [ ] Connect the prediction service to the application through a
  secure backend.
- [ ] Generate risk layers from model outputs rather than fixed
  demonstration zones.
- [ ] Compare candidate routes using safety, distance, and travel
  time.
- [ ] Test API failure handling, data freshness, model quality, and
  user experience.
Long-term direction --- Native mobile application
- [ ] Design and build a fully native mobile experience.
- [ ] Adapt location permissions, background behaviour, notifications,
  and emergency workflows to mobile platforms.
- [ ] Conduct privacy, reliability, accessibility, and field-use
  testing.
Important Limitations
- Risk zones, route choices, and sample data in the current prototype
  may be simulated or rule-based.
- Traffic volume is not the same as pedestrian or tourist crowd
  density.
- Historical district-level annual crime data cannot by itself
  establish street-level or hour-by-hour risk.
- Risk predictions depend on data coverage, quality, freshness, and
  model validation.
- A low predicted risk does not guarantee that a location is safe.
- The project is a research prototype and should not be relied on as
  the sole basis for personal safety decisions or emergency response.
Privacy and Safety
Location information is sensitive. Future releases should request only
necessary permissions, explain how location data is used, minimise
retention, protect stored information, and avoid exposing a traveller's
location without consent. Any risk display should communicate
uncertainty and avoid presenting model estimates as certainty.

For an immediate emergency, use local emergency services and trusted
official sources; do not rely solely on this prototype.
