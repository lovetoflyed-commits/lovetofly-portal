'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import AuthGuard from '../../../components/AuthGuard';

interface ApplicationFormData {
  full_name: string;
  email: string;
  phone: string;
  aviation_role: string;
  experience_level: string;
  pilot_hours?: number;
  motivation: string;
  features_interested: string[];
  agree_nda: boolean;
  agree_privacy: boolean;
}

export default function BetaApplicationPage() {
  return (
    <AuthGuard>
      <BetaApplicationContent />
    </AuthGuard>
  );
}

function BetaApplicationContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    aviation_role: '',
    experience_level: 'beginner',
    motivation: '',
    features_interested: [],
    agree_nda: false,
    agree_privacy: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const aviationRoles = [
    'pilot',
    'aircraft_owner',
    'mechanic',
    'student',
    'instructor',
    'enthusiast',
    'other',
  ];

  const experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

  const betaFeatures = [
    'hangarshare_marketplace',
    'career_system',
    'flight_logbook',
    'e6b_calculator',
    'weather_integration',
    'classifieds',
    'courses',
    'mentorship',
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features_interested: prev.features_interested.includes(feature)
        ? prev.features_interested.filter(f => f !== feature)
        : [...prev.features_interested, feature],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email || !formData.phone || !formData.aviation_role) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!formData.agree_nda || !formData.agree_privacy) {
        setError('You must agree to the NDA and privacy policy');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/beta/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to submit application');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/beta/application-submitted');
      }, 2000);
    } catch (err) {
      console.error('Application submission error:', err);
      setError('An error occurred while submitting your application');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-900 mb-4">Application Submitted</h1>
            <p className="text-green-700 mb-6">
              Thank you for applying to the Love to Fly Beta Testing Program! 
              We'll review your application and contact you soon.
            </p>
            <p className="text-sm text-gray-600">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors mb-6"
          >
            <span>←</span>
            Back to Home
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Beta Testing Program</h1>
          <p className="text-xl text-gray-600">
            Help shape the future of aviation technology
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow-sm">
            <div className="text-2xl font-bold text-blue-600 mb-1">Early Access</div>
            <p className="text-sm text-gray-600">Get features before public release</p>
          </div>
          <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow-sm">
            <div className="text-2xl font-bold text-green-600 mb-1">Shape Features</div>
            <p className="text-sm text-gray-600">Your feedback drives development</p>
          </div>
          <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow-sm">
            <div className="text-2xl font-bold text-purple-600 mb-1">Special Perks</div>
            <p className="text-sm text-gray-600">Exclusive rewards for beta testers</p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-blue-200">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    title="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    title="Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    title="Número de telefone do solicitante"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Aviation Background Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-green-200">
                Aviation Background
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role in Aviation *
                  </label>
                  <select
                    name="aviation_role"
                    value={formData.aviation_role}
                    onChange={handleInputChange}
                    title="Função na aviação"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your role...</option>
                    {aviationRoles.map(role => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ').charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Experience Level *
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleInputChange}
                    title="Nível de experiência"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.aviation_role === 'pilot' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Total Pilot Hours (optional)
                    </label>
                    <input
                      type="number"
                      name="pilot_hours"
                      value={formData.pilot_hours || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 500"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Features Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-purple-200">
                Features You're Interested In
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select which features you'd like to help test:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {betaFeatures.map(feature => (
                  <label
                    key={feature}
                    className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features_interested.includes(feature)}
                      onChange={() => handleFeatureToggle(feature)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {feature
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Motivation Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-orange-200">
                Tell Us About Yourself
              </h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Why do you want to join the beta testing program? *
                </label>
                <textarea
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleInputChange}
                  placeholder="Share your motivation, relevant experience, or what you hope to achieve..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 20 characters recommended</p>
              </div>
            </div>

            {/* Agreements Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-red-200">
                Agreements
              </h2>
              <div className="space-y-3">
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="agree_nda"
                    checked={formData.agree_nda}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500 mt-1"
                    required
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I agree to the <strong>Non-Disclosure Agreement (NDA)</strong> and understand that 
                    beta features are confidential and should not be shared publicly. *
                  </span>
                </label>
                <label className="flex items-start p-4 border border-gray-300 rounded-lg hover:bg-red-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="agree_privacy"
                    checked={formData.agree_privacy}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500 mt-1"
                    required
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I agree to the <strong>Privacy Policy</strong> and consent to my feedback being 
                    used to improve the Love to Fly Portal. *
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center pt-4">
              By submitting this application, you acknowledge that you have read and agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">How long does review take?</h3>
              <p className="text-sm text-gray-600">
                We review applications within 5-7 business days. You'll receive an email with the results.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">What's the time commitment?</h3>
              <p className="text-sm text-gray-600">
                We ask for at least 3-4 hours per week to test features and provide feedback.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Do I get paid?</h3>
              <p className="text-sm text-gray-600">
                No monetary payment, but beta testers receive exclusive perks and free premium features.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Can I leave anytime?</h3>
              <p className="text-sm text-gray-600">
                Yes, you can withdraw from the program at any time without penalties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
