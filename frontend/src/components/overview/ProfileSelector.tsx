'use client';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import type { ProfileName } from '@/lib/columnProfiles';

interface ProfileSelectorProps {
  value: ProfileName;
  onChange: (profile: ProfileName) => void;
}

const PROFILE_OPTIONS: { value: ProfileName; label: string }[] = [
  { value: 'All', label: 'All Columns' },
  { value: 'Scheduler', label: 'Scheduler' },
  { value: 'Trader', label: 'Trader' },
  { value: 'Quality', label: 'Quality' },
  { value: 'Custom', label: 'Custom' },
];

export default function ProfileSelector({ value, onChange }: ProfileSelectorProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as ProfileName);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel
        id="profile-select-label"
        sx={{
          color: 'text.secondary',
          '&.Mui-focused': { color: 'var(--color-accent-cyan)' },
        }}
      >
        Profile
      </InputLabel>
      <Select
        labelId="profile-select-label"
        id="profile-select"
        value={value}
        label="Profile"
        onChange={handleChange}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(0, 229, 255, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-accent-cyan)',
          },
        }}
      >
        {PROFILE_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
