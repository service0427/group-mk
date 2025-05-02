// 임시로 필요한 컴포넌트 제공
import React from 'react';

// 임포넌트 인터페이스
interface ProfileComponentProps {
  title?: string;
}

// 임시 컴포넌트들 (props 타입 설정)
export const DefaultProfile: React.FC = () => {
  return React.createElement('div', { className: 'default-profile' });
};

export const About: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-about' }, props.title || 'About');
};

export const CommunityBadges: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-community-badges' }, props.title || 'Community Badges');
};

export const Connections: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-connections' }, props.title || 'Connections');
};

export const Contributions: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-contributions' }, props.title || 'Contributions');
};

export const Projects: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-projects' }, props.title || 'Projects');
};

export const WorkExperience: React.FC<ProfileComponentProps> = (props) => {
  return React.createElement('div', { className: 'profile-work-experience' }, props.title || 'Work Experience');
};

export default {
  DefaultProfile,
  About,
  CommunityBadges,
  Connections,
  Contributions,
  Projects,
  WorkExperience
};