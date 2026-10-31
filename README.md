# TrustShare (VouchLab)
### Trust-and-Accountability Campus Resource Sharing Engine

> **Hackathon Prototype** | Campus equipment and space sharing with cryptographic auditability, eligibility passports, transparent fair-share allocation, and condition tracking.

---

## 🌟 Overview & Problem Solved
Traditional university booking systems (calendars, forms, Google Sheets) manage time availability but ignore:
1. **Safety & Eligibility**: Did the student complete the mandatory laser safety quiz or manager sign-off?
2. **Fairness & Equity**: Why does one lab group hoard the 3D printer or camera kit while another gets rejected?
3. **Condition & Damage Tracking**: Who damaged the lens, or left the laser cutter dirty?
4. **Accountability**: Can records or approval decisions be disputed or altered?

**TrustShare** solves these challenges with five core pillars:
- 🛡️ **Eligibility Passport**: Real-time checklists with quizzes, certificate uploads, and faculty sign-offs.
- ⚖️ **Explainable Fair-Share Allocation**: Transparent priority scoring formula considering wait time, 30-day past usage, project priority tiers, and monthly hour caps.
- 📸 **Evidence-Based Check-in & Return**: Side-by-side condition checklists and photo comparisons that flag differences and potential damages.
- 🔗 **Cryptographic SHA-256 Audit Log**: Tamper-evident hash-chained ledger of every state change, listing, approval, check-in, and dispute, with one-click cryptographic verification and an interactive demo tamper tool for judges.
- 🤖 **Human-in-the-Loop AI Suggestions**: Automated damage summarization and intelligent alternatives with 100% offline fallback when no API key is provided.

---

## 🚀 Quick Start (Demo-Ready)

### 1. Install & Run
```bash
# Clone or open the repository root:
cd d:/MyProject/VouchLab

# Run client & server concurrently:
npm run dev

# Or run tests:
npm test
```

- **Frontend & Full App**: [http://localhost:5000](http://localhost:5000) (Production SPA server) or [http://localhost:5173](http://localhost:5173) (Vite Dev Server)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 👥 Demo Accounts

The database auto-seeds on first launch with realistic users, resources, overlapping bookings, condition history, and an intact audit chain:

| Role | Email | Password | Pre-seeded Scenario |
|---|---|---|---|
| **Student (Alex)** | `student1@demo.edu` | `demo1234` | Missing Laser Safety Quiz; competing for Laser Cutter |
| **Student (Sam)** | `student2@demo.edu` | `demo1234` | Fully certified; competing booking with higher 30-day usage |
| **Owner (Dr. Vance)** | `owner@demo.edu` | `demo1234` | Lab Owner; reviews incoming requests & fair-share queues |
| **Manager (Sarah)** | `manager@demo.edu` | `demo1234` | Lab Manager; supervises sessions and verifies certificates |
| **Admin (Dean Rice)**| `admin@demo.edu` | `demo1234` | Campus Admin; verifies owners, inspects SHA-256 audit chain |

> 💡 **Quick Login**: Use the 1-click role buttons on the `/login` screen or use the floating **Guided Demo Bar** at the bottom of the screen.

---

## 🧭 The Guided Demo Flow (9 Steps)

1. **Owner Lists Equipment**: Dr. Vance lists the *CO2 Laser Cutter* with rules, hourly caps, and 3 mandatory requirements (Safety Quiz, Supervised Session, Faculty Sign-off).
2. **Student Natural Language Search**: Student 1 searches `"cut acrylic sheets"` and the system matches the Laser Cutter.
3. **Live Eligibility Passport**: Student 1 visits the details page; sees the red missing requirement (Safety Quiz). Clicks **Take Quiz**, scores 100%, and the checklist turns green instantly.
4. **Fair-Share Conflict Detection**: Student 1 and Student 2 both request overlapping slots (Friday 2:00 PM – 4:00 PM). The engine flags the conflict.
5. **Transparent Queue Ranking**: Both students and the owner see the exact formula breakdown:
   $$\text{Score} = (\text{Wait Days} \times 2.0) - (\text{30-day Usage Hrs} \times 1.5) + \text{Academic Bonus}$$
   Student 1 is ranked #1 because Student 2 already logged 18 hours this month.
6. **Owner Review & Override**: Dr. Vance reviews the ranked queue with full transparency and approves Student 1.
7. **Condition Check-in**: Student 1 collects the resource, completes the condition checklist (all clean, operational), and uploads photos.
8. **Return & Damage Detection**: Upon return, a new scratch is recorded. The system highlights the difference, files an incident report, and presents an AI damage summary to the owner.
9. **Tamper-Evident Audit Chain**: Both users and the Admin view the append-only ledger and click **Verify Integrity** (Valid). The Admin runs the **Simulate Row Tamper** demo tool to show the chain immediately detect corruption, and then clicks **Restore** to show resilience.

---

## 🏗️ Architecture & Technical Stack

```
VouchLab/
├── client/                     # React + Vite + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/         # StatusBadges, GuidedDemoBar, ScoreModal, QuizModal
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── pages/              # 12 Screens matching design specification
│   │   └── services/           # Axios API client (/api/*)
│   └── dist/                   # Production build served by Express
├── server/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── db/                 # SQLite (better-sqlite3) schema & auto-seed
│   │   ├── middleware/         # JWT auth & role-based access control
│   │   ├── routes/             # Resources, Passport, Bookings, Incidents, Audit, Admin
│   │   ├── services/           # FairShare, AuditChain (SHA-256), AI summarizer
│   │   └── uploads/            # Local storage for photos and certificates
│   └── tests/                  # Node.js native unit tests (TAP)
└── README.md
```

- **Database**: Zero-setup `better-sqlite3` with normalized tables portable to PostgreSQL.
- **Audit Ledger**: Hash-chaining each row using canonical SHA-256 serialization `SHA-256(prev_hash + entry)`.
- **Automated Overdue Watcher**: Background worker periodically flags overdue returns and dispatches real-time user/owner alerts.
- **Security & Privacy**: Helmet security headers, rate limiting (auth, quizzes, uploads), strict MIME validation, and PII sanitization for owner views.
- **Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` for instant production deployment.

---

## 🐳 Docker Deployment

To launch the full production stack in an isolated container:

```bash
docker compose up --build
```
The application will be live at `http://localhost:5000` with persistent storage volumes for uploaded documents and database records.

