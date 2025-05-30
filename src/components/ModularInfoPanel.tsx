"use client";

import { useState } from 'react';

interface ModularInfoPanelProps {
  modularInfo: {
    hobbies: string[];
    relationshipGoals: string[];
    ageRange: string;
    currentMood: string;
    availability: string;
    interests: string[];
  };
  privacySettings: {
    showHobbies: boolean;
    showRelationshipGoals: boolean;
    showAgeRange: boolean;
    showCurrentMood: boolean;
    showAvailability: boolean;
    showInterests: boolean;
  };
  onUpdateModularInfo: (field: keyof ModularInfoPanelProps['modularInfo'], value: any) => void;
  onTogglePrivacy: (setting: keyof ModularInfoPanelProps['privacySettings']) => void;
  isLocationSharing: boolean;
  onStartLocationSharing: () => void;
  onStopLocationSharing: () => void;
  locationError: string;
}

const PREDEFINED_HOBBIES = [
  'hiking', 'photography', 'cooking', 'reading', 'gaming', 'music', 'dancing', 
  'traveling', 'fitness', 'art', 'writing', 'sports', 'yoga', 'meditation',
  'gardening', 'movies', 'tech', 'crafts', 'volunteering', 'learning'
];

const PREDEFINED_INTERESTS = [
  'tech', 'art', 'music', 'food', 'travel', 'books', 'movies', 'fitness',
  'nature', 'science', 'business', 'education', 'health', 'spirituality',
  'politics', 'environment', 'fashion', 'design', 'photography', 'sports'
];

const RELATIONSHIP_GOALS = [
  'friendship', 'dating', 'networking', 'collaboration', 'mentorship', 
  'activity partner', 'travel buddy', 'study group', 'casual hangout'
];

const AGE_RANGES = ['teens', '20s', '30s', '40s', '50s', '60+'];

const AVAILABILITY_OPTIONS = [
  'open to chat', 'busy', 'available for quick chat', 'do not disturb', 
  'looking for activity partner', 'free for coffee', 'working'
];

const MOOD_EMOJIS = [
  '😊', '😎', '🤔', '😴', '🔥', '🌟', '☕', '🎵', '📚', '🏃‍♂️', 
  '🎨', '🌱', '💡', '🎯', '⚡', '🌈', '🧘‍♀️', '🍕', '🎮', '✨'
];

