import React, { useState, useEffect } from 'react';
import { AccessibleButton } from '../Accessible';
import { ProfileForm } from './ProfileForm';

/**
 * ProfilePanel - Main profile display and management component
 *
 * Features:
 * - Display user profile information
 * - Toggle edit mode
 * - Show loading and error states
 * - Keyboard navigation support
 * - Accessible to screen readers
 */
export const ProfilePanel = ({
  profile,
  loading = false,
  error = null,
  onFetch,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Fetch profile on mount only
  useEffect(() => {
    if (!profile) {
      onFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  if (loading) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#666',
        }}
      >
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          padding: '16px',
          color: '#d32f2f',
        }}
      >
        <p>Unable to load profile</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <ProfileForm
        profile={profile}
        loading={loading}
        onSubmit={async (updates) => {
          await onUpdate(updates);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  // Display mode
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ marginBottom: '8px' }}>Profile</h3>

        <div style={{ marginBottom: '12px' }}>
          <strong>Name:</strong> {profile.username}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Email:</strong> {profile.email}
        </div>

        {profile.bio && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Bio:</strong>
            <p style={{ margin: '4px 0', wordWrap: 'break-word' }}>
              {profile.bio}
            </p>
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <strong>Theme:</strong> {(profile.theme || 'light').charAt(0).toUpperCase() + (profile.theme || 'light').slice(1)}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <strong>Notifications:</strong>{' '}
          {profile.notifications_enabled ? 'Enabled' : 'Disabled'}
        </div>

        {profile.avatar_path && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Avatar:</strong>
            <div>
              <img
                src={profile.avatar_path}
                alt="User avatar"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  marginTop: '8px',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <AccessibleButton
        onClick={() => setIsEditing(true)}
        ariaLabel="Edit profile"
      >
        Edit Profile
      </AccessibleButton>
    </div>
  );
};
