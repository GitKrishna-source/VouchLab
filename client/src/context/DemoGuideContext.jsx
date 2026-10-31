import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { api } from '../services/api.js';

const DemoGuideContext = createContext(null);

export const DEMO_STEPS = [
  {
    step: 1,
    title: '1. Owner Lists Laser Cutter',
    role: 'owner',
    targetEmail: 'owner1@demo.edu',
    route: '/resources/1',
    description: 'Dr. Vikram Rao lists the Laser Cutter with rules, hours, deposit ($25), and 3 strict requirements (safety quiz, 1 supervised session, manager sign-off).'
  },
  {
    step: 2,
    title: '2. Natural Language Search',
    role: 'user',
    targetEmail: 'student1@demo.edu',
    route: '/explore?q=cut+acrylic',
    description: 'Student Keerat searches "cut acrylic" and the AI/heuristic matcher instantly pinpoints the Universal Laser Cutter.'
  },
  {
    step: 3,
    title: '3. Passport & Safety Quiz',
    role: 'user',
    targetEmail: 'student1@demo.edu',
    route: '/resources/1',
    description: 'Laser Cutter requires 3 checks. Keerat has 2, missing the Safety Quiz. Take and pass the quiz in-app to flip eligibility to green!'
  },
  {
    step: 4,
    title: '4. Booking Request & Conflict',
    role: 'user',
    targetEmail: 'student1@demo.edu',
    route: '/book/2',
    description: 'Keerat submits a request for 3D Printer tomorrow. Notice the competing request from Rohan Mehta for the exact same slot!'
  },
  {
    step: 5,
    title: '5. Explainable Fair-Share Allocation',
    role: 'owner',
    targetEmail: 'owner1@demo.edu',
    route: '/owner/requests',
    description: 'The Fair-Share Engine ranks Keerat #1 (score 36) over Rohan #2 (score 22). Click "Why?" to inspect the transparent formula breakdown.'
  },
  {
    step: 6,
    title: '6. Owner Approval (or Override)',
    role: 'owner',
    targetEmail: 'owner1@demo.edu',
    route: '/owner/requests',
    description: 'Owner approves Keerat’s #1 recommendation. Or test an override—the system requires a mandatory written reason logged to audit.'
  },
  {
    step: 7,
    title: '7. Evidence-Based Check-In',
    role: 'user',
    targetEmail: 'student1@demo.edu',
    route: '/my-bookings',
    description: 'Student collects equipment, completes initial condition checklist, uploads photos, and receives confirmed check-in timestamp.'
  },
  {
    step: 8,
    title: '8. Return & AI Damage Summary',
    role: 'user',
    targetEmail: 'student3@demo.edu',
    route: '/bookings/4',
    description: 'Inspect DSLR return with a scratch diff: condition diff highlighted automatically, AI summary generated, and owner resolves with log note.'
  },
  {
    step: 9,
    title: '9. Tamper-Evident SHA-256 Audit Chain',
    role: 'admin',
    targetEmail: 'admin@demo.edu',
    route: '/admin',
    description: 'Click "Verify Integrity" to validate cryptographic SHA-256 hashes. Click "Tamper with Row" to prove breakage, then "Restore"!'
  }
];

export function DemoGuideProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { demoLogin, user } = useAuth();
  const navigate = useNavigate();

  const executeStep = async (stepNumber) => {
    const stepObj = DEMO_STEPS.find(s => s.step === stepNumber);
    if (!stepObj) return;

    setCurrentStep(stepNumber);

    // Switch account if needed
    if (!user || user.email !== stepObj.targetEmail) {
      try {
        await demoLogin({ email: stepObj.targetEmail });
      } catch (e) {
        console.error('Failed to switch demo account:', e);
      }
    }

    navigate(stepObj.route);
  };

  const nextStep = () => {
    if (currentStep < DEMO_STEPS.length) {
      executeStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      executeStep(currentStep - 1);
    }
  };

  const resetAllDemoData = async () => {
    try {
      await api.resetDemoDatabase();
      await executeStep(1);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  return (
    <DemoGuideContext.Provider value={{
      isOpen,
      setIsOpen,
      currentStep,
      setCurrentStep,
      steps: DEMO_STEPS,
      executeStep,
      nextStep,
      prevStep,
      resetAllDemoData
    }}>
      {children}
    </DemoGuideContext.Provider>
  );
}

export function useDemoGuide() {
  const context = useContext(DemoGuideContext);
  if (!context) throw new Error('useDemoGuide must be used within a DemoGuideProvider');
  return context;
}