export default function ModularInfoPanel({
  modularInfo,
  privacySettings,
  onUpdateModularInfo,
  onTogglePrivacy,
  isLocationSharing,
  onStartLocationSharing,
  onStopLocationSharing,
  locationError
}: ModularInfoPanelProps) {
  const [showHobbyInput, setShowHobbyInput] = useState(false);
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [newHobby, setNewHobby] = useState('');
  const [newInterest, setNewInterest] = useState('');

  const addHobby = (hobby: string) => {
    if (hobby && !modularInfo.hobbies.includes(hobby)) {
      onUpdateModularInfo('hobbies', [...modularInfo.hobbies, hobby]);
    }
    setNewHobby('');
    setShowHobbyInput(false);
  };

  const removeHobby = (hobby: string) => {
    onUpdateModularInfo('hobbies', modularInfo.hobbies.filter(h => h !== hobby));
  };

  const addInterest = (interest: string) => {
    if (interest && !modularInfo.interests.includes(interest)) {
      onUpdateModularInfo('interests', [...modularInfo.interests, interest]);
    }
    setNewInterest('');
    setShowInterestInput(false);
  };

  const removeInterest = (interest: string) => {
    onUpdateModularInfo('interests', modularInfo.interests.filter(i => i !== interest));
  };

  const toggleRelationshipGoal = (goal: string) => {
    const goals = modularInfo.relationshipGoals.includes(goal)
      ? modularInfo.relationshipGoals.filter(g => g !== goal)
      : [...modularInfo.relationshipGoals, goal];
    onUpdateModularInfo('relationshipGoals', goals);
  };

  const PrivacyToggle = ({ 
    label, 
    field, 
    enabled, 
    description 
  }: { 
    label: string; 
    field: string; 
    enabled: boolean; 
    description: string;
  }) => (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
      <div className="flex-1">
        <div className="font-medium text-white">{label}</div>
        <div className="text-sm text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => onTogglePrivacy(field as keyof ModularInfoPanelProps['privacySettings'])}
        className={`w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-green-500' : 'bg-gray-500'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Your Opt-In Settings</h2>
        <p className="text-gray-300 text-sm">
          Choose what information you want to share with nearby people. Privacy first - everything is off by default.
        </p>
      </div>

      {/* Location Sharing Control */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">📍 Location Sharing</h3>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Broadcast Location</span>
            <button
              onClick={isLocationSharing ? onStopLocationSharing : onStartLocationSharing}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isLocationSharing 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLocationSharing ? 'Stop Sharing' : 'Start Sharing'}
            </button>
          </div>
          {locationError && (
            <div className="text-red-400 text-sm">{locationError}</div>
          )}
          <div className="text-sm text-gray-400">
            {isLocationSharing 
              ? 'Your location is being shared anonymously with nearby people'
              : 'Enable to see and be seen by nearby people'
            }
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">🎂 Age Range</h3>
        <select
          value={modularInfo.ageRange}
          onChange={(e) => onUpdateModularInfo('ageRange', e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="">Select age range</option>
          {AGE_RANGES.map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
        <PrivacyToggle
          label="Share Age Range"
          field="showAgeRange"
          enabled={privacySettings.showAgeRange}
          description="Let others see your approximate age"
        />
      </div>

      {/* Current Mood */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">😊 Current Mood</h3>
        <div className="grid grid-cols-6 gap-2">
          {MOOD_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onUpdateModularInfo('currentMood', emoji)}
              className={`p-3 text-2xl rounded-lg transition-colors ${
                modularInfo.currentMood === emoji 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <PrivacyToggle
          label="Share Current Mood"
          field="showCurrentMood"
          enabled={privacySettings.showCurrentMood}
          description="Show your current mood emoji"
        />
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">💬 Availability</h3>
        <select
          value={modularInfo.availability}
          onChange={(e) => onUpdateModularInfo('availability', e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {AVAILABILITY_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <PrivacyToggle
          label="Share Availability"
          field="showAvailability"
          enabled={privacySettings.showAvailability}
          description="Let others know if you're open to chat"
        />
      </div>

      {/* Hobbies */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">🎯 Hobbies</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {modularInfo.hobbies.map(hobby => (
            <span 
              key={hobby}
              className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {hobby}
              <button
                onClick={() => removeHobby(hobby)}
                className="text-blue-200 hover:text-white ml-1"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        
        {!showHobbyInput ? (
          <button
            onClick={() => setShowHobbyInput(true)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            + Add hobby
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              placeholder="Enter hobby"
              className="flex-1 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addHobby(newHobby)}
            />
            <button
              onClick={() => addHobby(newHobby)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowHobbyInput(false)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {PREDEFINED_HOBBIES.filter(h => !modularInfo.hobbies.includes(h)).map(hobby => (
            <button
              key={hobby}
              onClick={() => addHobby(hobby)}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              + {hobby}
            </button>
          ))}
        </div>
        
        <PrivacyToggle
          label="Share Hobbies"
          field="showHobbies"
          enabled={privacySettings.showHobbies}
          description="Show your hobbies to nearby people"
        />
      </div>

      {/* Interests */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">💡 Interests</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {modularInfo.interests.map(interest => (
            <span 
              key={interest}
              className="bg-green-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {interest}
              <button
                onClick={() => removeInterest(interest)}
                className="text-green-200 hover:text-white ml-1"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        
        {!showInterestInput ? (
          <button
            onClick={() => setShowInterestInput(true)}
            className="text-green-400 hover:text-green-300 text-sm"
          >
            + Add interest
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Enter interest"
              className="flex-1 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && addInterest(newInterest)}
            />
            <button
              onClick={() => addInterest(newInterest)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
            >
              Add
            </button>
            <button
              onClick={() => setShowInterestInput(false)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {PREDEFINED_INTERESTS.filter(i => !modularInfo.interests.includes(i)).map(interest => (
            <button
              key={interest}
              onClick={() => addInterest(interest)}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              + {interest}
            </button>
          ))}
        </div>
        
        <PrivacyToggle
          label="Share Interests"
          field="showInterests"
          enabled={privacySettings.showInterests}
          description="Show your interests to nearby people"
        />
      </div>

      {/* Relationship Goals */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-white">💫 Looking For</h3>
        <div className="space-y-2">
          {RELATIONSHIP_GOALS.map(goal => (
            <label key={goal} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={modularInfo.relationshipGoals.includes(goal)}
                onChange={() => toggleRelationshipGoal(goal)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-white">{goal}</span>
            </label>
          ))}
        </div>
        <PrivacyToggle
          label="Share What You're Looking For"
          field="showRelationshipGoals"
          enabled={privacySettings.showRelationshipGoals}
          description="Let others know what kind of connections you seek"
        />
      </div>

      {/* Privacy Summary */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Privacy Summary</h4>
        <div className="text-sm text-gray-300">
          You're sharing {Object.values(privacySettings).filter(Boolean).length} out of 6 possible information types.
          {!isLocationSharing && (
            <div className="text-yellow-400 mt-1">
              ⚠️ Location sharing is disabled - you won&rsquo;t appear on the map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 