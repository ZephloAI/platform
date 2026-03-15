import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useOrgStore } from '../stores/orgStore';

// ============================================================
// OnboardingPage
// 3-step wizard: Organization → About You → Invite Team
// Warm Editorial design with amber/gold ambient gradients.
// ============================================================

const ORG_SIZES = [
  { value: '1-10', label: '1 - 10' },
  { value: '11-50', label: '11 - 50' },
  { value: '51-200', label: '51 - 200' },
  { value: '201-1000', label: '201 - 1,000' },
  { value: '1000+', label: '1,000+' },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Netherlands', 'Sweden', 'Switzerland', 'Japan',
  'South Korea', 'Singapore', 'India', 'Brazil', 'Mexico',
  'Kenya', 'Nigeria', 'South Africa', 'United Arab Emirates', 'Other',
];

interface TeamMember {
  email: string;
  role: string;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Organization
  const currentOrg = useOrgStore((s) => s.organizations[0]);
  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [orgSize, setOrgSize] = useState('');
  const [orgPhone, setOrgPhone] = useState('');

  // Step 2: About You
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  // Step 3: Team
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: '', role: 'member' },
  ]);

  const totalSteps = 3;

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: '', role: 'member' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = teamMembers.map((m, i) =>
      i === index ? { email: field === 'email' ? value : m.email, role: field === 'role' ? value : m.role } : m
    );
    setTeamMembers(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Filter out empty team member rows
      const validMembers = teamMembers.filter((m) => m.email.trim() !== '');

      await apiClient.post('/api/onboarding', {
        phone: phone || null,
        country: country || null,
        organization_name: orgName,
        organization_size: orgSize || null,
        organization_phone: orgPhone || null,
        team_members: validMembers,
      });

      useAuthStore.getState().updateUser({ onboarding_completed: true });
      // Refresh orgs to get updated name
      useOrgStore.getState().fetchOrganizations();
      navigate('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return orgName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-primary px-4 relative overflow-hidden">
      {/* Warm ambient gradient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/[0.06] rounded-full blur-3xl" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-400/[0.04] rounded-full blur-3xl" />

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo and heading */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-accent/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="heading-xl font-display text-label-primary mb-1">
            {step === 1 && 'Set up your organization'}
            {step === 2 && 'About you'}
            {step === 3 && 'Invite your team'}
          </h1>
          <p className="text-[15px] text-label-tertiary">
            {step === 1 && 'Tell us about your company'}
            {step === 2 && 'A few details to personalize your experience'}
            {step === 3 && 'Collaborate with your team members'}
          </p>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-8 bg-accent'
                  : i + 1 < step
                    ? 'w-1.5 bg-accent/40'
                    : 'w-1.5 bg-black/[0.08]'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-[13px] rounded-xl p-3.5 border border-red-100 mb-4">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="card p-8">
          {/* Step 1: Organization */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="orgName" className="input-label">Organization Name</label>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="input-field"
                  placeholder="Acme Inc."
                />
              </div>
              <div>
                <label htmlFor="orgSize" className="input-label">Team Size</label>
                <select
                  id="orgSize"
                  value={orgSize}
                  onChange={(e) => setOrgSize(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select size</option>
                  {ORG_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="orgPhone" className="input-label">Organization Phone</label>
                <input
                  id="orgPhone"
                  type="tel"
                  value={orgPhone}
                  onChange={(e) => setOrgPhone(e.target.value)}
                  className="input-field"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          )}

          {/* Step 2: About You */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="phone" className="input-label">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label htmlFor="country" className="input-label">Country</label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Invite Team */}
          {step === 3 && (
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    {index === 0 && <label className="input-label">Email</label>}
                    <input
                      type="email"
                      value={member.email}
                      onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                      className="input-field"
                      placeholder="teammate@company.com"
                    />
                  </div>
                  <div className="w-28">
                    {index === 0 && <label className="input-label">Role</label>}
                    <select
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                      className="input-field"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {teamMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTeamMember(index)}
                      className="pb-2.5 text-label-tertiary hover:text-red-400 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTeamMember}
                className="text-[13px] text-accent hover:text-accent-hover transition-colors font-semibold"
              >
                + Add another
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="btn-secondary px-6"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-accent px-8"
            >
              Next
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-ghost px-6"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-accent px-8"
              >
                {loading ? 'Finishing...' : 'Finish & Launch'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
